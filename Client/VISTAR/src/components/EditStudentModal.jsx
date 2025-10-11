import React, { useState, useEffect } from 'react';
import { Box, TextField, FormControl, FormLabel, Select, MenuItem, Button, Typography } from '@mui/material';
import '../css/Modal.css';
const EditStudentModal = ({ student, isOpen, onClose, onSave, standards = [], divisions = [] }) => {
    const [firstname, setFirstname] = useState('');
    const [lastname, setLastname] = useState('');
    const [address, setAddress] = useState('');
    const [standardId, setStandardId] = useState('');
    const [divisionId, setDivisionId] = useState('');
    const [rollNo, setRollNo] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (student) {
            setFirstname(student.firstname);
            setLastname(student.lastname);
            setAddress(student.address);
            const initialStdId = student.standard_id || standards.find(s => s.std === student.standard)?.id || '';
            const initialDivId = student.division_id || divisions.find(d => d.division === student.div)?.div_id || '';
            setStandardId(initialStdId);
            setDivisionId(initialDivId);
            setRollNo(student.roll_no);
        }
    }, [student, standards, divisions]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const updatedStudent = {
            firstname,
            lastname,
            address,
            standard_id: standardId,
            division_id: divisionId,
            roll_no: rollNo,
        };

        try {
            const response = await fetch(`http://localhost:8000/students/${student.student_id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatedStudent),
            });

            if (!response.ok) throw new Error('Failed to update student');

            const data = await response.json();
            onSave(data); // Pass the updated student data to the parent
            onClose(); // Close the modal
        } catch (err) {
            setError(err.message);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal">
                <Typography variant="h6" sx={{ mb: 1 }}>Edit Student</Typography>
                {error && <Typography color="error" className="error-message">{error}</Typography>}
                <form onSubmit={handleSubmit}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <FormControl size="small">
                            <FormLabel htmlFor="firstname">First Name</FormLabel>
                            <TextField
                                id="firstname"
                                value={firstname}
                                onChange={(e) => setFirstname(e.target.value)}
                                required
                                size="small"
                                placeholder="First Name"
                            />
                        </FormControl>
                        <FormControl size="small">
                            <FormLabel htmlFor="lastname">Last Name</FormLabel>
                            <TextField
                                id="lastname"
                                value={lastname}
                                onChange={(e) => setLastname(e.target.value)}
                                required
                                size="small"
                                placeholder="Last Name"
                            />
                        </FormControl>
                        <FormControl size="small">
                            <FormLabel htmlFor="address">Address</FormLabel>
                            <TextField
                                id="address"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                required
                                size="small"
                                placeholder="Address"
                            />
                        </FormControl>
                        <FormControl size="small">
                            <FormLabel htmlFor="standard-select">Standard</FormLabel>
                            <Select
                                id="standard-select"
                                value={standardId}
                                onChange={(e) => setStandardId(e.target.value)}
                                required
                                displayEmpty
                                inputProps={{ 'aria-labelledby': 'standard-select-label' }}
                            >
                                <MenuItem value=""><em>Select Standard</em></MenuItem>
                                {standards.map(std => (
                                    <MenuItem key={std.id} value={std.id}>{std.std}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <FormControl size="small">
                            <FormLabel htmlFor="division-select">Division</FormLabel>
                            <Select
                                id="division-select"
                                value={divisionId}
                                onChange={(e) => setDivisionId(e.target.value)}
                                required
                                displayEmpty
                                inputProps={{ 'aria-labelledby': 'division-select-label' }}
                            >
                                <MenuItem value=""><em>Select Division</em></MenuItem>
                                {divisions.map(div => (
                                    <MenuItem key={div.div_id} value={div.div_id}>{div.division}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <FormControl size="small">
                            <FormLabel htmlFor="roll-no">Roll No</FormLabel>
                            <TextField
                                id="roll-no"
                                value={rollNo}
                                onChange={(e) => setRollNo(e.target.value)}
                                required
                                size="small"
                                placeholder="Roll No"
                            />
                        </FormControl>
                        <Box className="modal-actions" sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                            <Button type="button" onClick={onClose} variant="outlined">Cancel</Button>
                            <Button type="submit" variant="contained">Save</Button>
                        </Box>
                    </Box>
                </form>
            </div>
        </div>
    );
};

export default EditStudentModal;
