import { useState, useEffect } from "react";
import { TextField, Button, Typography, Box, FormControl, FormLabel } from '@mui/material';


export default function DivisionFormModal({ isOpen, onClose, onSubmit, initialData }) {
    const [division, setDivision] = useState("");

    useEffect(() => {
        if (initialData) {
            setDivision(initialData.division);
        } else {
            setDivision("");
        }
    }, [initialData]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({ division });
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal">
                <Typography variant="h6" sx={{ mb: 1 }}>{initialData ? "Edit Division" : "Add Division"}</Typography>
                <form onSubmit={handleSubmit}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <FormControl size="small">
                            <FormLabel htmlFor="division">Division</FormLabel>
                            <TextField
                                id="division"
                                value={division}
                                onChange={(e) => setDivision(e.target.value)}
                                placeholder="Enter division"
                                required
                                size="small"
                            />
                        </FormControl>
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                            <Button type="submit" variant="contained">{initialData ? "Update" : "Create"}</Button>
                            <Button type="button" variant="outlined" onClick={onClose}>Cancel</Button>
                        </Box>
                    </Box>
                </form>
            </div>
        </div>
    );
}
