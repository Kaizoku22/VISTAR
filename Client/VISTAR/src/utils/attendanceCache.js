// Simple localStorage-backed cache for attendance sessions
// Structure: { sessions: { [sessionId]: { students: [], marks: [{student_id, attendance, uploaded, ts}] } } }

const KEY = 'attendanceCache_v1';

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { sessions: {} };
    const obj = JSON.parse(raw);
    if (!obj || typeof obj !== 'object') return { sessions: {} };
    if (!obj.sessions || typeof obj.sessions !== 'object') obj.sessions = {};
    return obj;
  } catch {
    return { sessions: {} };
  }
}

function write(obj) {
  try {
    localStorage.setItem(KEY, JSON.stringify(obj));
  } catch {}
}

function normalizeRollNo(student) {
  const raw = student?.roll_no;
  const n = Number(raw);
  return Number.isFinite(n) ? n : Number.POSITIVE_INFINITY;
}

function compareStudents(a, b) {
  const ra = normalizeRollNo(a);
  const rb = normalizeRollNo(b);
  if (ra !== rb) return ra - rb;
  // Tie-breaker: name
  const na = [a?.firstname, a?.lastname].filter(Boolean).join(' ').toLowerCase();
  const nb = [b?.firstname, b?.lastname].filter(Boolean).join(' ').toLowerCase();
  if (na < nb) return -1;
  if (na > nb) return 1;
  return 0;
}

export function cacheStudents(sessionId, students) {
  if (!sessionId) return;
  const db = read();
  if (!db.sessions[sessionId]) db.sessions[sessionId] = { students: [], marks: [] };
  const list = Array.isArray(students) ? students.slice() : [];
  list.sort(compareStudents);
  db.sessions[sessionId].students = list;
  write(db);
}

export function getStudents(sessionId) {
  const db = read();
  return db.sessions[sessionId]?.students || [];
}

export function addMark(sessionId, student_id, attendance) {
  if (!sessionId || !student_id) return;
  const db = read();
  if (!db.sessions[sessionId]) db.sessions[sessionId] = { students: [], marks: [] };
  const marks = db.sessions[sessionId].marks || [];
  const idx = marks.findIndex(m => String(m.student_id) === String(student_id));
  const record = { student_id, attendance: !!attendance, uploaded: false, ts: Date.now() };
  if (idx >= 0) marks[idx] = record; else marks.push(record);
  db.sessions[sessionId].marks = marks;
  write(db);
}

export function getMarks(sessionId) {
  const db = read();
  return db.sessions[sessionId]?.marks || [];
}

export function markUploaded(sessionId, student_id) {
  const db = read();
  const sess = db.sessions[sessionId];
  if (!sess) return;
  const marks = sess.marks || [];
  const idx = marks.findIndex(m => String(m.student_id) === String(student_id));
  if (idx >= 0) marks[idx].uploaded = true;
  write(db);
}

export function hasPending(sessionId) {
  const marks = getMarks(sessionId);
  return marks.some(m => !m.uploaded);
}

function setUploadedAll(sessionId) {
  const db = read();
  if (!db.sessions[sessionId]) db.sessions[sessionId] = { students: [], marks: [] };
  db.sessions[sessionId].uploadedAll = true;
  write(db);
}

function clearMarks(sessionId) {
  const db = read();
  if (!db.sessions[sessionId]) return;
  db.sessions[sessionId].marks = [];
  write(db);
}

export async function uploadPendingMarks(sessionId, userId) {
  const marks = getMarks(sessionId).filter(m => !m.uploaded);
  const results = { total: marks.length, success: 0, failed: 0 };
  for (const m of marks) {
    try {
      const res = await fetch('http://localhost:8000/attendance/mark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lecture_session_id: sessionId,
          student_id: m.student_id,
          attendance: !!m.attendance,
          user_id: userId
        })
      });
      if (res.ok) {
        markUploaded(sessionId, m.student_id);
        results.success++;
      } else {
        results.failed++;
      }
    } catch {
      results.failed++;
    }
  }
  // If all marks are uploaded and none pending, set uploaded flag and purge marks from cache
  const stillPending = hasPending(sessionId);
  if (!stillPending) {
    setUploadedAll(sessionId);
    clearMarks(sessionId);
  }
  return results;
}

export function isUploaded(sessionId) {
  const db = read();
  const sess = db.sessions[sessionId];
  if (!sess) return false;
  if (sess.uploadedAll) return true;
  const marks = sess.marks || [];
  return marks.length > 0 && marks.every(m => !!m.uploaded);
}

export function clearSession(sessionId) {
  const db = read();
  if (db.sessions[sessionId]) {
    delete db.sessions[sessionId];
    write(db);
  }
}