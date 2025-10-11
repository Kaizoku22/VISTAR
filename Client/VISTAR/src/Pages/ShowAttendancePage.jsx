import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, IconButton, Tooltip } from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { useAuth } from '../AuthContext.jsx';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CloudDoneIcon from '@mui/icons-material/CloudDone';
import CloudOffIcon from '@mui/icons-material/CloudOff';
import { hasPending, isUploaded, uploadPendingMarks, clearSession } from '../utils/attendanceCache.js';

export default function ShowAttendancePage() {
  const { id: schoolId } = useParams();
  const [sessions, setSessions] = useState([]);
  const [lecturesMap, setLecturesMap] = useState({});
  const navigate = useNavigate();
  const { user } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`http://localhost:8000/attendance/sessions/${schoolId}`);
        const data = await res.json();
        if (Array.isArray(data)) setSessions(data);
      } catch {}
    };
    if (schoolId) load();
  }, [schoolId]);

  const handleDeleteSession = async (session) => {
    const sid = session.lecture_session_id || session.id || session.session_id;
    if (!sid) return;
    const ok = window.confirm('Delete this attendance session? This will remove all marks.');
    if (!ok) return;
    if (!navigator.onLine) {
      alert('You are offline. Please connect to the internet to delete from the database.');
      return;
    }
    try {
      const res = await fetch(`http://localhost:8000/attendance/sessions/${sid}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) {
        const t = await res.text();
        throw new Error(t || 'Failed to delete session');
      }
      try { clearSession(sid); } catch {}
      setSessions(prev => prev.filter(s => (s.lecture_session_id || s.id || s.session_id) !== sid));
    } catch (e) {
      alert(e.message || 'Error deleting session');
    }
  };

  // Auto-sync any pending local attendance when online
  useEffect(() => {
    const handler = async () => {
      if (!navigator.onLine) return;
      for (const s of sessions) {
        const sid = s.lecture_session_id || s.id || s.session_id;
        if (sid && hasPending(sid)) {
          try { await uploadPendingMarks(sid, user?.id); } catch {}
        }
      }
      // bump refresh key so icons re-evaluate against updated cache
      setRefreshKey(prev => prev + 1);
    };
    window.addEventListener('online', handler);
    return () => window.removeEventListener('online', handler);
  }, [sessions]);

  // Fetch lectures to map lecture_id -> lecture_name
  useEffect(() => {
    const loadLectures = async () => {
      try {
        const res = await fetch(`http://localhost:8000/lectures/${schoolId}`);
        const data = await res.json();
        if (Array.isArray(data)) {
          const map = {};
          data.forEach(l => { map[l.lecture_id] = l.lecture_name; });
          setLecturesMap(map);
        }
      } catch {}
    };
    if (schoolId) loadLectures();
  }, [schoolId]);

  const shortId = (id) => (id ? String(id).slice(0, 8) : '—');
  const formatDateTime = (ts) => {
    if (!ts) return '';
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
    <div>
      <h3>Attendance Sessions</h3>
      {sessions.length === 0 ? (
        <p>No sessions yet.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ borderBottom: '1px solid #ccc', textAlign: 'left' }}>Session ID</th>
              <th style={{ borderBottom: '1px solid #ccc', textAlign: 'left' }}>Lecture</th>
              <th style={{ borderBottom: '1px solid #ccc', textAlign: 'left' }}>Started</th>
              <th style={{ borderBottom: '1px solid #ccc', textAlign: 'left' }}>Completed</th>
              <th style={{ borderBottom: '1px solid #ccc', textAlign: 'left' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map(s => (
              <tr key={s.lecture_session_id || `${s.lecture_id}-${s.started_at}`}>
                <td style={{ borderBottom: '1px solid #eee' }}>{shortId(s.lecture_session_id || s.id || s.session_id)}</td>
                <td style={{ borderBottom: '1px solid #eee' }}>{lecturesMap[s.lecture_id] || s.lecture_id}</td>
                <td style={{ borderBottom: '1px solid #eee' }}>{formatDateTime(s.started_at)}</td>
                <td style={{ borderBottom: '1px solid #eee' }}>{formatDateTime(s.completed_at)}</td>
                <td style={{ borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center' }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => {
                      const sid = s.lecture_session_id || s.id || s.session_id;
                      if (sid) navigate(`/school/${schoolId}/attendance/show/${sid}`);
                    }}
                    sx={{ mr: 1 }}
                  >
                    Show Attendance
                  </Button>
                  <Tooltip title={navigator.onLine ? 'Delete session' : 'Delete requires internet connection'}>
                    <span>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteSession(s)}
                        disabled={!navigator.onLine}
                        sx={{ mr: 1 }}
                      >
                        <DeleteOutlineIcon color={navigator.onLine ? 'error' : 'disabled'} />
                      </IconButton>
                    </span>
                  </Tooltip>
                  {(() => {
                    const sid = s.lecture_session_id || s.id || s.session_id;
                    if (!sid) return null;
                    if (hasPending(sid)) {
                      return (
                        <Tooltip title={navigator.onLine ? 'Upload pending attendance' : 'Offline: will auto-upload when online'}>
                          <span>
                            <IconButton
                              size="small"
                              color={navigator.onLine ? 'primary' : 'default'}
                              onClick={async () => {
                                if (!navigator.onLine) return;
                                try { await uploadPendingMarks(sid, user?.id); } finally { setRefreshKey(prev => prev + 1); }
                              }}
                              disabled={!navigator.onLine}
                            >
                              {navigator.onLine ? <CloudUploadIcon /> : <CloudOffIcon />}
                            </IconButton>
                          </span>
                        </Tooltip>
                      );
                    }
                    if (isUploaded(sid)) {
                      return (
                        <Tooltip title="Attendance uploaded">
                          <CloudDoneIcon color="success" fontSize="small" />
                        </Tooltip>
                      );
                    }
                    return null;
                  })()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}