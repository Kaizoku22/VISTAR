import { useParams, Link, Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Header from '../components/Header';
import '../css/ManageSchoolPage.css';

export default function ManageSchoolPage() {
    const { id: schoolId } = useParams();
    const [schoolName, setSchoolName] = useState('');

    useEffect(() => {
        const fetchSchool = async () => {
            try {
                const res = await fetch(`http://localhost:8000/school/${schoolId}`);
                if (!res.ok) return;
                const data = await res.json();
                setSchoolName(data?.school_name || '');
            } catch (e) {
                // ignore network errors for header; keep default
            }
        };
        if (schoolId) fetchSchool();
    }, [schoolId]);

    return (
        <> 
            <Header />
            <div style={{ padding: '10px' }}>
                <Link to={`/school/${schoolId}`} style={{ textDecoration: 'none' }}>
                    <button style={{ padding: '8px 12px' }}>Back to School</button>
                </Link>
            </div>

            <div className="manage-layout">
                <nav className="sidebar">
                <h2>Manage School{schoolName ? `: ${schoolName}` : ''}</h2>
                    <ul>
                        <li><Link to={`standards`}>Manage Standards</Link></li>
                        <li><Link to={`divisions`}>Manage Divisions</Link></li>
                        <li><Link to={`teachers`}>Manage Teacher</Link></li>
                        <li><Link to={`subjects`}>Manage Subjects</Link></li>
                        <li><Link to={`lectures`}>Manage Lectures</Link></li>
                        <li><Link to={`enrollStudent`}>Enroll Student</Link></li>
                    </ul>
                </nav>
                <main className="manage-content">
                    <Outlet />
                </main>
            </div>
        </>
    );
}
