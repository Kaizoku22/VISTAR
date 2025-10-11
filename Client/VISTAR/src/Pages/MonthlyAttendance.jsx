import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Paper, Typography, FormControl, InputLabel, Select, MenuItem, Table, TableHead, TableRow, TableCell, TableBody, Chip, Alert, RadioGroup, FormControlLabel, Radio, FormLabel, TextField, Button } from '@mui/material';

export default function DeleteAttendancePage() {
  const { id: schoolId } = useParams();
  const [lectures, setLectures] = useState([]);
  const [lectureId, setLectureId] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1); // 1-12
  const [sessions, setSessions] = useState([]);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [message, setMessage] = useState('');
  // Defaulter controls
  const [critEnable, setCritEnable] = useState('no');
  const [critPercent, setCritPercent] = useState(50);
  const [defEnable, setDefEnable] = useState('no');
  const [defPercent, setDefPercent] = useState(75);

  // Load lectures for selector
  useEffect(() => {
    const loadLectures = async () => {
      try {
        const res = await fetch(`http://localhost:8000/lectures/${schoolId}`);
        const data = await res.json();
        if (Array.isArray(data)) {
          setLectures(data);
          if (!lectureId && data.length > 0) setLectureId(data[0].lecture_id);
        }
      } catch {}
    };
    if (schoolId) loadLectures();
  }, [schoolId]);

  // Fetch only when user clicks "Show Attendance"
  const loadMonthly = async () => {
    if (!lectureId) return;
    setMessage('');
    try {
      const res = await fetch(`http://localhost:8000/attendance/lecture/${lectureId}/monthly?year=${year}&month=${month}`);
      let json = null;
      try { json = await res.json(); } catch {}
      if (!res.ok) {
        setMessage(json?.error || `Failed to load (status ${res.status})`);
        return;
      }
      setSessions(json.sessions || []);
      setStudents(json.students || []);
      setAttendance(json.attendance || []);
    } catch {
      setMessage('Network error');
    }
  };

  // Download monthly attendance Excel from server
  const downloadMonthly = async () => {
    if (!lectureId) return;
    setMessage('');
    try {
      const params = new URLSearchParams({
        year: String(year),
        month: String(month),
        critical: critEnable,
        critical_percent: String(critPercent || 0),
        defaulter: defEnable,
        defaulter_percent: String(defPercent || 0)
      });
      const url = `http://localhost:8000/attendance/lecture/${lectureId}/monthly/export?${params.toString()}`;
      const res = await fetch(url);
      if (!res.ok) {
        let j = null;
        try { j = await res.json(); } catch {}
        setMessage(j?.error || `Failed to download (status ${res.status})`);
        return;
      }
      const blob = await res.blob();
      const link = document.createElement('a');
      const mStr = String(month).padStart(2, '0');
      link.href = window.URL.createObjectURL(blob);
      link.download = `Monthly_Attendance_${year}-${mStr}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      setMessage('Network error');
    }
  };

  const attendanceMap = useMemo(() => {
    const map = {};
    (attendance || []).forEach(r => {
      map[`${r.student_id}_${r.lecture_session_id}`] = !!r.attendance;
    });
    return map;
  }, [attendance]);

  const totalSessions = sessions.length;

  const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1);
  const yearOptions = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  const sessionLabel = (s) => {
    try {
      const d = new Date(s.started_at);
      return `${d.getDate()}`; // day of month
    } catch {
      return s.lecture_session_id?.slice(0, 4) || '—';
    }
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>Monthly Attendance</Typography>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel id="lecture-label">Lecture</InputLabel>
            <Select labelId="lecture-label" value={lectureId} label="Lecture" onChange={(e) => setLectureId(e.target.value)}>
              {lectures.map(l => (
                <MenuItem key={l.lecture_id} value={l.lecture_id}>{l.lecture_name}</MenuItem>
              ))}
            </Select>
        </FormControl>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel id="month-label">Month</InputLabel>
            <Select labelId="month-label" value={month} label="Month" onChange={(e) => setMonth(Number(e.target.value))}>
              {monthOptions.map(m => (
                <MenuItem key={m} value={m}>{m}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel id="year-label">Year</InputLabel>
            <Select labelId="year-label" value={year} label="Year" onChange={(e) => setYear(Number(e.target.value))}>
              {yearOptions.map(y => (
                <MenuItem key={y} value={y}>{y}</MenuItem>
              ))}
            </Select>
          </FormControl>


          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="contained" size="small" onClick={downloadMonthly}>
              Download Attendance
            </Button>
          </Box>

          {/* Defaulter controls (inputs below radio options, using label tags) */}
          <Box sx={{ width: '100%', display: 'grid', gridTemplateColumns: 'repeat(2, minmax(240px, 1fr))', gap: 2 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <FormControl component="fieldset">
                <FormLabel component="legend">Add critical defaulter</FormLabel>
                <RadioGroup row value={critEnable} onChange={(e) => setCritEnable(e.target.value)}>
                  <FormControlLabel value="yes" control={<Radio />} label="Yes" />
                  <FormControlLabel value="no" control={<Radio />} label="No" />
                </RadioGroup>
              </FormControl>
              {critEnable === 'yes' && (
                <>
                  <label htmlFor="critPercent">Critical %</label>
                  <TextField
                    id="critPercent"
                    type="number"
                    value={critPercent}
                    onChange={(e) => setCritPercent(Math.max(0, Math.min(100, Number(e.target.value))))}
                    inputProps={{ min: 0, max: 100 }}
                    size="small"
                  />
                </>
              )}
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <FormControl component="fieldset">
                <FormLabel component="legend">Add defaulter</FormLabel>
                <RadioGroup row value={defEnable} onChange={(e) => setDefEnable(e.target.value)}>
                  <FormControlLabel value="yes" control={<Radio />} label="Yes" />
                  <FormControlLabel value="no" control={<Radio />} label="No" />
                </RadioGroup>
              </FormControl>
              {defEnable === 'yes' && (
                <>
                  <label htmlFor="defPercent">Defaulter %</label>
                  <TextField
                    id="defPercent"
                    type="number"
                    value={defPercent}
                    onChange={(e) => setDefPercent(Math.max(0, Math.min(100, Number(e.target.value))))}
                    inputProps={{ min: 0, max: 100 }}
                    size="small"
                  />
                </>
              )}
            </Box>
          </Box>
        </Box>
      </Paper>

      {message && <Alert severity="error" sx={{ mb: 2 }}>{message}</Alert>}

      <Paper sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Click "Download Attendance" to receive the generated Excel for the selected lecture and month.
        </Typography>
      </Paper>
    </Box>
  );
}