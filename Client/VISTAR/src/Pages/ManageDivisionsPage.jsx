import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Header from "../components/Header.jsx";
import DivisionFormModal from "../components/DivisionFormModal.jsx";
import DeleteConfirmModal from "../components/DeleteConfirmModal.jsx";
import { Typography, Button, Paper, Table, TableHead, TableRow, TableCell, TableBody, Box } from '@mui/material';
import '../css/ManageDivisionsPage.css';
export default function ManageDivisionsPage() {
    const { id: schoolId } = useParams();
    const [divisions, setDivisions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [schoolName, setSchoolName] = useState("");

    const [showFormModal, setShowFormModal] = useState(false);
    const [formInitialData, setFormInitialData] = useState(null);

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [divisionToDelete, setDivisionToDelete] = useState(null);

    // Fetch divisions for this school
    const fetchDivisions = async () => {
        try {
            setLoading(true);
            const res = await fetch(`http://localhost:8000/school/${schoolId}/divisions`);
            if (!res.ok) throw new Error("Failed to fetch divisions");
            const data = await res.json();
            setDivisions(data);
        } catch (err) {
            setError("Failed to load divisions");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDivisions();
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

    // Create or update division
    const submitForm = async (formData) => {
        const isEdit = !!formInitialData;
        const url = isEdit
            ? `http://localhost:8000/school/${schoolId}/divisions/${formInitialData.div_id}`
            : `http://localhost:8000/school/${schoolId}/divisions`;

        const method = isEdit ? "PUT" : "POST";

        const res = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ division: formData.division }),
        });

        if (res.ok) {
            fetchDivisions();
            setShowFormModal(false);
        } else {
            alert("Failed to submit form.");
        }
    };

    // Delete division
    const confirmDelete = async () => {
        const res = await fetch(`http://localhost:8000/school/divisions/${divisionToDelete.div_id}`, {
            method: "DELETE",
        });

        if (res.ok) {
            fetchDivisions();
            setShowDeleteModal(false);
        } else {
            alert("Failed to delete.");
        }
    };

    const handleCreate = () => {
        setFormInitialData(null);
        setShowFormModal(true);
    };

    const handleEdit = (division) => {
        setFormInitialData(division);
        setShowFormModal(true);
    };

    const handleDelete = (division) => {
        setDivisionToDelete(division);
        setShowDeleteModal(true);
    };

    return (
        <>
            <div className="manage-divisions-container">
                <Typography variant="h5">Manage Divisions for {schoolName || "School"}</Typography>

                {loading && <Typography sx={{ mt: 1 }}>Loading divisions...</Typography>}
                {error && <Typography sx={{ mt: 1 }} color="error">{error}</Typography>}

                {!loading && divisions.length === 0 && (
                    <Box sx={{ mt: 2 }}>
                        <Typography>No divisions found. Please add a division to get started.</Typography>
                        <Button sx={{ mt: 1 }} variant="contained" onClick={handleCreate}>Add Division</Button>
                    </Box>
                )}

                {!loading && divisions.length > 0 && (
                    <>
                        <Paper sx={{ mt: 2 }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Division</TableCell>
                                        <TableCell>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {divisions.map((division) => (
                                        <TableRow key={division.div_id}>
                                            <TableCell>{division.division}</TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', gap: 1 }}>
                                                    <Button className="edit-btn" variant="outlined" size="small" onClick={() => handleEdit(division)}>Edit</Button>
                                                    <Button className="delete-btn" variant="outlined" color="error" size="small" onClick={() => handleDelete(division)}>Delete</Button>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Paper>
                        <Box className="add-button-wrapper" sx={{ mt: 2 }}>
                            <Button variant="contained" onClick={handleCreate}>Add Division</Button>
                        </Box>
                    </>
                )}
            </div>

            {/* Modals */}
            <DivisionFormModal
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
