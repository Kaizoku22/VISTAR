import React, { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import Header from '../components/Header';
import { useParams } from 'react-router-dom';
import { Box, Typography, Button, CircularProgress, Paper, IconButton } from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CloseIcon from '@mui/icons-material/Close';
import '../css/EnrollStudent.css'

export default function EnrollStudent() {
    const { id: schoolId } = useParams();

    const [standards, setStandards] = useState([]);
    const [divisions, setDivisions] = useState([]);
    const [formData, setFormData] = useState({
        firstname: '',
        lastname: '',
        address: '',
        standard_id: '',
        division_id: '',
        roll_no: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Import from file state
    const [importFile, setImportFile] = useState(null);
    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] = useState(null);

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

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!schoolId) {
            setError('Missing school id from route. Please navigate from the school page.');
            return;
        }

        const { firstname, lastname, address, standard_id, division_id, roll_no } = formData;
        if (!firstname || !lastname || !address || !standard_id || !division_id || !roll_no) {
            alert("Please fill in all fields.");
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const res = await fetch("http://localhost:8000/students", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    firstname,
                    lastname,
                    address,
                    roll_no: String(roll_no),
                    school_id: String(schoolId),
                    standard_id,
                    division_id
                })
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || "Failed to enroll student");
            }
            setSuccess("Student enrolled successfully!");
            setFormData({
                firstname: '',
                lastname: '',
                address: '',
                standard_id: '',
                division_id: '',
                roll_no: ''
            });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0] || null;
        setImportFile(file);
        setImportResult(null);
    };

    const clearImportFile = () => {
        setImportFile(null);
        setImportResult(null);
    };

    const enrollFromFile = async () => {
        if (!importFile) {
            alert('Please select a .csv or Excel file first.');
            return;
        }
        setImporting(true);
        setError(null);
        setSuccess(null);
        setImportResult(null);
        try {
            let workbook;
            const name = importFile.name.toLowerCase();
            if (name.endsWith('.csv')) {
                const text = await importFile.text();
                workbook = XLSX.read(text, { type: 'string' });
            } else {
                const buffer = await importFile.arrayBuffer();
                workbook = XLSX.read(buffer, { type: 'array' });
            }
            const firstSheet = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheet];

            // Detect if first row is header; if yes, ignore it automatically
            const normalize = (s) => String(s).toLowerCase().replace(/[_\s]+/g, '').trim();
            const headerSynonyms = {
                firstname: ['firstname', 'first_name', 'firstname', 'firstname'],
                lastname: ['lastname', 'last_name', 'surname'],
                address: ['address', 'addr'],
                standard: ['standard', 'std', 'class'],
                division: ['division', 'div', 'section'],
                roll_no: ['rollno', 'roll_no', 'rollnumber', 'roll_number', 'roll']
            };
            const expectedOrder = ['firstname','lastname','address','standard','division','roll_no'];

            const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
            const firstRow = Array.isArray(rawRows) && rawRows.length ? rawRows[0] : [];
            const cellSet = new Set(firstRow.map(v => normalize(v)));
            const hasHeader = expectedOrder.every(key => (headerSynonyms[key] || [key]).some(alias => cellSet.has(normalize(alias))));

            const rowsRaw = hasHeader
                ? XLSX.utils.sheet_to_json(worksheet, { defval: '' })
                : XLSX.utils.sheet_to_json(worksheet, { defval: '', header: expectedOrder });

            // Canonicalize keys so synonyms like 'div' or 'std' map to expected keys
            const keyNorm = (s) => String(s || '').toLowerCase().replace(/[\s_\-]+/g, '').trim();
            const canonicalizeRow = (r) => {
                const out = {};
                Object.entries(r || {}).forEach(([k, v]) => {
                    const nk = keyNorm(k);
                    switch (nk) {
                        case 'firstname': out.firstname = v; break;
                        case 'lastname':
                        case 'surname': out.lastname = v; break;
                        case 'address':
                        case 'addr': out.address = v; break;
                        case 'standard':
                        case 'std':
                        case 'class': out.standard = v; break;
                        case 'division':
                        case 'div':
                        case 'section': out.division = v; break;
                        case 'rollno':
                        case 'rollnumber':
                        case 'rollnumber': // duplicate safe
                        case 'rollnumber': // duplicate safe
                        case 'rollnumber': // duplicate safe
                        case 'rollnumber': // duplicate safe
                        case 'rollnumber': // duplicate safe
                        case 'rollnumber': // duplicate safe
                        case 'rollnumber': // duplicate safe
                        case 'rollnumber': // duplicate safe
                        case 'rollnumber': // duplicate safe
                        case 'rollnumber': // duplicate safe
                        case 'rollnumber': // duplicate safe
                        case 'rollnumber': // duplicate safe
                        case 'rollnumber': // duplicate safe
                        case 'roll_number':
                        case 'roll': out.roll_no = v; break;
                        case 'standardid':
                        case 'standard_id': out.standard_id = v; break;
                        case 'divisionid':
                        case 'division_id': out.division_id = v; break;
                        default:
                            // Preserve unknown keys without normalization
                            out[k] = v;
                    }
                });
                return out;
            };

            const rows = Array.isArray(rowsRaw) ? rowsRaw.map(canonicalizeRow) : [];

            if (!Array.isArray(rows) || rows.length === 0) {
                setError('No rows found in the selected file.');
                return;
            }

            let successCount = 0;
            let failCount = 0;
            let unmatchedStd = 0;
            let unmatchedDiv = 0;

            // Ensure standards/divisions lists are available; fetch if empty (use local copies for immediate mapping)
            let standardsList = standards;
            let divisionsList = divisions;
            if (!standardsList.length || !divisionsList.length) {
                try {
                    const [stdRes, divRes] = await Promise.all([
                        fetch(`http://localhost:8000/school/${schoolId}/standards`),
                        fetch(`http://localhost:8000/school/${schoolId}/divisions`)
                    ]);
                    const stdJson = stdRes.ok ? await stdRes.json() : [];
                    const divJson = divRes.ok ? await divRes.json() : [];
                    setStandards(stdJson);
                    setDivisions(divJson);
                    standardsList = stdJson;
                    divisionsList = divJson;
                } catch {}
            }

            const norm = (v) => String(v || '').toLowerCase().replace(/[\s_\-]+/g, '').trim();

            for (const r of rows) {
                // Map text values (standard/division) or use IDs if provided
                const stdMatch = r.standard_id
                    ? standardsList.find(s => String(s.id) === String(r.standard_id))
                    : standardsList.find(s => norm(s.std) === norm(r.standard));
                const divMatch = r.division_id
                    ? divisionsList.find(d => String(d.div_id) === String(r.division_id))
                    : divisionsList.find(d => norm(d.division) === norm(r.division));
                if (!stdMatch && !r.standard) unmatchedStd++;
                if (!divMatch && !r.division) unmatchedDiv++;

                const payload = {
                    firstname: String(r.firstname || '').trim(),
                    lastname: String(r.lastname || '').trim(),
                    address: String(r.address || '').trim(),
                    roll_no: String(r.roll_no),
                    school_id: String(schoolId)
                };

                if (stdMatch?.id) payload.standard_id = stdMatch.id;
                else if (r.standard) payload.standard = String(r.standard).trim();

                if (divMatch?.div_id) payload.division_id = divMatch.div_id;
                else if (r.division) payload.div = String(r.division).trim();

                // Validate required fields – allow either IDs or text values
                const hasStd = Boolean(payload.standard_id || payload.standard);
                const hasDiv = Boolean(payload.division_id || payload.div);
                if (!payload.firstname || !payload.lastname || !payload.address || !payload.roll_no || !hasStd || !hasDiv) {
                    failCount++;
                    continue;
                }

                try {
                    const res = await fetch('http://localhost:8000/students', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                    if (!res.ok) {
                        failCount++;
                    } else {
                        successCount++;
                    }
                } catch (err) {
                    failCount++;
                }
            }

            setImportResult({ successCount, failCount, total: rows.length, unmatchedStd, unmatchedDiv });
            setSuccess(`Imported ${successCount} of ${rows.length} students`);
            if (failCount) {
                const extra = [];
                if (unmatchedStd) extra.push(`${unmatchedStd} unmatched standard`);
                if (unmatchedDiv) extra.push(`${unmatchedDiv} unmatched division`);
                setError(`${failCount} rows failed to import${extra.length ? ` (${extra.join(', ')})` : ''}`);
            }
        } catch (err) {
            setError('Failed to parse the selected file. Ensure headers: firstname, lastname, address, standard, division, roll_no');
        } finally {
            setImporting(false);
        }
    };

    return (
        <>
            <div className="enroll-student-container" style={{ padding: "1rem", maxWidth: "600px", margin: "auto" }}>
                <h2>Enroll New Student</h2>
                {error && <p className="enroll-message error" style={{ color: "red" }}>{error}</p>}
                {success && <p className="enroll-message success" style={{ color: "green" }}>{success}</p>}

                <form onSubmit={handleSubmit} className="enroll-student-form">
                    <label htmlFor="firstname">First Name</label>
                    <input
                        id="firstname"
                        type="text"
                        name="firstname"
                        value={formData.firstname}
                        onChange={handleChange}
                    />

                    <label htmlFor="lastname">Last Name</label>
                    <input
                        id="lastname"
                        type="text"
                        name="lastname"
                        value={formData.lastname}
                        onChange={handleChange}
                    />

                    <label htmlFor="address">Address</label>
                    <input
                        id="address"
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                    />

                    <label htmlFor="standard_id">Standard</label>
                    <select id="standard_id" name="standard_id" value={formData.standard_id} onChange={handleChange}>
                        <option value="">Select Standard</option>
                        {standards.map(std => (
                            <option key={std.id} value={std.id}>{std.std}</option>
                        ))}
                    </select>

                    <label htmlFor="division_id">Division</label>
                    <select id="division_id" name="division_id" value={formData.division_id} onChange={handleChange}>
                        <option value="">Select Division</option>
                        {divisions.map(div => (
                            <option key={div.div_id} value={div.div_id}>{div.division}</option>
                        ))}
                    </select>

                    <label htmlFor="roll_no">Roll Number</label>
                    <input
                        id="roll_no"
                        type="number"
                        name="roll_no"
                        value={formData.roll_no}
                        onChange={handleChange}
                    />

                <button type="submit" disabled={loading}>
                    {loading ? "Submitting..." : "Enroll Student"}
                </button>
            </form>

            {/* Import student data section */}
            <Paper elevation={2} style={{ marginTop: '2rem', padding: '1rem' }}>
                <Typography variant="h6" gutterBottom>Import student data</Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                    Select a .csv or Excel file with headers: firstname, lastname, address, <strong>standard</strong>, <strong>division</strong>, roll_no
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                    <Button variant="outlined" startIcon={<UploadFileIcon />} component="label">
                        Choose File
                        <input hidden type="file" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" onChange={handleFileChange} />
                    </Button>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                            {importFile ? importFile.name : 'No file selected'}
                        </Typography>
                        {importFile && (
                            <IconButton aria-label="remove file" size="small" onClick={clearImportFile}>
                                <CloseIcon fontSize="small" />
                            </IconButton>
                        )}
                    </Box>
                    <Button variant="contained" color="primary" startIcon={<CloudUploadIcon />} onClick={enrollFromFile} disabled={!importFile || importing}>
                        Import & Enroll
                    </Button>
                    {importing && <CircularProgress size={24} />}
                </Box>
                {importResult && (
                    <Typography className="enroll-message success" sx={{ mt: 1 }}>
                        Imported: {importResult.successCount} success, {importResult.failCount} failed (Total {importResult.total})
                    </Typography>
                )}
            </Paper>
        </div>
        </>
    );
}
