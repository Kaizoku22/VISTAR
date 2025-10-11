import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Box, Paper, Typography, Table, TableHead, TableRow, TableCell, TableBody, Alert, Button } from '@mui/material';

export default function ShowMarksheetPage() {
  const { id: schoolId } = useParams();
  const [rows, setRows] = useState([]);
  const [message, setMessage] = useState('');
  const [standards, setStandards] = useState([]);
  const [divisions, setDivisions] = useState([]);

  useEffect(() => {
    const load = async () => {
      setMessage('');
      try {
        const res = await fetch(`http://localhost:8000/marksheets/${schoolId}`);
        const data = await res.json();
        if (!res.ok) {
          setMessage(data?.error || 'Failed to load marksheets');
          return;
        }
        setRows(Array.isArray(data) ? data : []);
      } catch (e) {
        setMessage('Network error');
      }
    };
    if (schoolId) load();
  }, [schoolId]);

  useEffect(() => {
    const loadMeta = async () => {
      try {
        const [sRes, dRes] = await Promise.all([
          fetch(`http://localhost:8000/school/${schoolId}/standards`),
          fetch(`http://localhost:8000/school/${schoolId}/divisions`)
        ]);
        const [sJson, dJson] = await Promise.all([sRes.json(), dRes.json()]);
        if (Array.isArray(sJson)) setStandards(sJson);
        if (Array.isArray(dJson)) setDivisions(dJson);
      } catch (e) {
        // ignore meta errors; table will fallback to IDs
      }
    };
    if (schoolId) loadMeta();
  }, [schoolId]);

  const standardMap = useMemo(() => Object.fromEntries((standards || []).map(s => [s.id, s.std])), [standards]);
  const divisionMap = useMemo(() => Object.fromEntries((divisions || []).map(d => [d.div_id, d.division])), [divisions]);

  const shortId = (id) => (id ? String(id).slice(0, 8) : '—');
  const fmtDate = (value) => {
    if (!value) return '—';
    const dt = new Date(value);
    if (isNaN(dt.getTime())) return String(value);
    return dt.toLocaleDateString();
  };
  const fmtDateTime = (value) => {
    if (!value) return '—';
    const dt = new Date(value);
    if (isNaN(dt.getTime())) return String(value);
    return dt.toLocaleString();
  };

  const handleDelete = async (marksheet_id) => {
    const yes = window.confirm('Delete this marksheet and all its entries?');
    if (!yes) return;
    try {
      const res = await fetch(`http://localhost:8000/marksheets/${marksheet_id}`, { method: 'DELETE' });
      const json = await res.json().catch(() => ({ ok: res.ok }));
      if (!res.ok || json?.error) {
        alert(json?.error || 'Failed to delete marksheet');
        return;
      }
      // Remove from local list
      setRows(prev => prev.filter(r => r.marksheet_id !== marksheet_id));
    } catch (e) {
      alert('Network error while deleting');
    }
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>Marksheets</Typography>
      {message ? <Alert severity={message.includes('error') || message.includes('Failed') ? 'error' : 'info'} sx={{ mb: 2 }}>{message}</Alert> : null}
      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Exam Name</TableCell>
              <TableCell>Exam Date</TableCell>
              <TableCell>Standard</TableCell>
              <TableCell>Division</TableCell>
              <TableCell>Created At</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map(r => (
              <TableRow key={r.marksheet_id}>
                <TableCell>{shortId(r.marksheet_id)}</TableCell>
                <TableCell>{r.exam_name}</TableCell>
                <TableCell>{fmtDate(r.exam_date)}</TableCell>
                <TableCell>{standardMap[r.standard_id] || r.standard_id}</TableCell>
                <TableCell>{divisionMap[r.division_id] || r.division_id}</TableCell>
                <TableCell>{fmtDateTime(r.created_at)}</TableCell>
                <TableCell>
                  <Link to={`/school/${schoolId}/marksheets/show/${r.marksheet_id}`} style={{ textDecoration: 'none', marginRight: 8 }}>
                    <Button variant="outlined" size="small">View</Button>
                  </Link>
                  <Button color="error" variant="outlined" size="small" onClick={() => handleDelete(r.marksheet_id)}>Delete</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}