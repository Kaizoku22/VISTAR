const express = require('express');
const router = express.Router();
const db = require('./database.js');
const supabase = db.supabase;
const ExcelJS = require('exceljs');

// Helper: check whether user can manage a lecture session for this school
async function getUserScope(school_id, user_id) {
  try {
    // Is creator?
    const { data: school, error: schoolErr } = await supabase
      .from('schools')
      .select('creator')
      .eq('school_id', school_id)
      .single();
    if (schoolErr) throw schoolErr;
    const isCreator = school && String(school.creator) === String(user_id);
    if (isCreator) return { role: 'creator' };

    // Is joined teacher?
    const { data: joined, error: joinErr } = await supabase
      .from('school_joined')
      .select('role')
      .eq('school_id', school_id)
      .eq('user_id', user_id)
      .eq('role', 'teacher');
    if (joinErr) throw joinErr;
    if ((joined || []).length > 0) return { role: 'teacher' };
    return { role: 'none' };
  } catch (e) {
    return { role: 'none', error: e };
  }
}

// Get available lectures for user in a school
router.get('/available-lectures/:school_id', async (req, res) => {
  const { school_id } = req.params;
  const { user_id } = req.query;
  try {
    if (!user_id) return res.status(400).json({ error: 'user_id is required' });
    const scope = await getUserScope(school_id, user_id);
    if (scope.role === 'none') return res.status(403).json({ error: 'Not authorized' });

    let query = supabase.from('lectures').select('*').eq('school_id', school_id);
    // If user is a joined teacher, restrict to lectures assigned to them
    if (scope.role === 'teacher') {
      query = query.eq('teacher_id', user_id);
    }

    const { data, error } = await query;
    if (error) throw error;
    return res.json(data || []);
  } catch (err) {
    console.error('Error fetching available lectures:', err);
    return res.status(500).json({ error: err.message || 'Failed to fetch lectures' });
  }
});

// Create a lecture session and return enrolled students for that lecture
router.post('/sessions', async (req, res) => {
  const { lecture_id, started_at, completed_at, school_id, user_id } = req.body;
  if (!lecture_id || !started_at || !school_id || !user_id) {
    return res.status(400).json({ error: 'lecture_id, started_at, school_id, user_id are required' });
  }
  try {
    // Permission check
    const scope = await getUserScope(school_id, user_id);
    if (scope.role === 'none') return res.status(403).json({ error: 'Not authorized' });

    // If teacher, ensure lecture is assigned
    if (scope.role === 'teacher') {
      const { data: lectureCheck, error: lcErr } = await supabase
        .from('lectures')
        .select('lecture_id')
        .eq('lecture_id', lecture_id)
        .eq('school_id', school_id)
        .eq('teacher_id', user_id)
        .single();
      if (lcErr || !lectureCheck) return res.status(403).json({ error: 'Not assigned to this lecture' });
    }

    // Insert session
    const insertPayload = { lecture_id, started_at, completed_at: completed_at || null };
    const { data: sessionRows, error: insertErr } = await supabase
      .from('lecture_session')
      .insert([insertPayload])
      .select();
    if (insertErr) throw insertErr;
    const session = sessionRows?.[0] || insertPayload;

    // Fetch lecture to derive standard/div
    const { data: lecture, error: lectureErr } = await supabase
      .from('lectures')
      .select('standard, div, school_id')
      .eq('lecture_id', lecture_id)
      .single();
    if (lectureErr) throw lectureErr;

    // Fetch students matching the lecture standard/div (try by names first, fallback to IDs)
    // Ensure ascending ordering by roll_no for a consistent UI experience
    let students = [];
    const byNames = await supabase
      .from('students')
      .select('*')
      .eq('school_id', school_id)
      .eq('standard', lecture.standard)
      .eq('div', lecture.div)
      .order('roll_no', { ascending: true, nullsFirst: false });
    if (!byNames.error && Array.isArray(byNames.data)) students = byNames.data;

    if (!students || students.length === 0) {
      const byIds = await supabase
        .from('students')
        .select('*')
        .eq('school_id', school_id)
        .eq('standard_id', lecture.standard)
        .eq('division_id', lecture.div)
        .order('roll_no', { ascending: true, nullsFirst: false });
      if (!byIds.error && Array.isArray(byIds.data)) students = byIds.data;
    }

    return res.status(201).json({ session, students });
  } catch (err) {
    console.error('Error creating lecture session:', err);
    return res.status(500).json({ error: err.message || 'Failed to create session' });
  }
});

// List sessions for a school (optionally filter by lecture_id)
router.get('/sessions/:school_id', async (req, res) => {
  const { school_id } = req.params;
  const { lecture_id } = req.query;
  try {
    let query = supabase.from('lecture_session').select('*');
    if (lecture_id) query = query.eq('lecture_id', lecture_id);
    // Note: lecture_session doesn’t store school_id; derive via lecture join (best effort)
    const { data: sessions, error } = await query;
    if (error) throw error;
    return res.json(sessions || []);
  } catch (err) {
    console.error('Error listing sessions:', err);
    return res.status(500).json({ error: err.message || 'Failed to list sessions' });
  }
});

// Delete a session
router.delete('/sessions/:session_id', async (req, res) => {
  const { session_id } = req.params;
  try {
    // First delete attendance rows tied to this session
    const { error: attErr } = await supabase
      .from('attendance')
      .delete()
      .eq('lecture_session_id', session_id);
    if (attErr) throw attErr;

    // Then delete the session itself
    const { error: sessErr } = await supabase
      .from('lecture_session')
      .delete()
      .eq('lecture_session_id', session_id);
    if (sessErr) throw sessErr;

    return res.status(204).send();
  } catch (err) {
    console.error('Error deleting session:', err);
    return res.status(500).json({ error: err.message || 'Failed to delete session' });
  }
});

// Fetch students for a given session (ordered by ascending roll_no)
router.get('/sessions/:session_id/students', async (req, res) => {
  const { session_id } = req.params;
  try {
    // Get session to derive lecture
    const { data: session, error: sErr } = await supabase
      .from('lecture_session')
      .select('lecture_id')
      .eq('lecture_session_id', session_id)
      .single();
    if (sErr) throw sErr;
    if (!session) return res.status(404).json({ error: 'Session not found' });

    // Get lecture to derive school/standard/div
    const { data: lecture, error: lErr } = await supabase
      .from('lectures')
      .select('school_id, standard, div')
      .eq('lecture_id', session.lecture_id)
      .single();
    if (lErr) throw lErr;
    if (!lecture) return res.status(404).json({ error: 'Lecture not found for session' });

    // Fetch students by names first, fallback to id columns. Order by roll_no.
    let students = [];
    const byNames = await supabase
      .from('students')
      .select('*')
      .eq('school_id', lecture.school_id)
      .eq('standard', lecture.standard)
      .eq('div', lecture.div)
      .order('roll_no', { ascending: true, nullsFirst: false });
    if (!byNames.error && byNames.data) students = byNames.data;

    if (!students || students.length === 0) {
      const byIds = await supabase
        .from('students')
        .select('*')
        .eq('school_id', lecture.school_id)
        .eq('standard_id', lecture.standard)
        .eq('division_id', lecture.div)
        .order('roll_no', { ascending: true, nullsFirst: false });
      if (!byIds.error && byIds.data) students = byIds.data;
    }

    return res.json(students || []);
  } catch (err) {
    console.error('Error fetching session students:', err);
    return res.status(500).json({ error: err.message || 'Failed to fetch session students' });
  }
});

// Mark attendance (present/absent) for a student in a session
router.post('/mark', async (req, res) => {
  const { lecture_session_id, student_id, attendance } = req.body || {};
  if (!lecture_session_id || !student_id || typeof attendance !== 'boolean') {
    return res.status(400).json({ error: 'lecture_session_id, student_id, attendance(boolean) are required' });
  }
  try {
    // Check if a row already exists for this student/session
    const { data: existing, error: selErr } = await supabase
      .from('attendance')
      .select('attendance_id')
      .eq('lecture_session_id', lecture_session_id)
      .eq('student_id', student_id)
      .limit(1);
    if (selErr) throw selErr;

    if (existing && existing.length > 0) {
      const attendance_id = existing[0].attendance_id;
      const { data, error } = await supabase
        .from('attendance')
        .update({ attendance })
        .eq('attendance_id', attendance_id)
        .select();
      if (error) throw error;
      return res.json({ updated: true, row: data?.[0] });
    } else {
      const { data, error } = await supabase
        .from('attendance')
        .insert([{ lecture_session_id, student_id, attendance }])
        .select();
      if (error) throw error;
      return res.status(201).json({ created: true, row: data?.[0] });
    }
  } catch (err) {
    console.error('Error marking attendance:', err);
    return res.status(500).json({ error: err.message || 'Failed to mark attendance' });
  }
});

// Get attendance rows for a session, enriched with student info
router.get('/sessions/:session_id/attendance', async (req, res) => {
  const { session_id } = req.params;
  try {
    const { data: rows, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('lecture_session_id', session_id);
    if (error) throw error;

    const studentIds = (rows || []).map(r => r.student_id).filter(Boolean);
    let studentsMap = {};
    if (studentIds.length > 0) {
      const { data: students, error: sErr } = await supabase
        .from('students')
        .select('student_id, firstname, lastname, roll_no');
      if (sErr) throw sErr;
      studentsMap = (students || []).reduce((acc, s) => { acc[s.student_id] = s; return acc; }, {});
    }

    const merged = (rows || []).map(r => ({
      attendance_id: r.attendance_id,
      lecture_session_id: r.lecture_session_id,
      student_id: r.student_id,
      attendance: r.attendance,
      firstname: studentsMap[r.student_id]?.firstname || '',
      lastname: studentsMap[r.student_id]?.lastname || '',
      roll_no: studentsMap[r.student_id]?.roll_no || null,
    })).sort((a, b) => (a.roll_no ?? 0) - (b.roll_no ?? 0));

    return res.json(merged);
  } catch (err) {
    console.error('Error fetching session attendance:', err);
    return res.status(500).json({ error: err.message || 'Failed to fetch attendance' });
  }
});

// Get session details enriched with lecture/subject/teacher and class info
router.get('/sessions/:session_id/details', async (req, res) => {
  const { session_id } = req.params;
  try {
    // Session
    const { data: session, error: sErr } = await supabase
      .from('lecture_session')
      .select('lecture_session_id, lecture_id, started_at, completed_at')
      .eq('lecture_session_id', session_id)
      .single();
    if (sErr) throw sErr;
    if (!session) return res.status(404).json({ error: 'Session not found' });

    // Lecture
    const { data: lecture, error: lErr } = await supabase
      .from('lectures')
      .select('lecture_id, lecture_name, subject_id, teacher_id, standard, div, school_id')
      .eq('lecture_id', session.lecture_id)
      .single();
    if (lErr) throw lErr;
    if (!lecture) return res.status(404).json({ error: 'Lecture not found for session' });

    // Subject name
    let subject_name = '';
    if (lecture.subject_id) {
      const { data: subj, error: subjErr } = await supabase
        .from('subjects')
        .select('subject_name')
        .eq('subject_id', lecture.subject_id)
        .single();
      if (!subjErr && subj) subject_name = subj.subject_name;
    }

    // Teacher name (from app_users)
    let teacher_name = '';
    if (lecture.teacher_id) {
      const { data: teacher, error: tErr } = await supabase
        .from('app_users')
        .select('first_name, last_name')
        .eq('id', lecture.teacher_id)
        .single();
      if (!tErr && teacher) {
        teacher_name = [teacher.first_name, teacher.last_name].filter(Boolean).join(' ').trim();
      }
    }

    // Resolve standard/division names from UUIDs per schema
    let standard_name = '';
    if (lecture.standard) {
      const { data: stdRow, error: stdErr } = await supabase
        .from('standards')
        .select('std')
        .eq('id', lecture.standard)
        .single();
      if (!stdErr && stdRow) standard_name = stdRow.std;
    }

    let division_name = '';
    if (lecture.div) {
      const { data: divRow, error: divErr } = await supabase
        .from('divisions')
        .select('division')
        .eq('div_id', lecture.div)
        .single();
      if (!divErr && divRow) division_name = divRow.division;
    }

    return res.json({
      lecture_session_id: session.lecture_session_id,
      started_at: session.started_at,
      completed_at: session.completed_at,
      lecture_id: lecture.lecture_id,
      lecture_name: lecture.lecture_name,
      subject_name,
      teacher_name,
      standard_id: lecture.standard,
      division_id: lecture.div,
      standard: standard_name || lecture.standard,
      division: division_name || lecture.div,
      school_id: lecture.school_id,
    });
  } catch (err) {
    console.error('Error fetching session details:', err);
    return res.status(500).json({ error: err.message || 'Failed to fetch session details' });
  }
});

// Monthly attendance matrix for a lecture
router.get('/lecture/:lecture_id/monthly', async (req, res) => {
  const { lecture_id } = req.params;
  const year = parseInt(req.query.year, 10) || new Date().getFullYear();
  const month = parseInt(req.query.month, 10) || (new Date().getMonth() + 1);
  try {
    // Fetch lecture for school/standard/div
    const { data: lecture, error: lErr } = await supabase
      .from('lectures')
      .select('lecture_id, school_id, standard, div')
      .eq('lecture_id', lecture_id)
      .single();
    if (lErr) throw lErr;
    if (!lecture) return res.status(404).json({ error: 'Lecture not found' });

    const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
    const endDate = new Date(Date.UTC(year, month, 1, 0, 0, 0));
    const startISO = startDate.toISOString();
    const endISO = endDate.toISOString();

    const { data: sessions, error: sErr } = await supabase
      .from('lecture_session')
      .select('lecture_session_id, started_at, completed_at')
      .eq('lecture_id', lecture_id)
      .gte('started_at', startISO)
      .lt('started_at', endISO)
      .order('started_at', { ascending: true });
    if (sErr) throw sErr;

    // Students by UUID ids first, fallback to legacy text columns
    let students = [];
    const byIds = await supabase
      .from('students')
      .select('student_id, firstname, lastname, roll_no, standard_id, division_id, standard, div')
      .eq('school_id', lecture.school_id)
      .eq('standard_id', lecture.standard)
      .eq('division_id', lecture.div)
      .order('roll_no', { ascending: true });
    if (!byIds.error && Array.isArray(byIds.data)) students = byIds.data;

    if (!students || students.length === 0) {
      const byNames = await supabase
        .from('students')
        .select('student_id, firstname, lastname, roll_no, standard, div')
        .eq('school_id', lecture.school_id)
        .eq('standard', lecture.standard)
        .eq('div', lecture.div)
        .order('roll_no', { ascending: true });
      if (!byNames.error && Array.isArray(byNames.data)) students = byNames.data;
    }

    const sessionIds = (sessions || []).map(s => s.lecture_session_id).filter(Boolean);

    let attendance = [];
    if (sessionIds.length > 0) {
      const { data: attRows, error: aErr } = await supabase
        .from('attendance')
        .select('lecture_session_id, student_id, attendance')
        .in('lecture_session_id', sessionIds);
      if (aErr) throw aErr;
      attendance = attRows || [];
    }

    return res.json({
      year,
      month,
      sessions: sessions || [],
      students: students || [],
      attendance
    });
  } catch (err) {
    console.error('Error fetching monthly attendance:', err);
    return res.status(500).json({ error: err.message || 'Failed to fetch monthly attendance' });
  }
});

// Export monthly attendance for a lecture as an Excel file
router.get('/lecture/:lecture_id/monthly/export', async (req, res) => {
  const { lecture_id } = req.params;
  const year = parseInt(req.query.year, 10) || new Date().getFullYear();
  const month = parseInt(req.query.month, 10) || (new Date().getMonth() + 1);
  // Defaulter controls via query params
  const includeDefaulter = ['yes', 'true', '1'].includes(String(req.query.defaulter || req.query.includeDefaulter || 'no').toLowerCase());
  const includeCritical = ['yes', 'true', '1'].includes(String(req.query.critical || req.query.includeCritical || 'no').toLowerCase());
  const defaulterPercent = Number(req.query.defaulter_percent ?? req.query.defaulterPercent ?? 0);
  const criticalPercent = Number(req.query.critical_percent ?? req.query.criticalPercent ?? 0);
  try {
    // Fetch lecture with names for file labeling
    const { data: lecture, error: lErr } = await supabase
      .from('lectures')
      .select('lecture_id, lecture_name, school_id, standard, div')
      .eq('lecture_id', lecture_id)
      .single();
    if (lErr) throw lErr;
    if (!lecture) return res.status(404).json({ error: 'Lecture not found' });

    const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
    const endDate = new Date(Date.UTC(year, month, 1, 0, 0, 0));
    const startISO = startDate.toISOString();
    const endISO = endDate.toISOString();

    const { data: sessions, error: sErr } = await supabase
      .from('lecture_session')
      .select('lecture_session_id, started_at, completed_at')
      .eq('lecture_id', lecture_id)
      .gte('started_at', startISO)
      .lt('started_at', endISO)
      .order('started_at', { ascending: true });
    if (sErr) throw sErr;

    // Students by UUID ids first, fallback to legacy text columns
    let students = [];
    {
      const { data: byIds, error: byIdsErr } = await supabase
        .from('students')
        .select('student_id, firstname, lastname, roll_no, standard_id, division_id, standard, div')
        .eq('school_id', lecture.school_id)
        .eq('standard_id', lecture.standard)
        .eq('division_id', lecture.div)
        .order('roll_no', { ascending: true });
      if (!byIdsErr && Array.isArray(byIds)) students = byIds;
    }

    if (!students || students.length === 0) {
      const { data: byNames, error: byNamesErr } = await supabase
        .from('students')
        .select('student_id, firstname, lastname, roll_no, standard, div')
        .eq('school_id', lecture.school_id)
        .eq('standard', lecture.standard)
        .eq('div', lecture.div)
        .order('roll_no', { ascending: true });
      if (!byNamesErr && Array.isArray(byNames)) students = byNames;
    }

    const sessionIds = (sessions || []).map(s => s.lecture_session_id).filter(Boolean);
    let attendance = [];
    if (sessionIds.length > 0) {
      const { data: attRows, error: aErr } = await supabase
        .from('attendance')
        .select('lecture_session_id, student_id, attendance')
        .in('lecture_session_id', sessionIds);
      if (aErr) throw aErr;
      attendance = attRows || [];
    }

    // Fallback: if roster lookup yielded no students but we have attendance rows,
    // derive student list from attendance and fetch their info.
    if ((!students || students.length === 0) && attendance.length > 0) {
      const uniqueIds = Array.from(new Set(attendance.map(r => r.student_id).filter(Boolean)));
      if (uniqueIds.length > 0) {
        const { data: byAtt, error: byAttErr } = await supabase
          .from('students')
          .select('student_id, firstname, lastname, roll_no')
          .in('student_id', uniqueIds)
          .order('roll_no', { ascending: true });
        if (!byAttErr && Array.isArray(byAtt)) students = byAtt;
      }
    }

    // Build quick lookup map for attendance
    const attMap = {};
    for (const r of attendance) {
      attMap[`${r.student_id}_${r.lecture_session_id}`] = !!r.attendance;
    }

    // Create workbook
    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet('Monthly Attendance');

    // Headers: Roll No, Student, per-session dates, Total
    const dateLabel = (iso) => {
      try {
        const d = new Date(iso);
        return d.toLocaleDateString(undefined);
      } catch {
        return 'Session';
      }
    };

    const headers = ['Roll No', 'Student', ...sessions.map(s => dateLabel(s.started_at)), 'Total'];
    if (includeDefaulter) headers.push('Defaulter');
    if (includeCritical) headers.push('Critical Defaulter');
    ws.addRow(headers);

    // Rows for each student
    const totalSessions = sessions.length;
    for (const st of students) {
      let total = 0;
      const cells = sessions.map(s => {
        const val = attMap[`${st.student_id}_${s.lecture_session_id}`];
        if (val === true) total += 1;
        return val === undefined ? '—' : (val ? 'present' : 'absent');
      });
      const name = [st.firstname, st.lastname].filter(Boolean).join(' ').trim();
      const percent = totalSessions > 0 ? (total / totalSessions) * 100 : 0;
      const row = [st.roll_no ?? '', name, ...cells, total];
      if (includeDefaulter) row.push(percent < defaulterPercent ? 'true' : 'false');
      if (includeCritical) row.push(percent < criticalPercent ? 'true' : 'false');
      ws.addRow(row);
    }

    // Basic styling: bold header
    ws.getRow(1).font = { bold: true };
    ws.columns = headers.map(h => ({ header: h, width: Math.max(10, String(h).length + 2) }));

    const buf = await workbook.xlsx.writeBuffer();
    const safeName = (lecture.lecture_name || 'Lecture').replace(/[^a-z0-9_\- ]/gi, '');
    const filename = `Attendance_${safeName}_${year}-${String(month).padStart(2, '0')}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(Buffer.from(buf));
  } catch (err) {
    console.error('Error exporting monthly attendance:', err);
    return res.status(500).json({ error: err.message || 'Failed to export monthly attendance' });
  }
});

module.exports = router;
