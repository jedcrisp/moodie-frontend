// frontend/src/components/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { getAuth, signOut } from 'firebase/auth';
import { getFirestore, collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import Navbar from './Navbar.jsx';
import StudentTable from './StudentTable.jsx';
import AddStudentModal from './AddStudentModal.jsx';
import AddCounselorModal from './AddCounselorModal.jsx';
import useStudents from '../hooks/useStudents.js';
import useSchoolData from '../hooks/useSchoolData.js';
import { containerStyle, mainStyle, loadingStyle } from '../styles.js';

export default function AdminDashboard({ user }) {
  const navigate = useNavigate();
  const db = getFirestore();
  const [uploading, setUploading] = useState(false);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [showCounselorModal, setShowCounselorModal] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentId, setNewStudentId] = useState('');
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [newStudentGrade, setNewStudentGrade] = useState('');
  const [newStudentBirthday, setNewStudentBirthday] = useState('');
  const [newStudentCampus, setNewStudentCampus] = useState('');
  const [newCounselorName, setNewCounselorName] = useState('');
  const [newCounselorEmail, setNewCounselorEmail] = useState('');
  const [newCounselorCampus, setNewCounselorCampus] = useState('');

  const { schoolDisplayName, availableCampuses, fetchSchoolData } = useSchoolData(db, user);
  const {
    filteredStudents,
    searchQuery,
    setSearchQuery,
    selectedCampus,
    setSelectedCampus,
    loading,
    fetchStudents,
    deleteStudent,
  } = useStudents(db, user, user?.campuses?.length > 0 ? user.campuses[0] : selectedCampus);

  useEffect(() => {
    const t = setTimeout(() => {
      handleSignOut();
      navigate('/signin');
    }, 10 * 60 * 1000);
    return () => clearTimeout(t);
  }, [navigate]);

  const handleSignOut = async () => {
    try {
      await signOut(getAuth());
      navigate('/signin');
    } catch (err) {
      console.error('Sign-out error:', err);
    }
  };

  const handleCsvUpload = async e => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const text = await file.text();
    const rows = text.split('\n').map(row => row.split(',').map(cell => cell.trim()));
    const headers = rows[0];
    const data = rows.slice(1).filter(row => row.length === headers.length);
    try {
      const studentsToAdd = data.map(row => ({
        name: row[0],
        studentId: row[1],
        email: row[2] || '',
        grade: row[3] || '',
        birthday: row[4] || '',
        campus: row[5] || '',
        createdAt: serverTimestamp(),
      }));
      const batch = studentsToAdd.map(student =>
        addDoc(collection(db, 'schools', user.school, 'students'), student)
      );
      await Promise.all(batch);
      await fetchSchoolData();
      await fetchStudents();
    } catch (err) {
      console.error('CSV upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadCsv = async () => {
    const headers = ['Name', 'Student ID', 'Email', 'Grade', 'Birthday', 'Campus', 'Average Mood'];
    const rows = filteredStudents.map(s => [
      s.name || '',
      s.studentId || '',
      s.email || '',
      s.grade || '',
      s.birthday || '',
      s.campus || '',
      s.averageMood ? s.averageMood.toFixed(2) : '',
    ]);
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'students.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleAddStudent = async () => {
    if (!newStudentName || !newStudentId || !newStudentEmail || !newStudentCampus) {
      alert('Please fill in all required fields.');
      return;
    }
    try {
      await addDoc(collection(db, 'schools', user.school, 'students'), {
        name: newStudentName,
        studentId: newStudentId,
        email: newStudentEmail,
        grade: newStudentGrade,
        birthday: newStudentBirthday,
        campus: newStudentCampus,
        createdAt: serverTimestamp(),
      });
      setShowStudentModal(false);
      setNewStudentName('');
      setNewStudentId('');
      setNewStudentEmail('');
      setNewStudentGrade('');
      setNewStudentBirthday('');
      setNewStudentCampus('');
      await fetchStudents();
    } catch (err) {
      console.error('Error adding student:', err);
      alert('Failed to add student. Please try again.');
    }
  };

  const handleAddCounselor = async () => {
    if (!newCounselorName || !newCounselorEmail || !newCounselorCampus) {
      alert('Please fill in all required fields.');
      return;
    }
    try {
      await addDoc(collection(db, 'schools', user.school, 'counselors'), {
        name: newCounselorName,
        email: newCounselorEmail,
        campus: newCounselorCampus,
        createdAt: serverTimestamp(),
      });
      setShowCounselorModal(false);
      setNewCounselorName('');
      setNewCounselorEmail('');
      setNewCounselorCampus('');
    } catch (err) {
      console.error('Error adding counselor:', err);
      alert('Failed to add counselor. Please try again.');
    }
  };

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
        handleCsvUpload={handleCsvUpload}
        handleDownloadCsv={handleDownloadCsv}
        setShowCounselorModal={setShowCounselorModal}
        setShowStudentModal={setShowStudentModal}
        handleSignOut={handleSignOut}
      />
      <main style={mainStyle}>
        {loading ? (
          <div style={loadingStyle}>Loading...</div>
        ) : (
          <>
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
            <Outlet />
            <StudentTable
              filteredStudents={filteredStudents}
              deleteStudent={deleteStudent}
            />
          </>
        )}
      </main>
    </div>
  );
}
