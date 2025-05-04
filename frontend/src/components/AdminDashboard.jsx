import React, { useState } from 'react';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import StudentTable from '../components/StudentTable';
import AddCounselorModal from '../components/AddCounselorModal';
import AddStudentModal from '../components/AddStudentModal';
import useSchoolData from '../hooks/useSchoolData';
import useStudents from '../hooks/useStudents';
import useAutoLogout from '../hooks/useAutoLogout';
import { handleCsvUpload, handleDownloadCsv } from '../utils/csvHandlers.js';
import { containerStyle, mainStyle, loadingStyle } from '../styles.js';

// Error Boundary Component
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return <p style={{ ...loadingStyle, color: 'red' }}>Rendering error: {this.state.error?.message || 'Unknown error'}</p>;
    }
    return this.props.children;
  }
}

export default function AdminDashboard({ user }) {
  const db = getFirestore();
  const auth = getAuth();
  const location = useLocation();
  const onMoodSelector = location.pathname.endsWith('/mood-selector');
  const onStudentProfile = location.pathname.includes('/admin/students/');

  const [uploading, setUploading] = useState(false);
  const [showCounselorModal, setShowCounselorModal] = useState(false);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [newCounselorName, setNewCounselorName] = useState('');
  const [newCounselorEmail, setNewCounselorEmail] = useState('');
  const [newCounselorCampus, setNewCounselorCampus] = useState('');
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentId, setNewStudentId] = useState('');
  const [newStudentGrade, setNewStudentGrade] = useState('');
  const [newStudentBirthday, setNewStudentBirthday] = useState('');
  const [newStudentEmail, setNewStudentEmail] = useState('');

  const {
    schoolDisplayName,
    availableCampuses,
    selectedCampus,
    setSelectedCampus,
    newStudentCampus,
    setNewStudentCampus,
    addNewCampus,
  } = useSchoolData(db, user);

  const {
    filteredStudents,
    searchQuery,
    setSearchQuery,
    loading,
    fetchStudents,
    deleteStudent,
    error,
  } = useStudents(db, user, selectedCampus);

  const handleSignOut = useAutoLogout(auth);

  const handleAddCounselor = async () => {
    if (!newCounselorName || !newCounselorEmail || !newCounselorCampus) {
      alert('Please fill in all required fields.');
      return;
    }
    try {
      await setDoc(doc(db, 'schools', user.school, 'counselors', newCounselorEmail), {
        name: newCounselorName,
        email: newCounselorEmail,
        campus: newCounselorCampus,
        createdAt: serverTimestamp(),
      });
      alert('Counselor added. Please ensure the counselor is registered in Firebase Auth.');
      setShowCounselorModal(false);
      setNewCounselorName('');
      setNewCounselorEmail('');
      setNewCounselorCampus('');
    } catch (err) {
      console.error('Error adding counselor:', err);
      alert('Failed to add counselor. Please try again.');
    }
  };

  const handleAddStudent = async () => {
    if (!newStudentName || !newStudentId || !newStudentEmail) {
      alert('Please fill in all required fields: Name, Student ID, and Email.');
      return;
    }
    if (!newStudentCampus) {
      alert('Please select a campus.');
      return;
    }
    if (!newStudentEmail.includes('@')) {
      alert('Please enter a valid email address.');
      return;
    }
    try {
      await addNewCampus(newStudentCampus);
      await setDoc(
        doc(db, 'schools', user.school, 'students', newStudentId),
        {
          name: newStudentName.trim(),
          studentId: newStudentId.trim(),
          grade: newStudentGrade ? newStudentGrade.trim() : '',
          birthday: newStudentBirthday ? newStudentBirthday.trim() : '',
          email: newStudentEmail.trim(),
          campus: newStudentCampus,
          createdAt: serverTimestamp(),
        }
      );
      setNewStudentName('');
      setNewStudentId('');
      setNewStudentGrade('');
      setNewStudentBirthday('');
      setNewStudentEmail('');
      setNewStudentCampus(selectedCampus || availableCampuses[0] || 'DefaultCampus');
      setShowStudentModal(false);
      await fetchStudents();
      alert('Student added successfully.');
    } catch (err) {
      console.error('Error adding student:', err);
      alert('Failed to add student. Please try again.');
    }
  };

  // Debug: Log filteredStudents to verify its structure
  console.log('AdminDashboard - filteredStudents:', filteredStudents);

  return (
    <div style={containerStyle}>
      <Navbar
        schoolDisplayName={schoolDisplayName}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedCampus={selectedCampus}
        setSelectedCampus={setSelectedCampus}
        availableCampuses={availableCampuses}
        user={user}
        uploading={uploading}
        handleCsvUpload={(e) => handleCsvUpload(e, user, db, selectedCampus, setUploading, fetchStudents)}
        handleDownloadCsv={() => handleDownloadCsv(filteredStudents, user, selectedCampus)}
        setShowCounselorModal={setShowCounselorModal}
        setShowStudentModal={setShowStudentModal}
        handleSignOut={handleSignOut}
      />

      <AddCounselorModal
        showCounselorModal={showCounselorModal}
        setShowCounselorModal={setShowCounselorModal}
        newCounselorName={newCounselorName}
        setNewCounselorName={setNewCounselorName}
        newCounselorEmail={newCounselorEmail}
        setNewCounselorEmail={setNewCounselorEmail}
        newCounselorCampus={newCounselorCampus}
        setNewCounselorCampus={setNewCounselorCampus}
        handleAddCounselor={handleAddCounselor}
      />

      <AddStudentModal
        showStudentModal={showStudentModal}
        setShowStudentModal={setShowStudentModal}
        newStudentName={newStudentName}
        setNewStudentName={setNewStudentName}
        newStudentId={newStudentId}
        setNewStudentId={setNewStudentId}
        newStudentEmail={newStudentEmail}
        setNewStudentEmail={setNewStudentEmail}
        newStudentGrade={newStudentGrade}
        setNewStudentGrade={setNewStudentGrade}
        newStudentBirthday={newStudentBirthday}
        setNewStudentBirthday={setNewStudentBirthday}
        newStudentCampus={newStudentCampus}
        setNewStudentCampus={setNewStudentCampus}
        availableCampuses={availableCampuses}
        selectedCampus={selectedCampus}
        handleAddStudent={handleAddStudent}
      />

      {onMoodSelector || onStudentProfile ? (
        <Outlet />
      ) : (
        <main style={mainStyle}>
          {loading ? (
            <p style={loadingStyle}>Loading student moods…</p>
          ) : error ? (
            <p style={{ ...loadingStyle, color: 'red' }}>Error: {error}</p>
          ) : Array.isArray(filteredStudents) ? (
            <ErrorBoundary>
              <StudentTable
                filteredStudents={filteredStudents}
                deleteStudent={deleteStudent}
              />
            </ErrorBoundary>
          ) : (
            <p style={{ ...loadingStyle, color: 'red' }}>
              Error: Invalid student data. Expected an array, got {JSON.stringify(filteredStudents)}.
            </p>
          )}
        </main>
      )}
    </div>
  );
}
