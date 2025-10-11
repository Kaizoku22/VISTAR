import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Box, Paper, Typography, Table, TableHead, TableRow, TableCell, TableBody, Alert, Stack, Button } from '@mui/material';

function gradeFromPercent(p) {
  if (p == null || Number.isNaN(p)) return '-';
  const pct = Math.round(p);
  if (pct >= 90) return 'A+';
  if (pct >= 80) return 'A';
  if (pct >= 70) return 'B';
  if (pct >= 60) return 'C';
  if (pct >= 50) return 'D';
  if (pct >= 40) return 'E';
  return 'F';
}

export default function ShowStudentMarksheetPage() {
  const { id: schoolId, marksheetId, studentId } = useParams();
  const [header, setHeader] = useState(null);
  const [student, setStudent] = useState(null);
  const [entries, setEntries] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [schoolName, setSchoolName] = useState('');
  const [standardName, setStandardName] = useState('');
  const [divisionName, setDivisionName] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setMessage('');
      try {
        const hRes = await fetch(`http://localhost:8000/marksheets/header/${marksheetId}`);
        const hJson = await hRes.json();
        if (!hRes.ok) {
          setMessage(hJson?.error || 'Failed to load marksheet header');
          setLoading(false);
          return;
        }
        setHeader(hJson || null);

        // Resolve names for school, standard, division
        try {
          const sRes = await fetch(`http://localhost:8000/school/${schoolId}`);
          const sJson = await sRes.json();
          if (sRes.ok) setSchoolName(sJson?.school_name || '');
        } catch {}
        try {
          if (hJson?.standard_id) {
            const stRes = await fetch(`http://localhost:8000/school/${schoolId}/standards`);
            const stJson = await stRes.json();
            if (stRes.ok && Array.isArray(stJson)) {
              const found = stJson.find(x => String(x.id) === String(hJson.standard_id));
              if (found) setStandardName(found.std || '');
            }
          }
        } catch {}
        try {
          if (hJson?.division_id) {
            const dRes = await fetch(`http://localhost:8000/school/${schoolId}/divisions`);
            const dJson = await dRes.json();
            if (dRes.ok && Array.isArray(dJson)) {
              const found = dJson.find(x => String(x.div_id) === String(hJson.division_id));
              if (found) setDivisionName(found.division || '');
            }
          }
        } catch {}

        // Fetch entries precisely using marksheet_id and student_id
        let filtered = [];
        try {
          const eRes = await fetch(`http://localhost:8000/marksheets/entries/${marksheetId}/student/${studentId}`);
          const eJson = await eRes.json();
          if (eRes.ok && Array.isArray(eJson)) {
            filtered = eJson;
            setEntries(filtered);
            // Build minimal student object from entries if present
            if (filtered.length > 0) {
              const first = filtered[0];
              setStudent({
                student_id: first.student_id,
                roll_no: first.roll_no,
                firstname: (first.student_name || '').split(' ')[0] || '',
                lastname: (first.student_name || '').split(' ').slice(1).join(' ') || ''
              });
            }
          }
        } catch (e) {
          // ignore: continue to fetch students list
        }

        // If student not resolved from entries, fetch list for std/div
        if (!student) {
          const stdId = hJson?.standard_id;
          const divId = hJson?.division_id;
          try {
            const sRes = await fetch(`http://localhost:8000/students/${schoolId}?standard_id=${stdId}&division_id=${divId}`);
            const sJson = await sRes.json();
            if (sRes.ok && Array.isArray(sJson)) {
              const s = sJson.find(x => String(x.student_id) === String(studentId));
              if (s) setStudent(s);
            }
          } catch (e) {
            // ignore
          }
        }

        setLoading(false);
      } catch (e) {
        setMessage('Network error');
        setLoading(false);
      }
    };
    if (marksheetId && studentId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marksheetId, studentId]);

  const totals = useMemo(() => {
    let obtained = 0;
    let max = 0;
    (entries || []).forEach(e => {
      const o = Number(e.obtained_marks);
      const m = Number(e.max_marks);
      if (!Number.isNaN(o)) obtained += o;
      if (!Number.isNaN(m)) max += m;
    });
    const percent = max > 0 ? (obtained / max) * 100 : null;
    const grade = percent == null ? '-' : gradeFromPercent(percent);
    return { obtained, max, percent, grade };
  }, [entries]);

  const handleDownloadPdf = () => {
    try {
      const schoolLabel = schoolName || '-';
      const stdLabel = standardName || '-';
      const divLabel = divisionName || '-';
      const nameLabel = `${student?.firstname || ''} ${student?.lastname || ''}`.trim() || '-';
      const rollLabel = String(student?.roll_no ?? '-');
      const examLabel = header?.exam_name || '-';
      const dateLabel = header?.exam_date || '-';
      const termLabel = header?.term || '-';

      const rowsHtml = (entries || []).map(e => `
        <tr>
          <td>${e.subject_name || e.subject_id || ''}</td>
          <td style="text-align:right;">${e.max_marks ?? ''}</td>
          <td style="text-align:right;">${e.obtained_marks ?? ''}</td>
          <td style="text-align:center;">${(e.max_marks && e.obtained_marks) ? `${Math.round((Number(e.obtained_marks)/Number(e.max_marks))*100)}%` : ''}</td>
        </tr>
      `).join('');

      const percentStr = totals.percent == null ? '-' : `${totals.percent.toFixed(2)}%`;
      const summaryHtml = `
        <tr>
          <td style="font-weight:600;">Total</td>
          <td style="text-align:right;">${totals.max}</td>
          <td style="text-align:right;">${totals.obtained}</td>
          <td style="text-align:center;">${percentStr}</td>
        </tr>
      `;

      const html = `
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Marksheet - ${nameLabel}</title>
  <style>
    @page { size: A4; margin: 16mm; }
    body { font-family: Arial, Helvetica, sans-serif; color: #222; }
    h1 { font-size: 20px; text-align: center; margin: 0 0 12px; }
    .section { margin-bottom: 16px; }
    .grid { width: 100%; border-collapse: collapse; }
    .grid th, .grid td { border: 1px solid #ccc; padding: 8px; }
    .grid th { background: #f7f7f7; text-align: left; }
    .kv { width: 100%; border-collapse: collapse; }
    .kv th, .kv td { border: 1px solid #ddd; padding: 6px; }
    .kv th { width: 30%; background: #f9f9f9; text-align: left; }
    .meta { font-size: 12px; color: #666; text-align: center; margin-bottom: 8px; }
    .footer { margin-top: 18px; font-size: 12px; text-align: right; }
  </style>
</head>
<body>
  <div class="meta">Generated on ${new Date().toLocaleString()}</div>
  <h1>${examLabel} Mark Sheet</h1>

  <div class="section">
    <table class="kv">
      <tr><th>Student Name</th><td>${nameLabel}</td></tr>
      <tr><th>Roll Number</th><td>${rollLabel}</td></tr>
      <tr><th>Class/Grade</th><td>${stdLabel}</td></tr>
      <tr><th>Division</th><td>${divLabel}</td></tr>
      <tr><th>School</th><td>${schoolLabel}</td></tr>
    </table>
  </div>

  <div class="section">
    <table class="kv">
      <tr><th>Exam</th><td>${examLabel}</td></tr>
      <tr><th>Date</th><td>${dateLabel}</td></tr>
      <tr><th>Term</th><td>${termLabel}</td></tr>
      <tr><th>Grade</th><td>${totals.grade}</td></tr>
      <tr><th>Percentage</th><td>${percentStr}</td></tr>
    </table>
  </div>

  <div class="section">
    <table class="grid">
      <thead>
        <tr>
          <th>Subject</th>
          <th style="text-align:right;">Total Marks</th>
          <th style="text-align:right;">Marks Obtained</th>
          <th style="text-align:center;">Percent</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
        ${summaryHtml}
      </tbody>
    </table>
  </div>

  <div class="footer">This is a system-generated marksheet.</div>
  <script>window.print(); setTimeout(() => window.close(), 300);</script>
</body>
</html>`;

      const w = window.open('', '_blank');
      if (!w) return;
      w.document.open();
      w.document.write(html);
      w.document.close();
    } catch (e) {
      console.error('Failed to generate PDF:', e);
    }
  };

  return (
    <Box p={2}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Student Marksheet</Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <Button variant="contained" onClick={handleDownloadPdf}>Download PDF</Button>
          <Link to={`/school/${schoolId}/marksheets/show/${marksheetId}`} style={{ textDecoration: 'none' }}>
            <Button variant="outlined">Back to Marksheet</Button>
          </Link>
        </Stack>
      </Stack>

      {message && (
        <Alert severity="error" sx={{ mb: 2 }}>{message}</Alert>
      )}

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>Marksheet Details</Typography>
        <Typography>Exam: {header?.exam_name || '-'}</Typography>
        <Typography>Date: {header?.exam_date || '-'}</Typography>
        <Typography>Term: {header?.term || '-'}</Typography>
      </Paper>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>Student Details</Typography>
        <Typography>Roll No: {student?.roll_no ?? '-'}</Typography>
        <Typography>Name: {`${student?.firstname || ''} ${student?.lastname || ''}`.trim() || '-'}</Typography>
        <Typography>Class/Grade: {standardName || '-'}</Typography>
        <Typography>Division: {divisionName || '-'}</Typography>
        <Typography>School: {schoolName || '-'}</Typography>
      </Paper>

      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Subject</TableCell>
              <TableCell>Max Marks</TableCell>
              <TableCell>Obtained Marks</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={3}>Loading…</TableCell></TableRow>
            ) : (entries || []).length === 0 ? (
              <TableRow><TableCell colSpan={3}>No entries</TableCell></TableRow>
            ) : (entries || []).map(e => (
              <TableRow key={`${e.student_id}_${e.subject_id}`}>
                <TableCell>{e.subject_name || e.subject_id}</TableCell>
                <TableCell>{e.max_marks ?? ''}</TableCell>
                <TableCell>{e.obtained_marks ?? ''}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      <Paper sx={{ p: 2, mt: 2 }}>
        <Typography variant="h6" gutterBottom>Summary</Typography>
        <Typography>Total Obtained: {totals.obtained}</Typography>
        <Typography>Total Max: {totals.max}</Typography>
        <Typography>Percentage: {totals.percent == null ? '-' : `${totals.percent.toFixed(2)}%`}</Typography>
        <Typography>Grade: {totals.grade}</Typography>
      </Paper>
    </Box>
  );
}