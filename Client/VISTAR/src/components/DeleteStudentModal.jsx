import React from 'react';
import { Button, Typography, Box } from '@mui/material';
import '../css/Modal.css';

export default function DeleteStudentModal({ isOpen, onClose, onConfirm }) {
    if (!isOpen) return null;

    return (
        <div className="modal-backdrop">
            <div className="modal">
                <Typography sx={{ mb: 2 }}>Are you sure you want to delete this student?</Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button variant="contained" color="error" onClick={onConfirm}>Yes, Delete</Button>
                    <Button variant="outlined" onClick={onClose}>Cancel</Button>
                </Box>
            </div>
        </div>
    );
}
