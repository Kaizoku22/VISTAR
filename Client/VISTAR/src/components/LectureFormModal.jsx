import { useEffect, useState } from "react";
import { TextField, Button, Typography, Box, FormControl, FormLabel, MenuItem } from '@mui/material';

export default function LectureFormModal({ isOpen, onClose, onSubmit, initialData, schoolId, teachers = [], subjects = [], standards = [], divisions = [] }) {
  const [lectureName, setLectureName] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [standardId, setStandardId] = useState("");
  const [divisionId, setDivisionId] = useState("");

  useEffect(() => {
    if (initialData) {
      setLectureName(initialData.lecture_name || "");
      setTeacherId(initialData.teacher_id || "");
      setSubjectId(initialData.subject_id || "");
      setStandardId(initialData.standard || initialData.standard_id || "");
      setDivisionId(initialData.div || initialData.division_id || "");
    } else {
      setLectureName("");
      setTeacherId("");
      setSubjectId("");
      setStandardId("");
      setDivisionId("");
    }
  }, [initialData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      lecture_name: lectureName,
      teacher_id: teacherId,
      subject_id: subjectId,
      standard_id: standardId,
      division_id: divisionId
    });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <Typography variant="h6" sx={{ mb: 1 }}>{initialData ? "Edit Lecture" : "Add Lecture"}</Typography>
        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControl size="small">
              <FormLabel htmlFor="lecture-name">Lecture Name</FormLabel>
              <TextField id="lecture-name" value={lectureName} onChange={(e) => setLectureName(e.target.value)} required size="small" placeholder="Enter lecture name" />
            </FormControl>

            <FormControl size="small">
              <FormLabel>Teacher</FormLabel>
              <TextField select value={teacherId} onChange={(e) => setTeacherId(e.target.value)} required size="small">
                {teachers.map(t => {
                  const id = t.id || t.user_id;
                  const name = t.name || [t.firstName, t.lastName].filter(Boolean).join(' ') || t.email || id;
                  return <MenuItem key={id} value={id}>{name}</MenuItem>
                })}
              </TextField>
            </FormControl>

            <FormControl size="small">
              <FormLabel>Subject</FormLabel>
              <TextField select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} required size="small">
                {subjects.map(s => <MenuItem key={s.subject_id} value={s.subject_id}>{s.subject_name}</MenuItem>)}
              </TextField>
            </FormControl>

            <FormControl size="small">
              <FormLabel>Standard</FormLabel>
              <TextField select value={standardId} onChange={(e) => setStandardId(e.target.value)} required size="small">
                {standards.map(s => <MenuItem key={s.id} value={s.id}>{s.std}</MenuItem>)}
              </TextField>
            </FormControl>

            <FormControl size="small">
              <FormLabel>Division</FormLabel>
              <TextField select value={divisionId} onChange={(e) => setDivisionId(e.target.value)} required size="small">
                {divisions.map(d => <MenuItem key={d.div_id} value={d.div_id}>{d.division}</MenuItem>)}
              </TextField>
            </FormControl>

            <Box className="modal-actions" sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              <Button type="submit" variant="contained">{initialData ? "Update" : "Add"}</Button>
              <Button type="button" variant="outlined" onClick={onClose}>Cancel</Button>
            </Box>
          </Box>
        </form>
      </div>
    </div>
  );
}