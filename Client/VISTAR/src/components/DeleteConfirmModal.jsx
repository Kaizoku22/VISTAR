

import { Button, Typography, Box } from '@mui/material';

export default function DeleteConfirmModal({ isOpen, onConfirm, onCancel }) {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal">
                <Typography sx={{ mb: 2 }}>Are you sure you want to delete this standard?</Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button variant="contained" color="error" onClick={onConfirm}>Yes, Delete</Button>
                    <Button variant="outlined" onClick={onCancel}>Cancel</Button>
                </Box>
            </div>
        </div>
    );
}
