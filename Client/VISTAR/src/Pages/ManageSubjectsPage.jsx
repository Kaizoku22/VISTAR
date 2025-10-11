import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Header from "../components/Header.jsx";
import SubjectFormModal from "../components/SubjectFormModal.jsx";
import DeleteConfirmModal from "../components/DeleteConfirmModal.jsx";
import { Typography, Button, Paper, Table, TableHead, TableRow, TableCell, TableBody, Box } from '@mui/material';

import '../css/ManageSubjectsPage.css'
export default function ManageSubjectsPage() {
    const { id: schoolId } = useParams();
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [schoolName, setSchoolName] = useState("");

    const [showFormModal, setShowFormModal] = useState(false);
    const [formInitialData, setFormInitialData] = useState(null);

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [subjectToDelete, setSubjectToDelete] = useState(null);

    const fetchSubjects = async () => {
        try {
            setLoading(true);
            const res = await fetch(`http://localhost:8000/subjects/${schoolId}`);
            if (!res.ok) throw new Error("Failed to fetch subjects");
            const data = await res.json();
            setSubjects(data);
        } catch (err) {
            setError("Failed to load subjects");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubjects();
        // fetch school name for heading
        (async () => {
            try {
                const res = await fetch(`http://localhost:8000/school/${schoolId}`);
                if (!res.ok) return;
                const data = await res.json();
                setSchoolName(data?.school_name || "");
            } catch {}
        })();
    }, [schoolId]);

    const submitForm = async (formData) => {
        const isEdit = !!formInitialData;
        const url = isEdit
            ? `http://localhost:8000/subjects/${schoolId}/${formInitialData.subject_id}`
            : `http://localhost:8000/subjects`;

        const method = isEdit ? "PUT" : "POST";
        const body = isEdit
            ? JSON.stringify({ subject_name: formData.subject_name })
            : JSON.stringify({ subject_name: formData.subject_name, school_id: schoolId });

        const res = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body
        });

        if (res.ok) {
            fetchSubjects();
            setShowFormModal(false);
        } else {
            alert("Failed to submit form.");
        }
    };

    const confirmDelete = async () => {
        const res = await fetch(`http://localhost:8000/subjects/${subjectToDelete.subject_id}`, {
            method: "DELETE",
        });

        if (res.ok) {
            fetchSubjects();
            setShowDeleteModal(false);
        } else {
            alert("Failed to delete subject.");
        }
    };

    const handleCreate = () => {
        setFormInitialData(null);
        setShowFormModal(true);
    };

    const handleEdit = (subject) => {
        setFormInitialData(subject);
        setShowFormModal(true);
    };

    const handleDelete = (subject) => {
        setSubjectToDelete(subject);
        setShowDeleteModal(true);
    };

    return (
        <>
            <div className="manage-subjects-container">
                <Typography variant="h5">Manage Subjects for {schoolName || "School"}</Typography>

                {loading && <Typography sx={{ mt: 1 }}>Loading subjects...</Typography>}
                {error && <Typography sx={{ mt: 1 }} color="error">{error}</Typography>}

                {!loading && subjects.length === 0 && (
                    <Box sx={{ mt: 2 }}>
                        <Typography>No subjects found. Please add a subject to get started.</Typography>
                        <Button sx={{ mt: 1 }} variant="contained" onClick={handleCreate}>Add Subject</Button>
                    </Box>
                )}

                {!loading && subjects.length > 0 && (
                    <>
                        <Paper sx={{ mt: 2 }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Subject</TableCell>
                                        <TableCell>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {subjects.map((subject) => (
                                        <TableRow key={subject.subject_id}>
                                            <TableCell>{subject.subject_name}</TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', gap: 1 }}>
                                                    <Button className="edit-btn" variant="outlined" size="small" onClick={() => handleEdit(subject)}>Edit</Button>
                                                    <Button className="delete-btn" variant="outlined" color="error" size="small" onClick={() => handleDelete(subject)}>Delete</Button>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Paper>
                        <Box className="add-button-wrapper" sx={{ mt: 2 }}>
                            <Button variant="contained" onClick={handleCreate}>Add Subject</Button>
                        </Box>
                    </>
                )}
            </div>

            <SubjectFormModal
                isOpen={showFormModal}
                onClose={() => setShowFormModal(false)}
                onSubmit={submitForm}
                initialData={formInitialData}
            />

            <DeleteConfirmModal
                isOpen={showDeleteModal}
                onConfirm={confirmDelete}
                onCancel={() => setShowDeleteModal(false)}
            />
        </>
    );
}
