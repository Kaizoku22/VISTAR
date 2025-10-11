import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Header from "../components/Header.jsx";
import StandardFormModal from "../components/StandardFormModal.jsx";
import DeleteConfirmModal from "../components/DeleteConfirmModal.jsx";
import { Typography, Button, Paper, Table, TableHead, TableRow, TableCell, TableBody, Box } from '@mui/material';

import '../css/ManageStandardsPage.css'
export default function ManageStandardsPage() {
    const { id: schoolId } = useParams();
    const [standards, setStandards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [schoolName, setSchoolName] = useState("");

    const [showFormModal, setShowFormModal] = useState(false);
    const [formInitialData, setFormInitialData] = useState(null);

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [standardToDelete, setStandardToDelete] = useState(null);

    // Fetch all standards for this school
    const fetchStandards = async () => {
        try {
            setLoading(true);
            const res = await fetch(`http://localhost:8000/school/${schoolId}/standards`);
            if (!res.ok) throw new Error("Failed to fetch standards");
            const data = await res.json();
            setStandards(data);
        } catch (err) {
            setError("Failed to load standards");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStandards();
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

    // Create or update standard
    const submitForm = async (formData) => {
        const isEdit = !!formInitialData;
        const url = isEdit
            ? `http://localhost:8000/school/${schoolId}/standards/${formInitialData.id}`
            : `http://localhost:8000/school/${schoolId}/standards`;

        const method = isEdit ? "PUT" : "POST";

        const res = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ std: formData.std }), // sending the std value only
        });

        if (res.ok) {
            fetchStandards();
            setShowFormModal(false);
        } else {
            alert("Failed to submit form.");
        }
    };

    // Delete standard
    const confirmDelete = async () => {
        const res = await fetch(`http://localhost:8000/school/standards/${standardToDelete.id}`, {
            method: "DELETE",
        });

        if (res.ok) {
            fetchStandards();
            setShowDeleteModal(false);
        } else {
            alert("Failed to delete.");
        }
    };

    const handleCreate = () => {
        setFormInitialData(null);
        setShowFormModal(true);
    };

    const handleEdit = (standard) => {
        setFormInitialData(standard);
        setShowFormModal(true);
    };

    const handleDelete = (standard) => {
        setStandardToDelete(standard);
        setShowDeleteModal(true);
    };

    return (
        <>
            <div className="manage-standards-container">
                <Typography variant="h5">Manage Standards for {schoolName || "School"}</Typography>

                {loading && <Typography sx={{ mt: 1 }}>Loading standards...</Typography>}
                {error && <Typography sx={{ mt: 1 }} color="error">{error}</Typography>}

                {!loading && standards.length === 0 && (
                    <Box sx={{ mt: 2 }}>
                        <Typography>No standards found. Please add a standard to get started.</Typography>
                        <Button sx={{ mt: 1 }} variant="contained" onClick={handleCreate}>Add Standard</Button>
                    </Box>
                )}

                {!loading && standards.length > 0 && (
                    <>
                        <Paper sx={{ mt: 2 }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Standards</TableCell>
                                        <TableCell>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {standards.map((standard) => (
                                        <TableRow key={standard.id}>
                                            <TableCell>{standard.std}</TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', gap: 1 }}>
                                                    <Button className="edit-btn" variant="outlined" size="small" onClick={() => handleEdit(standard)}>Edit</Button>
                                                    <Button className="delete-btn" variant="outlined" color="error" size="small" onClick={() => handleDelete(standard)}>Delete</Button>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Paper>
                        <Box className="add-button-wrapper" sx={{ mt: 2 }}>
                            <Button variant="contained" onClick={handleCreate}>Add Standard</Button>
                        </Box>
                    </>
                )}
            </div>

            {/* Modals */}
            <StandardFormModal
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
