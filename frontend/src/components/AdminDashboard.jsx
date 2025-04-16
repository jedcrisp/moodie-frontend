import React, { useEffect, useState, useContext } from 'react';
import {
  getFirestore,
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  doc,
  setDoc,
} from 'firebase/firestore';
import { getAuth, signOut } from 'firebase/auth';
import { LogOut, Upload, Smile } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Papa from 'papaparse';
import { SchoolContext } from '../context/SchoolContext';

export default function AdminDashboard({ user }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const db = getFirestore();
  const navigate = useNavigate();
  const { displayName } = useContext(SchoolContext);

  // Fetch students and their last 5 moods, then sort by average mood
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
              ? moodEntries.reduce((acc, m) => acc + (m.score || 3), 0) / moodEntries.length
              : null;

          return { id: docSnap.id, ...student, moods: moodEntries, averageMood };
        })
      );

      setStudents(
        studentData.sort(
          (a, b) =>
            (a.averageMood === null ? 99 : a.averageMood) -
            (b.averageMood === null ? 99 : b.averageMood)
        )
      );
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.school) fetchStudentsWithMoods();
  }, [user]);

  const handleSignOut = async () => {
    await signOut(getAuth());
    window.location.reload();
  };

  const handleCsvUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      complete: async (results) => {
        const rows = results?.data;
        if (!Array.isArray(rows)) {
          console.error('Invalid CSV format');
          return;
        }
        for (const row of rows) {
          if (!row.studentId || !row.name) continue;
          const studentRef = doc(db, 'schools', user.school, 'students', row.studentId);
          await setDoc(studentRef, {
            name: row.name,
            studentId: row.studentId,
            grade: row.grade,
            birthday: row.birthday,
          });
        }
        fetchStudentsWithMoods();
      },
      error: (err) => console.error('CSV parse error:', err),
    });
  };

  const handleMoodSelectorRedirect = () => navigate('/');

  return (
    <div
      style={{
        width: '100dvw',
        height: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        margin: 0,
        padding: 0,
        backgroundImage: `
          linear-gradient(to bottom right, rgba(255,182,193,0.3), rgba(173,216,230,0.3)),
          radial-gradient(circle at 20% 30%, rgba(255,182,193,0.5), transparent 50%),
          radial-gradient(circle at 80% 70%, rgba(173,216,230,0.5), transparent 50%),
          radial-gradient(circle at 50% 50%, rgba(255,228,181,0.4), transparent 50%)
        `,
        backgroundBlendMode: 'overlay',
      }}
    >
      {/* Top Right Buttons */}
      <div style={{ position: 'fixed', top: '8px', right: '8px', display: 'flex', gap: '12px', zIndex: 10 }}>
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            backgroundColor: 'white',
            border: '1px solid #A78BFA',
            borderRadius: '9999px',
            color: '#7C3AED',
            fontWeight: '500',
            cursor: 'pointer',
          }}
        >
          <Upload style={{ width: '20px', height: '20px' }} />
          <span>Upload CSV</span>
          <input type="file" accept=".csv" style={{ display: 'none' }} onChange={handleCsvUpload} />
        </label>
        <button onClick={handleMoodSelectorRedirect} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: '#8B5CF6', color: 'white', border: 'none', borderRadius: '9999px', cursor: 'pointer' }}>
          <Smile style={{ width: '20px', height: '20px' }} />
          <span>Mood Selector</span>
        </button>
        <button onClick={handleSignOut} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: '#EC4899', color: 'white', border: 'none', borderRadius: '9999px', cursor: 'pointer' }}>
          <LogOut style={{ width: '20px', height: '20px' }} />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Header */}
      <header style={{ backgroundColor: 'transparent' }}>
        <div style={{ padding: '8px' }}>
          <h1 style={{ fontSize: '1.875rem', fontWeight: '800', backgroundImage: 'linear-gradient(to right, #7C3AED, #EC4899)', WebkitBackgroundClip: 'text', color: 'transparent' }}>
            Moodie Dashboard: {displayName}
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ flex: 1, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ height: '100%', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ fontSize: '1.25rem', color: '#7C3AED', animation: 'pulse 1.5s infinite' }}>
              Loading student moods... 🌈
            </p>
          </div>
        ) : students.length === 0 ? (
          <div style={{ height: '100%', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ fontSize: '1.25rem', color: '#4B5563' }}>
              No students found. Let’s add some smiles! 😊
            </p>
          </div>
        ) : (
          <div style={{ backgroundColor: 'white', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1),0 4px 6px -2px rgba(0,0,0,0.05)', height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>
                  Student Mood Overview
                </h2>
                <p style={{ marginTop: '4px', fontSize: '0.875rem' }}>
                  Sorted to highlight students needing support first 🌟
                </p>
              </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ position: 'sticky', top: 0, backgroundImage: 'linear-gradient(to right, #EDE9FE, #FCE7F3)' }}>
                  <tr>
                    <th style={{ padding: '8px', textAlign: 'left' }}>Name</th>
                    <th style={{ padding: '8px', textAlign: 'left' }}>Student ID</th>
                    <th style={{ padding: '8px', textAlign: 'left' }}>Grade</th>
                    <th style={{ padding: '8px', textAlign: 'left' }}>Birthday</th>
                    <th style={{ padding: '8px', textAlign: 'left' }}>Last 5 Moods</th>
                    <th style={{ padding: '8px', textAlign: 'left' }}>Average Mood</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student.id} style={{ borderLeft: student.averageMood !== null && student.averageMood <= 2 ? '4px solid #DC2626' : student.averageMood !== null && student.averageMood <= 3 ? '4px solid #D97706' : '4px solid #16A34A' }}>
                      <td style={{ padding: '8px' }}>{student.name}</td>
                      <td style={{ padding: '8px' }}>{student.studentId || 'N/A'}</td>
                      <td style={{ padding: '8px' }}>{student.grade || 'N/A'}</td>
                      <td style={{ padding: '8px' }}>{student.birthday || 'N/A'}</td>
                      <td style={{ padding: '8px', display: 'flex', gap: '4px' }}>
                        {student.moods.length > 0 ? student.moods.map((m, i) => (
                          <span key={i} title={m.date} style={{ fontSize: '1.25rem' }}>{m.emoji}</span>
                        )) : <span>No moods yet 😴</span>}
                      </td>
                      <td style={{ padding: '8px' }}>
                        <span>{student.averageMood !== null ? student.averageMood.toFixed(2) : 'N/A'}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
