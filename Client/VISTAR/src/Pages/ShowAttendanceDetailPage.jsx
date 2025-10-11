import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Paper, Typography, Table, TableHead, TableRow, TableCell, TableBody, Chip, Alert } from '@mui/material';

export default function ShowAttendanceDetailPage() {
  const { id: schoolId, sessionId } = useParams();
  const [details, setDetails] = useState(null);
  const [rows, setRows] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const load = async () => {
      setMessage('');
      try {
        const dRes = await fetch(`http://localhost:8000/attendance/sessions/${sessionId}/details`);
        let dJson = null;
        try { dJson = await dRes.json(); } catch {}
        if (!dRes.ok) {
          setMessage(dJson?.error || `Failed to load details (status ${dRes.status})`);
        } else {
          setDetails(dJson);
        }

        const aRes = await fetch(`http://localhost:8000/attendance/sessions/${sessionId}/attendance`);
        let aJson = null;
        try { aJson = await aRes.json(); } catch {}
        if (!aRes.ok) {
          setMessage((prev) => prev || aJson?.error || `Failed to load attendance (status ${aRes.status})`);
        } else {
          setRows(Array.isArray(aJson) ? aJson : []);
        }
      } catch (e) {
        setMessage('Network error');
      }
    };
    if (sessionId) load();
  }, [sessionId]);

  const shortId = (id) => (id ? String(id).slice(0, 8) : '—');
  const formatDateTime = (ts) => {
    if (!ts) return '—';
    try {
      const d = new Date(ts);
      return d.toLocaleString(undefined, {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch {
      return String(ts);
    }
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>Attendance Details</Typography>
      {details && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="subtitle1">Session: {shortId(details.lecture_session_id)}</Typography>
          <Typography variant="body2">Lecture: {details.lecture_name}</Typography>
          <Typography variant="body2">Subject: {details.subject_name || '—'}</Typography>
          <Typography variant="body2">Teacher: {details.teacher_name || '—'}</Typography>
          <Typography variant="body2">Standard: {details.standard}</Typography>
          <Typography variant="body2">Division: {details.division}</Typography>
          <Typography variant="body2">Start Time: {formatDateTime(details.started_at)}</Typography>
          <Typography variant="body2">End Time: {formatDateTime(details.completed_at)}</Typography>
        </Paper>
      )}

      {message && <Alert severity="error" sx={{ mb: 2 }}>{message}</Alert>}

      <Paper sx={{ p: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Roll No</TableCell>
              <TableCell>First Name</TableCell>
              <TableCell>Last Name</TableCell>
              <TableCell>Attendance</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map(r => (
              <TableRow key={r.attendance_id || r.student_id}>
                <TableCell>{r.roll_no}</TableCell>
                <TableCell>{r.firstname}</TableCell>
                <TableCell>{r.lastname}</TableCell>
                <TableCell>
                  <Chip label={r.attendance ? 'Present' : 'Absent'} color={r.attendance ? 'success' : 'error'} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}