import React, { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './theme';
import './App.css';

// Pages
import HomePage from './Pages/HomePage';
import StudentsPage from './Pages/StudentsPage';
import ManageSchoolPage from './Pages/ManageSchoolPage';
import CreateSchoolPage from './Pages/CreateSchoolPage';
import JoinSchoolPage from './Pages/JoinSchoolPage';
import ProfilePage from './Pages/ProfilePage';
import SignUpPage from './Pages/SignUpPage';
import LoginPage from './Pages/LoginPage';
import ManageStandardsPage from './Pages/ManageStandardsPage'; // ✅ Import added
import ManageDivisionsPage from './Pages/ManageDivisionsPage';
import ManageTeachersPage from './Pages/ManageTeachersPage';
import ManageSubjectsPage from './Pages/ManageSubjectsPage';
import ManageLecturesPage from './Pages/ManageLecturesPage';
import EnrollStudent from './Pages/EnrollStudent';
import Marksheet from './Pages/Marksheet';
import CreateMarksheetPage from './Pages/CreateMarksheetPage';
import ShowMarksheetPage from './Pages/ShowMarksheetPage';
import ShowMarksheetDetailPage from './Pages/ShowMarksheetDetailPage';
import ShowStudentMarksheetPage from './Pages/ShowStudentMarksheetPage';
import Attendance from './Pages/Attendance';
import StartAttendancePage from './Pages/StartAttendancePage';
import ShowAttendancePage from './Pages/ShowAttendancePage';
import MonthlyAttendance from './Pages/MonthlyAttendance';
import RecordAttendancePage from './Pages/RecordAttendancePage';
import ShowAttendanceDetailPage from './Pages/ShowAttendanceDetailPage';

// Lazy loaded
const SchoolPage = lazy(() => import('./Pages/SchoolPage'));

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Routes>
        {/* ✅ Auth Routes */}
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* ✅ Home Route */}
        <Route path="/" element={<HomePage />} />

        {/* ✅ Header-based routes */}
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/createSchool" element={<CreateSchoolPage />} />
        <Route path="/joinSchool" element={<JoinSchoolPage />} />

        {/* ✅ School base route with nested children handled inside SchoolPage */}
        <Route
          path="/school/:id/*"
          element={
            <Suspense fallback={<div>Loading...</div>}>
              <SchoolPage />
            </Suspense>
          }
        />


        {/* Top-level routes */}
        <Route path="/school/:id/students" element={<StudentsPage />} />
        <Route path="/school/:id/marksheets" element={<Marksheet />}>
          <Route path="create" element={<CreateMarksheetPage />} />
          <Route path="show" element={<ShowMarksheetPage />} />
          <Route path="show/:marksheetId" element={<ShowMarksheetDetailPage />} />
          <Route path="show/:marksheetId/student/:studentId" element={<ShowStudentMarksheetPage />} />
        </Route>
        <Route path="/school/:id/attendance" element={<Attendance />}>
          <Route path="start" element={<StartAttendancePage />} />
          <Route path="record/:sessionId" element={<RecordAttendancePage />} />
          <Route path="show" element={<ShowAttendancePage />} />
          <Route path="show/:sessionId" element={<ShowAttendanceDetailPage />} />
          <Route path="monthly" element={<MonthlyAttendance />} />
        </Route>

        {/* Nested Manage Routes */}
        <Route path="/school/:id/manage" element={<ManageSchoolPage />}>
          <Route path="standards" element={<ManageStandardsPage />} />
          <Route path="divisions" element={<ManageDivisionsPage />} />
          <Route path="teachers" element={<ManageTeachersPage />} />
          <Route path="subjects" element={<ManageSubjectsPage />} />
          <Route path="lectures" element={<ManageLecturesPage />} />
          <Route path="enrollStudent" element={<EnrollStudent />} />
        </Route>

      </Routes>
    </ThemeProvider>
  );
}

export default App;
