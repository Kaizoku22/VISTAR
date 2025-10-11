const express = require('express');
const router = express.Router();
const db = require('./database.js');
const supabase = db.supabase;

router.get('/:schoolId', async (req, res) => {
    const { schoolId } = req.params;
    const { standard_id, division_id, name } = req.query;

  try {
      let query = supabase
        .from('students')
        .select('*')
        .eq('school_id', schoolId);

      // UUID-based filtering only
      if (standard_id) query.eq('standard_id', standard_id);
      if (division_id) query.eq('division_id', division_id);

      // Optional name search (firstname or lastname contains term, case-insensitive)
      const term = typeof name === 'string' ? name.trim() : '';
      if (term) {
        try {
          query = query.or(`firstname.ilike.%${term}%,lastname.ilike.%${term}%`);
        } catch (e) {
          // If 'or' not supported or error occurs, fall back to post-filtering below
        }
      }

      let { data, error } = await query;

      // Fallback: if name search caused an error or not supported, fetch by school and filter in memory
      if ((error && term) || (!error && term && !Array.isArray(data))) {
        const retry = await supabase
          .from('students')
          .select('*')
          .eq('school_id', schoolId);
        data = retry.data;
        error = retry.error;
        if (!error && Array.isArray(data)) {
          const t = term.toLowerCase();
          data = data.filter(s =>
            String(s.firstname || '').toLowerCase().includes(t) ||
            String(s.lastname || '').toLowerCase().includes(t)
          );
          if (standard_id) data = data.filter(s => String(s.standard_id || '') === String(standard_id));
          if (division_id) data = data.filter(s => String(s.division_id || '') === String(division_id));
        }
      }

      if (error) throw error;
      // Ensure ascending order by roll_no numerically
      const sorted = Array.isArray(data)
        ? [...data].sort((a, b) => {
            const ra = Number(a?.roll_no ?? Infinity);
            const rb = Number(b?.roll_no ?? Infinity);
            if (Number.isNaN(ra) && Number.isNaN(rb)) return 0;
            if (Number.isNaN(ra)) return 1;
            if (Number.isNaN(rb)) return -1;
            return ra - rb;
          })
        : data;

      res.status(200).json(sorted);
    } catch (err) {
      console.error('Error fetching students:', err.message);
      res.status(500).json({ error: err.message });
    }
});


router.post('/', async (req, res) => {
    const { firstname, lastname, address, roll_no, school_id, standard_id, division_id, standard, div } = req.body;

    if (!firstname || !lastname || !address || !roll_no || !school_id || (!standard_id && !standard) || (!division_id && !div)) {
        return res.status(400).json({ error: 'firstname, lastname, address, roll_no, school_id and either standard_id/division_id or standard/div are required' });
    }

    // Build the insert payload preferring IDs
    const insertPayload = {
        firstname,
        lastname,
        address,
        roll_no: String(roll_no),
        school_id
    };

    if (standard_id) insertPayload.standard_id = standard_id;
    if (division_id) insertPayload.division_id = division_id;

    if (!standard_id || !division_id) {
        // Legacy text fields fallback if IDs not provided
        if (standard) insertPayload.standard = String(standard);
        if (div) insertPayload.div = String(div);
    }

    try {
        let { data, error } = await supabase
            .from('students')
            .insert([insertPayload])
            .select();

        // Fallback: if ID columns do not exist, try inserting with text names
        if (error && (error.message?.includes('column "standard_id"') || error.message?.includes('column "division_id"'))) {
            // Try to resolve names from IDs if provided
            let stdName = standard;
            let divName = div;
            try {
                if (standard_id && !stdName) {
                    const { data: stdData } = await supabase.from('standards').select('std').eq('id', standard_id).limit(1);
                    stdName = stdData?.[0]?.std || standard_id;
                }
                if (division_id && !divName) {
                    const { data: divData } = await supabase.from('divisions').select('division').eq('div_id', division_id).limit(1);
                    divName = divData?.[0]?.division || division_id;
                }
            } catch {}

            const legacyPayload = {
                firstname,
                lastname,
                address,
                roll_no: String(roll_no),
                school_id,
                standard: String(stdName || ''),
                div: String(divName || '')
            };

            const retry = await supabase.from('students').insert([legacyPayload]).select();
            data = retry.data;
            error = retry.error;
        }

        if (error) {
            console.error('Supabase insert error enrolling student:', error);
            return res.status(500).json({ error: error.message || 'Failed to enroll student' });
        }

        res.status(201).json({ message: 'Student enrolled successfully', student: data?.[0] });
    } catch (err) {
        console.error('Unexpected error enrolling student:', err);
        res.status(500).json({ error: err.message || 'Failed to enroll student' });
    }
});

router.put('/:student_id', async (req, res) => {
  const { student_id } = req.params;
  const {
    firstname,
    lastname,
    address,
    standard_id,
    division_id,
    roll_no,
    standard, // legacy
    div       // legacy
  } = req.body;

  try {
    // Prefer updating UUID columns
    let { data, error } = await supabase
      .from('students')
      .update({
        firstname,
        lastname,
        address,
        standard_id,
        division_id,
        roll_no
      })
      .eq('student_id', student_id)
      .select();

    // Fallback: if ID columns do not exist, update legacy text fields using resolved names
    if (error && (error.message?.includes('column "standard_id"') || error.message?.includes('column "division_id"'))) {
      let stdName = standard;
      let divName = div;
      try {
        if (standard_id && !stdName) {
          const { data: stdData } = await supabase.from('standards').select('std').eq('id', standard_id).limit(1);
          stdName = stdData?.[0]?.std || standard_id;
        }
        if (division_id && !divName) {
          const { data: divData } = await supabase.from('divisions').select('division').eq('div_id', division_id).limit(1);
          divName = divData?.[0]?.division || division_id;
        }
      } catch {}

      const retry = await supabase
        .from('students')
        .update({
          firstname,
          lastname,
          address,
          standard: stdName,
          div: divName,
          roll_no
        })
        .eq('student_id', student_id)
        .select();
      data = retry.data;
      error = retry.error;
    }

    if (error) throw error;

    res.status(200).json(data?.[0]);
  } catch (err) {
    console.error('Error updating student:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:student_id', async (req, res) => {
  const { student_id } = req.params;
  try {
    const { error } = await supabase
      .from('students')
      .delete()
      .eq('student_id', student_id);

    if (error) throw error;

    res.status(204).send(); // No Content
  } catch (err) {
    console.error('Error deleting student:', err.message);
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;