import { useParams, Link, Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Header from '../components/Header';
import '../css/ManageSchoolPage.css';
import { useAuth } from '../AuthContext';

export default function Attendance() {
  const { id: schoolId } = useParams();
  const { user } = useAuth();
  const [schoolName, setSchoolName] = useState('');

  useEffect(() => {
    const fetchSchool = async () => {
      try {
        const res = await fetch(`http://localhost:8000/school/${schoolId}`);
        if (!res.ok) return;
        const data = await res.json();
        setSchoolName(data?.school_name || '');
      } catch {}
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
          <h2>Attendance{schoolName ? `: ${schoolName}` : ''}</h2>
          <ul>
            <li><Link to={`start`}>Start Attendance</Link></li>
            <li><Link to={`show`}>Show Attendance</Link></li>
            <li><Link to={`monthly`}>Monthly Attendance</Link></li>
          </ul>
        </nav>
        <main className="manage-content">
          <Outlet />
        </main>
      </div>
    </>
  );
}