const express = require('express');
const router = express.Router();
const db = require('./database.js');
const supabase = db.supabase;

// Create a marksheet header
router.post('/', async (req, res) => {
  try {
    const {
      school_id,
      standard_id,
      division_id,
      standard, // optional text name fallback
      div,      // optional text name fallback
      exam_name,
      exam_date,
      term,
      created_by
    } = req.body || {};

    if (!school_id || !exam_name || !exam_date || !created_by) {
      return res.status(400).json({ error: 'school_id, exam_name, exam_date, created_by are required' });
    }

    // Resolve standard/division to UUIDs if text provided
    let stdId = standard_id || null;
    let divId = division_id || null;

    // Helper to normalize text
    const norm = (v) => String(v || '').trim().toLowerCase();

    if (!stdId && standard) {
      try {
        const { data: stdRows, error: stdErr } = await supabase
          .from('standards')
          .select('id, std, school_id')
          .eq('school_id', school_id);
        if (stdErr) throw stdErr;
        const match = (stdRows || []).find(r => norm(r.std) === norm(standard));
        stdId = match?.id || null;
      } catch (e) {
        // ignore, handled below
      }
    }

    if (!divId && div) {
      try {
        const { data: divRows, error: divErr } = await supabase
          .from('divisions')
          .select('div_id, division, school_id')
          .eq('school_id', school_id);
        if (divErr) throw divErr;
        const match = (divRows || []).find(r => norm(r.division) === norm(div));
        divId = match?.div_id || null;
      } catch (e) {
        // ignore, handled below
      }
    }

    if (!stdId || !divId) {
      return res.status(400).json({ error: 'standard_id and division_id are required (text names could not be resolved)' });
    }

    // Generate UUID for marksheet_id since table lacks default
    let marksheet_id = null;
    try {
      marksheet_id = require('crypto').randomUUID();
    } catch (e) {
      // Fallback simple generator
      marksheet_id = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
    }

    const insertPayload = {
      marksheet_id,
      school_id,
      standard_id: stdId,
      division_id: divId,
      exam_name,
      exam_date,
      term: term || null,
      created_by,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('marksheets')
      .insert([insertPayload])
      .select();
    if (error) {
      console.error('Error creating marksheet:', error);
      return res.status(500).json({ error: error.message || 'Failed to create marksheet' });
    }

    return res.status(201).json(data?.[0] || insertPayload);
  } catch (err) {
    console.error('Unexpected error creating marksheet:', err);
    return res.status(500).json({ error: err.message || 'Failed to create marksheet' });
  }
});

// List marksheets for a school
router.get('/:school_id', async (req, res) => {
  const { school_id } = req.params;
  try {
    const { data, error } = await supabase
      .from('marksheets')
      .select('*')
      .eq('school_id', school_id)
      .order('created_at', { ascending: false, nullsFirst: false });
    if (error) throw error;
    return res.json(Array.isArray(data) ? data : []);
  } catch (err) {
    console.error('Error listing marksheets:', err);
    return res.status(500).json({ error: err.message || 'Failed to list marksheets' });
  }
});

// Get single marksheet header
router.get('/header/:marksheet_id', async (req, res) => {
  const { marksheet_id } = req.params;
  try {
    const { data, error } = await supabase
      .from('marksheets')
      .select('*')
      .eq('marksheet_id', marksheet_id)
      .single();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Marksheet not found' });
    return res.json(data);
  } catch (err) {
    console.error('Error fetching marksheet:', err);
    return res.status(500).json({ error: err.message || 'Failed to fetch marksheet' });
  }
});

// Get marks entries for a marksheet (with joined names for convenience)
router.get('/entries/:marksheet_id', async (req, res) => {
  const { marksheet_id } = req.params;
  try {
    const { data: entries, error } = await supabase
      .from('marks_entries')
      .select('*')
      .eq('marksheet_id', marksheet_id);
    if (error) throw error;

    // Best-effort enrichment: map subject_id -> subject_name and student_id -> fullname
    const subjIds = [...new Set((entries || []).map(e => e.subject_id).filter(Boolean))];
    const stuIds = [...new Set((entries || []).map(e => e.student_id).filter(Boolean))];

    let subjectMap = {};
    let studentMap = {};

    if (subjIds.length > 0) {
      const { data: subjects } = await supabase
        .from('subjects')
        .select('subject_id, subject_name')
        .in('subject_id', subjIds);
      subjectMap = (subjects || []).reduce((acc, s) => { acc[s.subject_id] = s.subject_name; return acc; }, {});
    }

    if (stuIds.length > 0) {
      const { data: students } = await supabase
        .from('students')
        .select('student_id, firstname, lastname, roll_no')
        .in('student_id', stuIds);
      studentMap = (students || []).reduce((acc, s) => { acc[s.student_id] = { name: `${s.firstname || ''} ${s.lastname || ''}`.trim(), roll_no: s.roll_no }; return acc; }, {});
    }

    const enriched = (entries || []).map(e => ({
      ...e,
      subject_name: subjectMap[e.subject_id] || null,
      student_name: (studentMap[e.student_id]?.name) || null,
      roll_no: (studentMap[e.student_id]?.roll_no) || null
    }));

    return res.json(enriched);
  } catch (err) {
    console.error('Error listing marks entries:', err);
    return res.status(500).json({ error: err.message || 'Failed to list marks entries' });
  }
});

// Get marks entries for a specific student within a marksheet
router.get('/entries/:marksheet_id/student/:student_id', async (req, res) => {
  const { marksheet_id, student_id } = req.params;
  try {
    const { data: entries, error } = await supabase
      .from('marks_entries')
      .select('*')
      .eq('marksheet_id', marksheet_id)
      .eq('student_id', student_id);
    if (error) throw error;

    const subjIds = [...new Set((entries || []).map(e => e.subject_id).filter(Boolean))];
    const stuIds = entries && entries.length > 0 ? [student_id] : [];

    let subjectMap = {};
    let studentMap = {};
    if (subjIds.length > 0) {
      const { data: subjects } = await supabase
        .from('subjects')
        .select('subject_id, subject_name')
        .in('subject_id', subjIds);
      subjectMap = (subjects || []).reduce((acc, s) => { acc[s.subject_id] = s.subject_name; return acc; }, {});
    }

    if (stuIds.length > 0) {
      const { data: students } = await supabase
        .from('students')
        .select('student_id, firstname, lastname, roll_no')
        .in('student_id', stuIds);
      studentMap = (students || []).reduce((acc, s) => { acc[s.student_id] = { name: `${s.firstname || ''} ${s.lastname || ''}`.trim(), roll_no: s.roll_no }; return acc; }, {});
    }

    const enriched = (entries || []).map(e => ({
      ...e,
      subject_name: subjectMap[e.subject_id] || null,
      student_name: (studentMap[e.student_id]?.name) || null,
      roll_no: (studentMap[e.student_id]?.roll_no) || null,
    }));

    return res.json(enriched);
  } catch (err) {
    console.error('Error listing marks entries by student:', err);
    return res.status(500).json({ error: err.message || 'Failed to list marks entries by student' });
  }
});

// Save entries: replace existing entries for a marksheet
router.post('/entries/save', async (req, res) => {
  const { marksheet_id, entries } = req.body || {};
  if (!marksheet_id || !Array.isArray(entries)) {
    return res.status(400).json({ error: 'marksheet_id and entries[] are required' });
  }
  try {
    // Delete existing entries for this marksheet
    const { error: delErr } = await supabase
      .from('marks_entries')
      .delete()
      .eq('marksheet_id', marksheet_id);
    if (delErr) throw delErr;

    // Prepare insert payloads, ensure each has a UUID for marks_entry_id
    const toInsert = entries.map(e => ({
      marks_entry_id: (function() { try { return require('crypto').randomUUID(); } catch { return `${Date.now()}_${Math.random().toString(36).slice(2)}`; } })(),
      marksheet_id,
      student_id: e.student_id,
      subject_id: e.subject_id,
      max_marks: (e.max_marks == null ? null : Number(e.max_marks)),
      obtained_marks: (e.obtained_marks == null ? null : Number(e.obtained_marks)),
      percent: (e.percent == null ? null : Number(e.percent)),
      grade: e.grade || null
    }));

    const { data, error } = await supabase
      .from('marks_entries')
      .insert(toInsert)
      .select();
    if (error) throw error;
    return res.status(201).json(Array.isArray(data) ? data : []);
  } catch (err) {
    console.error('Error saving marks entries:', err);
    return res.status(500).json({ error: err.message || 'Failed to save marks entries' });
  }
});

// Delete a marksheet and all its entries
router.delete('/:marksheet_id', async (req, res) => {
  const { marksheet_id } = req.params;
  if (!marksheet_id) return res.status(400).json({ error: 'marksheet_id is required' });
  try {
    // First delete entries for this marksheet
    const { error: entriesErr } = await supabase
      .from('marks_entries')
      .delete()
      .eq('marksheet_id', marksheet_id);
    if (entriesErr) throw entriesErr;

    // Then delete the marksheet header
    const { error: headerErr } = await supabase
      .from('marksheets')
      .delete()
      .eq('marksheet_id', marksheet_id);
    if (headerErr) throw headerErr;

    return res.json({ ok: true });
  } catch (err) {
    console.error('Error deleting marksheet:', err);
    return res.status(500).json({ error: err.message || 'Failed to delete marksheet' });
  }
});

module.exports = router;