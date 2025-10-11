import { useState, useEffect } from "react";
import { Box, Typography, Button, FormControl, FormLabel, Select, MenuItem } from '@mui/material';
import '../css/TeacherSubjectModal.css'
export default function TeacherSubjectModal({ isOpen, onClose, onSubmit, initialSubjectId, subjects }) {
    const [selectedSubject, setSelectedSubject] = useState("");

    useEffect(() => {
        setSelectedSubject(initialSubjectId || "");
    }, [initialSubjectId]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(selectedSubject);
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <Typography variant="h6" sx={{ mb: 1 }}>Edit Assigned Subject</Typography>
                <form onSubmit={handleSubmit}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <FormControl size="small">
                            <FormLabel htmlFor="subject-select">Subject</FormLabel>
                            <Select
                                id="subject-select"
                                value={selectedSubject}
                                onChange={(e) => setSelectedSubject(e.target.value)}
                                displayEmpty
                            >
                                <MenuItem value="">None</MenuItem>
                                {subjects.map((subject) => (
                                    <MenuItem key={subject.subject_id} value={subject.subject_id}>
                                        {subject.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                            <Button type="submit" variant="contained">Save</Button>
                            <Button type="button" variant="outlined" onClick={onClose}>Cancel</Button>
                        </Box>
                    </Box>
                </form>
            </div>

        </div>
    );
}
