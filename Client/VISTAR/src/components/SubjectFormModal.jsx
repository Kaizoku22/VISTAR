import { useState, useEffect } from "react";
import { TextField, Button, Typography, Box, FormControl, FormLabel } from '@mui/material';

export default function SubjectFormModal({ isOpen, onClose, onSubmit, initialData }) {
    const [subjectName, setSubjectName] = useState("");

    useEffect(() => {
        if (initialData) {
            setSubjectName(initialData.subject_name || "");
        } else {
            setSubjectName("");
        }
    }, [initialData]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({ subject_name: subjectName });
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal">
                <Typography variant="h6" sx={{ mb: 1 }}>{initialData ? "Edit Subject" : "Add Subject"}</Typography>
                <form onSubmit={handleSubmit}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <FormControl size="small">
                            <FormLabel htmlFor="subject-name">Subject Name</FormLabel>
                            <TextField
                                id="subject-name"
                                value={subjectName}
                                onChange={(e) => setSubjectName(e.target.value)}
                                required
                                size="small"
                                placeholder="Enter subject name"
                            />
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
