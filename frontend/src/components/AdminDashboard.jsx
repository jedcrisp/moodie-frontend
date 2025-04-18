// src/components/AdminDashboard.jsx
import React, { useEffect, useState } from 'react';
import {
  getFirestore,
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  doc,
  setDoc,
  updateDoc
} from 'firebase/firestore';
import { getAuth, signOut } from 'firebase/auth';
import { LogOut, Upload, Smile } from 'lucide-react';
import { useNavigate, Outlet } from 'react-router-dom';   // ← import Outlet
import Papa from 'papaparse';

export default function AdminDashboard({ user }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [tempNote, setTempNote] = useState('');
  const db = getFirestore();
  const navigate = useNavigate();

  // Fetch students and their moods
  const fetchStudentsWithMoods = async () => {
    try {
      const studentRef = collection(db, 'schools', user.school, 'students');
      const studentSnap = await getDocs(studentRef);
      const studentData = await Promise.all(
        studentSnap.docs.map(async (docSnap) => {
          const student = docSnap.data();
          const moodsRef = collection(
            db,
            'schools',
            user.school,
            'students',
            docSnap.id,
            'moods'
          );
          const moodsQuery = query(moodsRef, orderBy('date', 'desc'), limit(5));
          const moodSnap = await getDocs(moodsQuery);
          const moodEntries = moodSnap.docs.map((d) => d.data());
          const averageMood =
            moodEntries.length > 0
              ? moodEntries.reduce((acc, m) => acc + (m.score || 3), 0) /
                moodEntries.length
              : null;
          return { id: docSnap.id, ...student, moods: moodEntries, averageMood };
        })
      );
      const sorted = studentData.sort((a, b) => (a.averageMood ?? 99) - (b.averageMood ?? 99));
      setStudents(sorted);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.school) fetchStudentsWithMoods();
  }, [user]);

  // Sign out handler
  const handleSignOut = async () => {
    await signOut(getAuth());
    window.location.reload();
  };

  // CSV upload handler
  const handleCsvUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      complete: async ({ data }) => {
        if (!Array.isArray(data)) return;
        for (const row of data) {
          if (!row.studentId || !row.name) continue;
          const studentRef = doc(
            db,
            'schools',
            user.school,
            'students',
            row.studentId
          );
          await setDoc(studentRef, {
            name: row.name,
            studentId: row.studentId,
            grade: row.grade,
            birthday: row.birthday,
            notes: row.notes || '',
          });
        }
        fetchStudentsWithMoods();
      },
      error: console.error,
    });
  };

  // Navigate to mood selector (relative)
  const handleMoodSelectorRedirect = () => {
    navigate('mood-selector');    // ← relative to /admin
  };

  // Save edited note
  const saveNote = async (id) => {
    const studentRef = doc(db, 'schools', user.school, 'students', id);
    try {
      await updateDoc(studentRef, { notes: tempNote });
      setEditingId(null);
      fetchStudentsWithMoods();
    } catch (err) {
      console.error('Error saving note:', err);
    }
  };

  return (
    <div style={containerStyle}>
      {/* Top-Right Controls */}
      <div style={controlsStyle}>
        <label style={uploadButtonStyle}>
          <Upload style={iconStyle} />
          <span>Upload CSV</span>
          <input
            type="file"
            accept=".csv"
            style={{ display: 'none' }}
            onChange={handleCsvUpload}
          />
        </label>
        <button
          style={moodSelectorStyle}
          onClick={handleMoodSelectorRedirect}
          title="Mood Selector"
        >
          <Smile style={iconStyle} />
          <span>Mood Selector</span>
        </button>
        <button style={signOutStyle} onClick={handleSignOut} title="Sign Out">
          <LogOut style={iconStyle} />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Header */}
      <header style={headerStyle}>
        <h1 style={titleStyle}>Moodie Dashboard: {user.school}</h1>
      </header>

      {/* Main Content */}
      <main style={mainStyle}>
        {loading ? (
          <div style={loadingStyle}>
            <p>Loading student moods… 🌈</p>
          </div>
        ) : students.length === 0 ? (
          <div style={loadingStyle}>
            <p>No students found. 😊</p>
          </div>
        ) : (
          /* … your table with Notes editing … */
          <div style={contentStyle}>
            {/* … */}
          </div>
        )}
      </main>

      {/*
        This <Outlet /> is where the nested /admin/mood-selector
        route will render its element.
      */}
      <Outlet />
    </div>
  );
}

// … rest of your style objects unchanged …
