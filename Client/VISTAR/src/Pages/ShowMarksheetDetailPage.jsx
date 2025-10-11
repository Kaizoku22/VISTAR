import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Box, Paper, Typography, Table, TableHead, TableRow, TableCell, TableBody, Alert, Button, Stack } from '@mui/material';

export default function ShowMarksheetDetailPage() {
  const { id: schoolId, marksheetId } = useParams();
  const [header, setHeader] = useState(null);
  const [entries, setEntries] = useState([]);
  const [students, setStudents] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
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
        // Resolve names for standard and division
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
        // Fetch students for this marksheet via school/standard/division context
        try {
          const stdId = hJson?.standard_id;
          const divId = hJson?.division_id;
          const sRes = await fetch(`http://localhost:8000/students/${schoolId}?standard_id=${stdId}&division_id=${divId}`);
          const sJson = await sRes.json();
          if (sRes.ok && Array.isArray(sJson)) {
            setStudents(sJson);
          } else {
            setMessage(sJson?.error || 'Failed to load students for marksheet');
          }
        } catch (e) {
          setMessage('Network error fetching students');
        }
        // Optional: still fetch entries (not used in the current table)
        try {
          const eRes = await fetch(`http://localhost:8000/marksheets/entries/${marksheetId}`);
          const eJson = await eRes.json();
          if (eRes.ok && Array.isArray(eJson)) setEntries(eJson);
        } catch {}
        setLoading(false);
      } catch (e) {
        setMessage('Network error');
        setLoading(false);
      }
    };
    if (marksheetId) load();
  }, [marksheetId]);

  const studentRows = useMemo(() => {
    const list = Array.isArray(students) ? students : [];
    return [...list].sort((a, b) => {
      const ra = Number(a?.roll_no ?? 0);
      const rb = Number(b?.roll_no ?? 0);
      return ra - rb;
    });
  }, [students]);

  return (
    <Box>
      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
        <Link to={`/school/${schoolId}/marksheets/show`} style={{ textDecoration: 'none' }}>
          <Button variant="outlined">Back to list</Button>
        </Link>
      </Stack>

      <Typography variant="h6">Marksheet Details</Typography>
      {message ? (
        <Alert severity={message.includes('Failed') || message.includes('error') ? 'error' : 'info'} sx={{ mt: 1, mb: 2 }}>{message}</Alert>
      ) : null}

      {header ? (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle1"><strong>Exam:</strong> {header.exam_name}</Typography>
          <Typography variant="subtitle1"><strong>Date:</strong> {(() => { const d = new Date(header.exam_date); return isNaN(d) ? header.exam_date : d.toLocaleDateString(); })()}</Typography>
          <Typography variant="subtitle1"><strong>Standard:</strong> {standardName || header.standard_id}</Typography>
          <Typography variant="subtitle1"><strong>Division:</strong> {divisionName || header.division_id}</Typography>
          {header.term ? <Typography variant="subtitle1"><strong>Term:</strong> {header.term}</Typography> : null}
        </Paper>
      ) : null}

      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Roll No</TableCell>
              <TableCell>Student</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={3}>Loading…</TableCell></TableRow>
            ) : studentRows.length === 0 ? (
              <TableRow><TableCell colSpan={3}>No students</TableCell></TableRow>
            ) : studentRows.map(s => (
              <TableRow key={s.student_id}>
                <TableCell>{s.roll_no}</TableCell>
                <TableCell>{`${s.firstname || ''} ${s.lastname || ''}`.trim()}</TableCell>
                <TableCell>
                  <Button
                    component={Link}
                    to={`/school/${schoolId}/marksheets/show/${marksheetId}/student/${s.student_id}`}
                    variant="outlined"
                    size="small"
                  >
                    Show Marksheet
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}