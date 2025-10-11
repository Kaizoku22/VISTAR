import { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import LectureFormModal from "../components/LectureFormModal.jsx";
import { Typography, Button, Paper, Table, TableHead, TableRow, TableCell, TableBody, Box } from '@mui/material';

export default function ManageLecturesPage() {
  const { id: schoolId } = useParams();
  const [lectures, setLectures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [schoolName, setSchoolName] = useState("");

  const [showFormModal, setShowFormModal] = useState(false);
  const [formInitialData, setFormInitialData] = useState(null);

  // Reference data for display and selects
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [standards, setStandards] = useState([]);
  const [divisions, setDivisions] = useState([]);

  const teacherMap = useMemo(() => Object.fromEntries((teachers || []).map(t => [t.id || t.user_id, (t.firstName && t.lastName) ? `${t.firstName} ${t.lastName}` : t.name || t.email || 'Teacher'])), [teachers]);
  const subjectMap = useMemo(() => Object.fromEntries((subjects || []).map(s => [s.subject_id, s.subject_name])), [subjects]);
  const standardMap = useMemo(() => Object.fromEntries((standards || []).map(s => [s.id, s.std])), [standards]);
  const divisionMap = useMemo(() => Object.fromEntries((divisions || []).map(d => [d.div_id, d.division])), [divisions]);

  const fetchLectures = async () => {
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:8000/lectures/${schoolId}`);
      if (!res.ok) throw new Error("Failed to fetch lectures");
      const data = await res.json();
      setLectures(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load lectures");
    } finally {
      setLoading(false);
    }
  };

  const fetchRefs = async () => {
    try {
      const [tRes, sRes, stdRes, dRes] = await Promise.all([
        fetch(`http://localhost:8000/teachers/${schoolId}`),
        fetch(`http://localhost:8000/subjects/${schoolId}`),
        fetch(`http://localhost:8000/school/${schoolId}/standards`),
        fetch(`http://localhost:8000/school/${schoolId}/divisions`)
      ]);
      const [t, s, std, d] = await Promise.all([tRes.json(), sRes.json(), stdRes.json(), dRes.json()]);
      setTeachers(Array.isArray(t) ? t : []);
      setSubjects(Array.isArray(s) ? s : []);
      setStandards(Array.isArray(std) ? std : []);
      setDivisions(Array.isArray(d) ? d : []);
    } catch (e) {
      console.warn('Failed fetching reference data', e);
    }
  };

  useEffect(() => {
    fetchLectures();
    fetchRefs();
    (async () => {
      try {
        const res = await fetch(`http://localhost:8000/school/${schoolId}`);
        if (!res.ok) return;
        const data = await res.json();
        setSchoolName(data?.school_name || "");
      } catch {}
    })();
  }, [schoolId]);

  const handleCreate = () => {
    setFormInitialData(null);
    setShowFormModal(true);
  };

  const handleEdit = (lecture) => {
    setFormInitialData(lecture);
    setShowFormModal(true);
  };

  const handleDelete = async (lecture) => {
    const ok = window.confirm('Delete this lecture?');
    if (!ok) return;
    try {
      const res = await fetch(`http://localhost:8000/lectures/${lecture.lecture_id}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) throw new Error('Failed to delete lecture');
      await fetchLectures();
    } catch (e) {
      alert(e.message || 'Failed to delete lecture');
    }
  };

  const handleSubmitForm = async (payload) => {
    try {
      if (formInitialData?.lecture_id) {
        const res = await fetch(`http://localhost:8000/lectures/${formInitialData.lecture_id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('Failed to update lecture');
      } else {
        const res = await fetch(`http://localhost:8000/lectures`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, school_id: schoolId })
        });
        if (!res.ok) throw new Error('Failed to create lecture');
      }
      setShowFormModal(false);
      await fetchLectures();
    } catch (e) {
      alert(e.message || 'Failed to save lecture');
    }
  };

  return (
    <>
      <div className="manage-lectures-container">
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h5">Manage Lectures for {schoolName || "School"}</Typography>
          <Button variant="contained" onClick={handleCreate}>Add Lecture</Button>
        </Box>

        {loading && <Typography sx={{ mt: 1 }}>Loading lectures...</Typography>}
        {error && <Typography sx={{ mt: 1 }} color="error">{error}</Typography>}

        {!loading && lectures.length === 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography>No lectures found.</Typography>
          </Box>
        )}

        {!loading && lectures.length > 0 && (
          <Paper sx={{ mt: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Lecture Name</TableCell>
                  <TableCell>Teacher</TableCell>
                  <TableCell>Subject</TableCell>
                  <TableCell>Standard</TableCell>
                  <TableCell>Division</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {lectures.map((lec) => (
                  <TableRow key={lec.lecture_id}>
                    <TableCell>{lec.lecture_name || 'Untitled'}</TableCell>
                    <TableCell>{teacherMap[lec.teacher_id] || lec.teacher_id || '—'}</TableCell>
                    <TableCell>{subjectMap[lec.subject_id] || lec.subject_id || '—'}</TableCell>
                    <TableCell>{standardMap[lec.standard] || lec.standard || '—'}</TableCell>
                    <TableCell>{divisionMap[lec.div] || lec.div || '—'}</TableCell>
                    <TableCell>
                      <Button variant="outlined" size="small" onClick={() => handleEdit(lec)} sx={{ mr: 1 }}>Edit</Button>
                      <Button color="error" variant="outlined" size="small" onClick={() => handleDelete(lec)}>Delete</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        )}
      </div>

      <LectureFormModal
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
        onSubmit={handleSubmitForm}
        initialData={formInitialData}
        schoolId={schoolId}
        teachers={teachers}
        subjects={subjects}
        standards={standards}
        divisions={divisions}
      />
    </>
  );
}