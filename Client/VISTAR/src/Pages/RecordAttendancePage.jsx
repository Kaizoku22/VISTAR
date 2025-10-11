import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { Box, Paper, Typography, Button, IconButton, Alert } from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { getStudents, cacheStudents, addMark, uploadPendingMarks, markUploaded } from '../utils/attendanceCache.js';

export default function RecordAttendancePage() {
  const { id: schoolId, sessionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [index, setIndex] = useState(0);
  const [message, setMessage] = useState('');

  // Fetch students for session (offline-first)
  useEffect(() => {
    const load = async () => {
      const local = getStudents(sessionId) || [];
      if (local.length) {
        setStudents(local);
        setIndex(0);
      }
      try {
        const res = await fetch(`http://localhost:8000/attendance/sessions/${sessionId}/students`);
        const data = await res.json();
        if (Array.isArray(data)) {
          cacheStudents(sessionId, data);
          if (!local.length || local.length !== data.length) {
            setStudents(data);
            setIndex(0);
          }
        } else if (!local.length) {
          setMessage(data?.error || 'Failed to load students');
        }
      } catch (e) {
        if (!local.length) setMessage('Network error');
      }
    };
    if (sessionId) load();
  }, [sessionId]);

  const current = students[index];

  const markAttendance = useCallback(async (present) => {
    if (!current) return;
    // Store locally first for offline resilience
    addMark(sessionId, current.student_id, !!present);
    // Attempt immediate upload if online
    if (navigator.onLine) {
      try {
        const res = await fetch('http://localhost:8000/attendance/mark', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lecture_session_id: sessionId,
            student_id: current.student_id,
            attendance: !!present,
            user_id: user?.id,
          }),
        });
        if (res.ok) {
          markUploaded(sessionId, current.student_id);
        }
      } catch {}
    }
    // Advance automatically after marking
    setIndex((i) => Math.min(i + 1, students.length));
  }, [current, sessionId, students.length, user?.id]);

  // Keyboard shortcuts: Enter = present, Backspace = absent
  useEffect(() => {
    const handler = (e) => {
      if (!current) return;
      if (e.key === 'Enter') {
        e.preventDefault();
        markAttendance(true);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        markAttendance(false);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrev();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [current, markAttendance]);

  const goPrev = () => setIndex((i) => Math.max(i - 1, 0));
  const goNext = () => setIndex((i) => Math.min(i + 1, students.length));

  const saveAndView = () => {
    navigate(`/school/${schoolId}/attendance/show`);
  };

  // Auto-upload pending marks when connection is restored
  useEffect(() => {
    const handler = async () => {
      if (!sessionId || !navigator.onLine) return;
      try {
        const res = await uploadPendingMarks(sessionId, user?.id);
        if (res?.success) setMessage(`Synced ${res.success} pending mark(s).`);
      } catch {}
    };
    window.addEventListener('online', handler);
    return () => window.removeEventListener('online', handler);
  }, [sessionId, user?.id]);

  return (
    <Box sx={{ display: 'flex', alignItems: 'stretch', gap: 2 }}>
      {/* Left control */}
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <IconButton onClick={goPrev} disabled={index === 0} size="large">
          <ArrowBackIosNewIcon />
        </IconButton>
      </Box>

      {/* Center carousel card */}
      <Paper elevation={3} sx={{ p: 4, flex: 1, minHeight: 280, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        {!current && index >= students.length ? (
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>All students processed</Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={saveAndView}
              sx={{ justifyContent: 'center', textAlign: 'center' }}
            >
              Save and View Attendance
            </Button>
          </Box>
        ) : (
          <Box sx={{ textAlign: 'center', width: '100%' }}>
            <Typography variant="h5" sx={{ mb: 1 }}>Mark Attendance</Typography>
            {current ? (
              <>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>Roll No: {current.roll_no}</Typography>
                <Typography variant="subtitle1" sx={{ mb: 2 }}>{current.firstname} {current.lastname}</Typography>
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
                  <Button variant="contained" color="success" onClick={() => markAttendance(true)}>Present (Enter)</Button>
                  <Button variant="outlined" color="error" onClick={() => markAttendance(false)}>Absent (Backspace)</Button>
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Shortcuts: ←/→ navigate, Enter = Present, Backspace = Absent.
                </Typography>
                <Typography variant="caption" sx={{ mt: 2, display: 'block' }}>Student {index + 1} of {students.length}</Typography>
              </>
            ) : (
              <Typography variant="body1">Loading…</Typography>
            )}
          </Box>
        )}
        {message && <Alert sx={{ mt: 2 }} severity={message.includes('Failed') || message.includes('error') ? 'error' : 'info'}>{message}</Alert>}
      </Paper>

      {/* Right control */}
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <IconButton onClick={goNext} disabled={index >= students.length} size="large">
          <ArrowForwardIosIcon />
        </IconButton>
      </Box>
    </Box>
  );
}