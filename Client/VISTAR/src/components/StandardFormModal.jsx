import { useState, useEffect } from "react";
import { TextField, Button, Typography, Box, FormControl, FormLabel } from '@mui/material';

export default function StandardFormModal({ isOpen, onClose, onSubmit, initialData }) {
    const [std, setStd] = useState("");

    useEffect(() => {
        if (initialData) {
            setStd(initialData.std);
        } else {
            setStd("");
        }
    }, [initialData]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({ std });
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal">
                <Typography variant="h6" sx={{ mb: 1 }}>{initialData ? "Edit Standard" : "Add Standard"}</Typography>
                <form onSubmit={handleSubmit}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <FormControl size="small">
                            <FormLabel htmlFor="standard">Standard</FormLabel>
                            <TextField
                                id="standard"
                                value={std}
                                onChange={(e) => setStd(e.target.value)}
                                placeholder="Enter standard"
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
