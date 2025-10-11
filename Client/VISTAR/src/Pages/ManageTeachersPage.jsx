import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Header from "../components/Header.jsx";
// Removed TeacherSubjectModal and Edit action; replaced with Remove
import { Typography, Button, Paper, Table, TableHead, TableRow, TableCell, TableBody, Box } from '@mui/material';
import '../css/ManageTeachers.css'
export default function ManageTeachersPage() {
    const { id: schoolId } = useParams();
    const [teachers, setTeachers] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [schoolName, setSchoolName] = useState("");

    // No edit state needed anymore

    // Fetch teachers
    const fetchTeachers = async () => {
        try {
            setLoading(true);
            const res = await fetch(`http://localhost:8000/teachers/${schoolId}`);
            if (!res.ok) {
                const msg = await res.text();
                throw new Error(msg || "Failed to fetch teachers");
            }
            const data = await res.json();
            setTeachers(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
            setError(err.message || "Failed to load teachers");
        } finally {
            setLoading(false);
        }
    };

    // Fetch subjects for dropdown
    const fetchSubjects = async () => {
        try {
            const res = await fetch(`http://localhost:8000/subjects/${schoolId}`);
            if (!res.ok) throw new Error("Failed to fetch subjects");
            const data = await res.json();
            setSubjects(data);
        } catch (err) {
            console.error("Failed to fetch subjects", err);
            setSubjects([]); // fallback to empty
        }
    };

    useEffect(() => {
        fetchTeachers();
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

    const handleRemove = async (teacher) => {
        const userId = teacher.id || teacher.user_id || teacher.teacher_id;
        if (!userId) {
            alert('Unable to determine teacher id');
            return;
        }
        const confirm = window.confirm('Remove this teacher from the school?');
        if (!confirm) return;
        try {
            const res = await fetch(`http://localhost:8000/teachers/${schoolId}/${userId}`, {
                method: 'DELETE'
            });
            if (!res.ok && res.status !== 204) {
                const text = await res.text();
                throw new Error(text || 'Failed to remove teacher');
            }
            await fetchTeachers();
        } catch (err) {
            console.error('Error removing teacher:', err);
            alert(err.message || 'Error removing teacher');
        }
    };

    const handleSubjectSave = async (subjectId) => {
        try {
            const res = await fetch(`http://localhost:8000/school/${schoolId}/teachers/${selectedTeacher.teacher_id}/assign-subject`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ subject_id: subjectId }),
            });

            if (res.ok) {
                fetchTeachers();
                setShowModal(false);
            } else {
                alert("Failed to assign subject.");
            }
        } catch (err) {
            console.error("Error assigning subject:", err);
        }
    };

    return (
        <>
            
            <div className="manage-teachers-container">
                <Typography variant="h5">Manage Teachers for {schoolName || "School"}</Typography>

                {loading && <Typography sx={{ mt: 1 }}>Loading teachers...</Typography>}
                {error && <Typography sx={{ mt: 1 }} color="error">{error}</Typography>}

                {!loading && teachers.length === 0 && (
                    <Box sx={{ mt: 2 }}>
                        <Typography>No teachers found.</Typography>
                    </Box>
                )}

                {!loading && teachers.length > 0 && (
                    <Paper sx={{ mt: 2 }}>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Name</TableCell>
                                    <TableCell>Email</TableCell>
                                    <TableCell>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {teachers.map((teacher) => {
                                    const key = teacher.user_id || teacher.id || teacher.teacher_id || Math.random();
                                    const name = teacher.name || [teacher.firstName, teacher.lastName].filter(Boolean).join(' ') || teacher.full_name || 'Unnamed';
                                    const email = teacher.email || teacher.user_email || teacher.contact_email || 'N/A';
                                    return (
                                        <TableRow key={key}>
                                            <TableCell>{name}</TableCell>
                                            <TableCell>{email}</TableCell>
                                            <TableCell>
                                                <Button color="error" variant="outlined" size="small" onClick={() => handleRemove(teacher)}>Remove</Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </Paper>
                )}
            </div>

            {/* Edit modal removed */}
        </>
    );
}
