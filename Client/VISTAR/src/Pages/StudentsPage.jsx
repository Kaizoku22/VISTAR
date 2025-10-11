import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import { useParams } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import EditStudentModal from '../components/EditStudentModal'; // Import the Edit Modal
import DeleteStudentModal from '../components/DeleteStudentModal'; // Import the Delete Modal
import { Box, FormControl, InputLabel, Select, MenuItem, Button, Paper, Table, TableHead, TableRow, TableCell, TableBody, Typography, TextField } from '@mui/material';
import '../css/StudentPage.css';
export default function StudentPage() {
    const { id: schoolId } = useParams();
    const { user } = useAuth();

    const [students, setStudents] = useState([]);
    const [standards, setStandards] = useState([]);
    const [divisions, setDivisions] = useState([]);
    const [selectedStandard, setSelectedStandard] = useState('');
    const [selectedDivision, setSelectedDivision] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editStudentData, setEditStudentData] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteStudentId, setDeleteStudentId] = useState(null);
    const [isCreator, setIsCreator] = useState(false);
    const [searchName, setSearchName] = useState('');

    // Fetch standards and divisions
    useEffect(() => {
        const fetchFilters = async () => {
            try {
                const stdRes = await fetch(`http://localhost:8000/school/${schoolId}/standards`);
                const divRes = await fetch(`http://localhost:8000/school/${schoolId}/divisions`);
                if (!stdRes.ok || !divRes.ok) throw new Error('Failed to fetch filters');
                const stdData = await stdRes.json();
                const divData = await divRes.json();
                setStandards(stdData);
                setDivisions(divData);
            } catch (err) {
                setError(err.message);
            }
        };

        fetchFilters();
    }, [schoolId]);

    // Determine if current user is the creator of the school
    useEffect(() => {
        const fetchSchool = async () => {
            try {
                const res = await fetch(`http://localhost:8000/school/${schoolId}`);
                if (!res.ok) return;
                const data = await res.json();
                const creatorId = String(data?.creator ?? '');
                const userId = String(user?.id ?? '');
                setIsCreator(!!userId && creatorId === userId);
            } catch (e) {
                // ignore error; default isCreator false
            }
        };
        if (schoolId) fetchSchool();
    }, [schoolId, user?.id]);

    // Fetch students based on filters
    const fetchStudents = async () => {
        if (!selectedStandard || !selectedDivision) {
            alert("Please select both standard and division");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`http://localhost:8000/students/${schoolId}?standard_id=${selectedStandard}&division_id=${selectedDivision}`);
            if (!response.ok) throw new Error('Failed to fetch student data');
            const data = await response.json();
            setStudents(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Search students by name (within this school, optional filters)
    const fetchStudentsByName = async () => {
        const name = searchName.trim();
        if (!name) {
            alert('Enter a name to search');
            return;
        }
        setLoading(true);
        try {
            const params = new URLSearchParams({ name });
            if (selectedStandard) params.append('standard_id', selectedStandard);
            if (selectedDivision) params.append('division_id', selectedDivision);
            const response = await fetch(`http://localhost:8000/students/${schoolId}?${params.toString()}`);
            if (!response.ok) throw new Error('Failed to search students');
            const data = await response.json();
            setStudents(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Handle edit - open the Edit modal and set student data
    const handleEdit = (student) => {
        setEditStudentData(student);
        setShowEditModal(true);
    };

    // Handle delete - open the Delete confirmation modal
    const handleDelete = (studentId) => {
        setDeleteStudentId(studentId);
        setShowDeleteModal(true);
    };

    // Handle delete confirmation
    const handleDeleteConfirm = async () => {
        const studentId = deleteStudentId;
        const confirmed = window.confirm("Are you sure you want to delete this student?");
        if (!confirmed) return;

        try {
            const res = await fetch(`http://localhost:8000/students/${studentId}`, { method: 'DELETE' });
            if (!res.ok) throw new Error("Failed to delete student");
            setShowDeleteModal(false); // Close the delete modal
            fetchStudents(); // Refresh the student list
        } catch (err) {
            alert(err.message);
        }
    };

    return (
        <>
            <Header />
            <div className="student-page" style={{ padding: "1rem" }}>
                <Typography variant="h5" sx={{ mb: 2 }}>Filter Students</Typography>

                <Box className="filter-row" sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <FormControl sx={{ minWidth: 200 }}>
                        <InputLabel id="standard-label">Standard</InputLabel>
                        <Select
                            labelId="standard-label"
                            value={selectedStandard}
                            label="Standard"
                            onChange={(e) => setSelectedStandard(e.target.value)}
                        >
                            <MenuItem value=""><em>Select Standard</em></MenuItem>
                            {standards.map(std => (
                                <MenuItem key={std.id} value={std.id}>{std.std}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl sx={{ minWidth: 200 }}>
                        <InputLabel id="division-label">Division</InputLabel>
                        <Select
                            labelId="division-label"
                            value={selectedDivision}
                            label="Division"
                            onChange={(e) => setSelectedDivision(e.target.value)}
                        >
                            <MenuItem value=""><em>Select Division</em></MenuItem>
                            {divisions.map(div => (
                                <MenuItem key={div.div_id} value={div.div_id}>{div.division}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <Button variant="contained" onClick={fetchStudents}>Display</Button>

                    {/* Search by student name (beside filters) */}
                    <TextField
                        label="Search by name"
                        value={searchName}
                        onChange={(e) => setSearchName(e.target.value)}
                        sx={{ minWidth: 260 ,marginTop:'6px'}}
                        size="small"
                    />
                    <Button variant="outlined" onClick={fetchStudentsByName}>Search</Button>
                </Box>

                {loading && <Typography>Loading student data...</Typography>}
                {error && <Typography color="error" className="error-message">{error}</Typography>}

                {!loading && !error && students.length > 0 && (
                    <Paper sx={{ width: '100%', overflowX: 'auto' }}>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Roll No</TableCell>
                                    <TableCell>First Name</TableCell>
                                    <TableCell>Last Name</TableCell>
                                    <TableCell>Address</TableCell>
                                    <TableCell>Standard</TableCell>
                                    <TableCell>Division</TableCell>
                                    {isCreator && <TableCell>Actions</TableCell>}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {students.map(student => (
                                    <TableRow key={student.student_id}>
                                        <TableCell>{student.roll_no}</TableCell>
                                        <TableCell>{student.firstname}</TableCell>
                                        <TableCell>{student.lastname}</TableCell>
                                        <TableCell>{student.address}</TableCell>
                                        <TableCell>{student.standard || standards.find(s => s.id === student.standard_id)?.std || ''}</TableCell>
                                        <TableCell>{student.div || divisions.find(d => d.div_id === student.division_id)?.division || ''}</TableCell>
                                        {isCreator && (
                                            <TableCell>
                                                <Box sx={{ display: 'flex', gap: 1 }}>
                                                    <Button variant="outlined" size="small" onClick={() => handleEdit(student)}>Edit</Button>
                                                    <Button variant="outlined" color="error" size="small" onClick={() => handleDelete(student.student_id)}>Delete</Button>
                                                </Box>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Paper>
                )}

                {!loading && !error && students.length === 0 && (
                    <Typography sx={{ mt: 1 }} color="text.secondary">No students found.</Typography>
                )}
            </div>

            {/* Edit Student Modal */}
            <EditStudentModal
                student={editStudentData}
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                onSave={(updatedStudent) => {
                    // Handle the save operation after editing
                    console.log('Updated Student:', updatedStudent);
                    setShowEditModal(false);
                    fetchStudents(); // Refresh the list
                }}
                standards={standards}
                divisions={divisions}
            />

            {/* Delete Student Modal */}
            <DeleteStudentModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDeleteConfirm}
            />
        </>
    );
}
