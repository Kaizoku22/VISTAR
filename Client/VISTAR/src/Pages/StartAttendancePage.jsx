import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { Box, Paper, Typography, FormControl, Select, MenuItem, TextField, Button, Alert } from '@mui/material';
import { cacheStudents } from '../utils/attendanceCache.js';

export default function StartAttendancePage() {
  const { id: schoolId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [lectures, setLectures] = useState([]);
  const [form, setForm] = useState({ lecture_id: '', started_at: '', completed_at: '' });
  const [students, setStudents] = useState([]);
  const [message, setMessage] = useState('');
  const [session, setSession] = useState(null);

  useEffect(() => {
    const loadLectures = async () => {
      try {
        const url = `http://localhost:8000/attendance/available-lectures/${schoolId}?user_id=${user?.id}`;
        const res = await fetch(url);
        const data = await res.json();
        if (Array.isArray(data)) setLectures(data);
      } catch (e) {}
    };
    if (schoolId && user?.id) loadLectures();
  }, [schoolId, user?.id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateSession = async (e) => {
    e.preventDefault();
    setMessage('');
    setStudents([]);
    setSession(null);
    if (!form.lecture_id || !form.started_at) {
      setMessage('Select lecture and start time');
      return;
    }
    try {
      const res = await fetch('http://localhost:8000/attendance/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lecture_id: form.lecture_id,
          started_at: form.started_at,
          completed_at: form.completed_at || null,
          school_id: schoolId,
          user_id: user?.id
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data?.error || 'Failed to start session');
        return;
      }
      setMessage('Session created successfully');
      setStudents(data?.students || []);
      setSession(data?.session || null);
      // Cache students locally for offline-first marking
      try {
        const sid = data?.session?.lecture_session_id;
        if (sid && Array.isArray(data?.students)) {
          cacheStudents(sid, data.students);
        }
      } catch {}
    } catch (err) {
      setMessage('Network error');
    }
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>Start Attendance</Typography>
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
        {/* Left: Create Session Form */}
        <Paper elevation={2} sx={{ p: 2, flex: 1, maxWidth: 600 }}>
          <Box component="form" onSubmit={handleCreateSession} sx={{ display: 'grid', gap: 2 }}>
            <label htmlFor="lecture_id" style={{ fontWeight: 500 }}>Lecture</label>
            <FormControl fullWidth>
              <Select 
                id="lecture_id"
                name="lecture_id" 
                value={form.lecture_id} 
                onChange={handleChange} 
                required 
                displayEmpty 
                renderValue={(selected) => { 
                  if (!selected) return 'Select lecture'; 
                  const found = lectures.find(l => l.lecture_id === selected); 
                  return found ? found.lecture_name : selected; 
                }} 
              > 
                <MenuItem value=""><em>Select lecture</em></MenuItem> 
                {lectures.map(l => ( 
                  <MenuItem key={l.lecture_id} value={l.lecture_id}> 
                    {l.lecture_name} 
                  </MenuItem> 
                ))} 
              </Select> 
            </FormControl> 

            <label htmlFor="started_at" style={{ fontWeight: 500 }}>Started At</label>
            <TextField 
              id="started_at"
              type="datetime-local" 
              name="started_at" 
              value={form.started_at} 
              onChange={handleChange} 
              required 
              fullWidth 
            /> 

            <label htmlFor="completed_at" style={{ fontWeight: 500 }}>Completed At</label>
            <TextField 
              id="completed_at"
              type="datetime-local" 
              name="completed_at" 
              value={form.completed_at} 
              onChange={handleChange} 
              fullWidth 
            /> 

            <Button type="submit" variant="contained">Create Lecture Session</Button>
          </Box>
          {message && (
            <Alert severity={message.includes('successfully') ? 'success' : 'error'} sx={{ mt: 2 }}>
              {message}
            </Alert>
          )}
        </Paper>

        {/* Right: Action Box with Start Attendance button */}
        <Paper elevation={2} sx={{ p: 2, width: 300 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>Actions</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Create a session to enable starting attendance.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            disabled={!session}
            onClick={() => {
              const sid = session?.lecture_session_id || session?.id || session?.session_id;
              if (sid) navigate(`/school/${schoolId}/attendance/record/${sid}`);
            }}
          >
            Start Attendance
          </Button>
          {!session && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              Disabled until the session is created.
            </Typography>
          )}
        </Paper>
      </Box>

      {students.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6">Students for this lecture</Typography>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ borderBottom: '1px solid #ccc', textAlign: 'left' }}>Roll No</th>
                <th style={{ borderBottom: '1px solid #ccc', textAlign: 'left' }}>First Name</th>
                <th style={{ borderBottom: '1px solid #ccc', textAlign: 'left' }}>Last Name</th>
              </tr>
            </thead>
            <tbody>
              {students.map(s => (
                <tr key={s.student_id || `${s.firstname}-${s.roll_no}`}>
                  <td style={{ borderBottom: '1px solid #eee' }}>{s.roll_no}</td>
                  <td style={{ borderBottom: '1px solid #eee' }}>{s.firstname}</td>
                  <td style={{ borderBottom: '1px solid #eee' }}>{s.lastname}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Box>
      )}
    </Box>
  );
}