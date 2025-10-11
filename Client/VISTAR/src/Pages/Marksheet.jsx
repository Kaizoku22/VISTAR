import React from 'react';
import { Link, Outlet, useParams } from 'react-router-dom';
import Header from "../components/Header";
import '../css/ManageSchoolPage.css';

export default function Marksheet() {
    const { id: schoolId } = useParams();

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
                    <h2>Marksheets</h2>
                    <ul>
                        <li><Link to={`create`}>Create Marksheet</Link></li>
                        <li><Link to={`show`}>Show Marksheet</Link></li>
                    </ul>
                </nav>
                <main className="manage-content">
                    <Outlet />
                </main>
            </div>
        </>
    );
}
