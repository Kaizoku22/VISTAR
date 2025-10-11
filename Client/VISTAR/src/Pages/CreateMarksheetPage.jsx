import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { Box, Paper, Typography, FormControl, Select, MenuItem, TextField, Button, Alert } from '@mui/material';

let xSpreadsheetLoaded = false;

export default function CreateMarksheetPage() {
  const containerRef = useRef(null);
  const spreadsheetInstanceRef = useRef(null);
  const subjectColsRef = useRef([]); // map column index -> subject_id

  const { id: schoolId } = useParams();
  const { user } = useAuth();

  const [standards, setStandards] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [subjects, setSubjects] = useState([]); // fetched subjects in school
  const [customSubjects, setCustomSubjects] = useState([]); // [{ subject_id, subject_name, max_marks }]
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [students, setStudents] = useState([]);
  const [message, setMessage] = useState('');

  const [form, setForm] = useState({
    standard_id: '',
    division_id: '',
    exam_name: '',
    exam_date: '',
    term: ''
  });

  const standardMap = useMemo(() => Object.fromEntries((standards || []).map(s => [s.id, s.std])), [standards]);
  const divisionMap = useMemo(() => Object.fromEntries((divisions || []).map(d => [d.div_id, d.division])), [divisions]);

  useEffect(() => {
    const loadResources = async () => {
      if (xSpreadsheetLoaded) {
        // Prevent double initialization (StrictMode mounts or revisits)
        initSpreadsheet();
        return;
      }

      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/x-data-spreadsheet@1.1.5/dist/xspreadsheet.css';
      document.head.appendChild(link);

      const script = document.createElement('script');
      script.src = 'https://unpkg.com/x-data-spreadsheet@1.1.5/dist/xspreadsheet.js';
      script.onload = () => {
        if (window.x_spreadsheet) {
          window.x_spreadsheet.locale('en');
          xSpreadsheetLoaded = true;
          initSpreadsheet();
        }
      };
      document.body.appendChild(script);

      return () => {
        try { document.head.removeChild(link); } catch {}
        try { document.body.removeChild(script); } catch {}
      };
    };

    const initSpreadsheet = () => {
      if (!containerRef.current || !window.x_spreadsheet) return;
      // Guard: avoid creating multiple spreadsheet instances in the same container
      if (spreadsheetInstanceRef.current) return;
      spreadsheetInstanceRef.current = new window.x_spreadsheet(containerRef.current, {
        mode: 'edit',
        showToolbar: true,
        showGrid: true,
        view: {
          height: () => 600,
          width: () => Math.max(600, window.innerWidth - 360),
        }
      });
      // Load empty initially
      spreadsheetInstanceRef.current.loadData({ name: 'Marksheet', rows: {} });
    };

    loadResources();
    // Cleanup to prevent lingering instance on route change
    return () => {
      try {
        if (containerRef.current) {
          containerRef.current.innerHTML = '';
        }
      } catch {}
      spreadsheetInstanceRef.current = null;
      subjectColsRef.current = [];
    };
  }, []);

  // Fetch selectors (standards/divisions) and subjects
  useEffect(() => {
    const loadRefs = async () => {
      try {
        const [stdRes, divRes, subRes] = await Promise.all([
          fetch(`http://localhost:8000/school/${schoolId}/standards`),
          fetch(`http://localhost:8000/school/${schoolId}/divisions`),
          fetch(`http://localhost:8000/subjects/${schoolId}`)
        ]);
        const [std, div, sub] = await Promise.all([stdRes.json(), divRes.json(), subRes.json()]);
        setStandards(Array.isArray(std) ? std : []);
        setDivisions(Array.isArray(div) ? div : []);
        setSubjects(Array.isArray(sub) ? sub : []);
      } catch (e) { /* ignore */ }
    };
    if (schoolId) loadRefs();
  }, [schoolId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const loadStudents = async () => {
    setMessage('');
    try {
      if (!form.standard_id || !form.division_id) {
        setMessage('Select standard and division');
        return;
      }
      if (!customSubjects || customSubjects.length === 0) {
        setMessage('Add at least one subject before loading students');
        return;
      }
      const res = await fetch(`http://localhost:8000/students/${schoolId}?standard_id=${form.standard_id}&division_id=${form.division_id}`);
      const data = await res.json();
      if (!Array.isArray(data)) {
        setMessage('Failed to load students');
        return;
      }
      setStudents(data);
      initGridWithStudentsAndSubjects(data, customSubjects);
    } catch (err) {
      setMessage('Network error');
    }
  };

  const initGridWithStudentsAndSubjects = (stu, sub) => {
    if (!spreadsheetInstanceRef.current || !Array.isArray(stu) || !Array.isArray(sub)) return;
    // Build rows data: header + students
    const rows = {};
    const headerCells = {
      0: { text: 'Roll No' },
      1: { text: 'Student' }
    };
    subjectColsRef.current = [];
    sub.forEach((s, idx) => {
      const colIdx = 2 + idx;
      headerCells[colIdx] = { text: s.subject_name };
      subjectColsRef.current[colIdx] = s.subject_id; // map by subject_id
    });
    rows[0] = { cells: headerCells };

    stu.forEach((st, rIdx) => {
      const cells = {
        0: { text: String(st.roll_no || '') },
        1: { text: `${st.firstname || ''} ${st.lastname || ''}`.trim() }
      };
      rows[rIdx + 1] = { cells };
    });

    spreadsheetInstanceRef.current.loadData({ name: 'Marksheet', rows });
  };

  const saveMarksheet = async () => {
    setMessage('');
    try {
      if (!form.standard_id || !form.division_id || !form.exam_name || !form.exam_date) {
        setMessage('Please fill standard, division, exam name and date');
        return;
      }
      if (!user?.id) {
        setMessage('Not authenticated');
        return;
      }
      if (!customSubjects || customSubjects.length === 0) {
        setMessage('Add at least one subject before saving');
        return;
      }
      // Require students to be loaded so we actually save entries
      if (!Array.isArray(students) || students.length === 0) {
        setMessage('Please click "Load Students" before saving');
        return;
      }

      // Create header
      const res = await fetch('http://localhost:8000/marksheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          school_id: schoolId,
          standard_id: form.standard_id,
          division_id: form.division_id,
          exam_name: form.exam_name,
          exam_date: form.exam_date,
          term: form.term || null,
          created_by: user.id
        })
      });
      const header = await res.json();
      if (!res.ok) {
        setMessage(header?.error || 'Failed to create marksheet');
        return;
      }

      const marksheet_id = header.marksheet_id;
      const data = spreadsheetInstanceRef.current?.getData?.();
      // x-data-spreadsheet may return a single sheet object or an array
      let rows = {};
      if (Array.isArray(data)) {
        rows = (data[0] && typeof data[0].rows === 'object') ? data[0].rows : {};
      } else {
        rows = (data?.rows && typeof data.rows === 'object') ? data.rows : {};
      }
      // Guard: if grid shows no student rows AND local students state is empty, block save
      const numericKeys = Object.keys(rows).filter(k => /^\d+$/.test(k));
      const hasStudentRows = numericKeys.some(k => parseInt(k, 10) > 0);
      if (!hasStudentRows && (!Array.isArray(students) || students.length === 0)) {
        setMessage('Load students into the grid before saving');
        return;
      }

      const entries = [];
      // Build student id map by name+roll (best-effort)
      const stuByKey = {};
      (students || []).forEach(s => {
        const key = `${String(s.roll_no || '').trim()}|${(`${s.firstname || ''} ${s.lastname || ''}`).trim()}`;
        stuByKey[key] = s.student_id;
      });

      Object.keys(rows).forEach(k => {
        const r = parseInt(k, 10);
        if (Number.isNaN(r) || r === 0) return; // skip header
        const cells = rows[k]?.cells || {};
        const roll = (cells?.[0]?.text || '').toString().trim();
        const name = (cells?.[1]?.text || '').toString().trim();
        const student_id = stuByKey[`${roll}|${name}`];
        if (!student_id) return;
        // For each subject column, collect obtained marks
        Object.keys(cells).forEach(colStr => {
          const col = parseInt(colStr, 10);
          if (col >= 2) {
            const subject_id = subjectColsRef.current[col];
            if (!subject_id) return;
            const obtained = cells[col]?.text;
            const n = obtained == null || obtained === '' ? null : Number(obtained);
            const subj = customSubjects.find(s => s.subject_id === subject_id);
            const mm = subj ? (subj.max_marks == null ? null : Number(subj.max_marks)) : null;
            entries.push({
              student_id,
              subject_id,
              max_marks: mm == null ? null : Number(mm),
              obtained_marks: n
            });
          }
        });
      });

      const saveRes = await fetch('http://localhost:8000/marksheets/entries/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ marksheet_id, entries })
      });
      const saveJson = await saveRes.json();
      if (!saveRes.ok) {
        setMessage(saveJson?.error || 'Failed to save marks');
        return;
      }
      setMessage('Marksheet saved successfully');
    } catch (e) {
      setMessage('Unexpected error saving marksheet');
    }
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>Create Marksheet</Typography>
      {message ? <Alert severity={/success/i.test(message) ? 'success' : 'error'} sx={{ mb: 2 }}>{message}</Alert> : null}

      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Box sx={{ minWidth: 220, display: 'flex', flexDirection: 'column' }}>
            <label htmlFor="standard_id-select">Standard</label>
            <Select id="standard_id-select" name="standard_id" value={form.standard_id} onChange={handleChange}>
              {standards.map(s => (
                <MenuItem key={s.id} value={s.id}>{s.std}</MenuItem>
              ))}
            </Select>
          </Box>

          <Box sx={{ minWidth: 220, display: 'flex', flexDirection: 'column' }}>
            <label htmlFor="division_id-select">Division</label>
            <Select id="division_id-select" name="division_id" value={form.division_id} onChange={handleChange}>
              {divisions.map(d => (
                <MenuItem key={d.div_id} value={d.div_id}>{d.division}</MenuItem>
              ))}
            </Select>
          </Box>

          <Box sx={{ minWidth: 240, display: 'flex', flexDirection: 'column' }}>
            <label htmlFor="exam_name">Exam Name</label>
            <TextField id="exam_name" name="exam_name" value={form.exam_name} onChange={handleChange} placeholder="Exam Name" />
          </Box>

          <Box sx={{ minWidth: 180, display: 'flex', flexDirection: 'column' }}>
            <label htmlFor="exam_date">Exam Date</label>
            <TextField id="exam_date" type="date" name="exam_date" value={form.exam_date} onChange={handleChange} />
          </Box>

          <Box sx={{ minWidth: 160, display: 'flex', flexDirection: 'column' }}>
            <label htmlFor="term">Term</label>
            <TextField id="term" name="term" value={form.term} onChange={handleChange} placeholder="Term" />
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 2 }}>
            <Button variant="outlined" onClick={loadStudents}>Load Students</Button>
            <Button variant="contained" onClick={saveMarksheet}>Save Marksheet</Button>
          </Box>
        </Box>
      </Paper>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>Subjects for this Marksheet</Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <Box sx={{ width: 240, display: 'flex', flexDirection: 'column' }}>
            <label htmlFor="selectSubject">Select Subject</label>
            <FormControl size="small">
              <Select
                id="selectSubject"
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                displayEmpty
              >
                <MenuItem value=""><em>Choose...</em></MenuItem>
                {subjects.map(s => (
                  <MenuItem key={s.subject_id} value={s.subject_id}>{s.subject_name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          <Button
            variant="outlined"
            onClick={() => {
              const sid = selectedSubjectId;
              if (!sid) return;
              const subj = subjects.find(x => x.subject_id === sid);
              if (!subj) return;
              if (customSubjects.find(x => x.subject_id === sid)) return; // avoid duplicates
              setCustomSubjects(prev => [...prev, { subject_id: subj.subject_id, subject_name: subj.subject_name, max_marks: 100 }]);
              setSelectedSubjectId('');
            }}
          >Add Subject</Button>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 2 }}>
          {customSubjects.map((s, idx) => (
            <Box key={`${s.subject_id}-${idx}`} sx={{ width: 240, display: 'flex', flexDirection: 'column', border: '1px solid #eee', p: 1, borderRadius: 1 }}>
              <label>Subject</label>
              <TextField value={s.subject_name} disabled />
              <label style={{ marginTop: 8 }}>Max Marks</label>
              <TextField type="number" value={s.max_marks ?? ''} onChange={(e) => {
                const v = e.target.value;
                setCustomSubjects(prev => prev.map((x, i) => i === idx ? { ...x, max_marks: (v === '' ? null : Number(v)) } : x));
              }} />
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                <Button color="error" onClick={() => setCustomSubjects(prev => prev.filter((_, i) => i !== idx))}>Remove</Button>
              </Box>
            </Box>
          ))}
        </Box>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>Marksheet Grid</Typography>
        <div
          ref={containerRef}
          style={{
            width: '100%',
            height: 600,
            border: '1px solid #ddd',
            borderRadius: 4
          }}
        />
      </Paper>

    </Box>
  );
}