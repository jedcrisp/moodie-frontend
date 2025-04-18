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
import { useNavigate } from 'react-router-dom';
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

  // Navigate to mood selector
  const handleMoodSelectorRedirect = () => navigate('/admin/mood-selector');

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
          <div style={contentStyle}>
            <div style={introStyle}>
              <h2 style={subtitleStyle}>Student Mood Overview</h2>
              <p style={introTextStyle}>
                Sorted to highlight students needing support first 🌟
              </p>
            </div>
            <div style={tableContainerStyle}>
              <table style={tableStyle}>
                <thead style={theadStyle}>
                  <tr>
                    <th style={thStyle}>Name</th>
                    <th style={thStyle}>Student ID</th>
                    <th style={thStyle}>Grade</th>
                    <th style={thStyle}>Birthday</th>
                    <th style={thStyle}>Last 5 Moods</th>
                    <th style={thStyle}>Average Mood</th>
                    <th style={thStyle}>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((stu) => (
                    <tr
                      key={stu.id}
                      style={{
                        borderLeft:
                          stu.averageMood <= 2
                            ? '4px solid #EF4444'
                            : stu.averageMood <= 3
                            ? '4px solid #FACC15'
                            : '4px solid #22C55E',
                      }}
                    >
                      <td style={tdStyle}>{stu.name}</td>
                      <td style={tdStyle}>{stu.studentId}</td>
                      <td style={tdStyle}>{stu.grade}</td>
                      <td style={tdStyle}>{stu.birthday}</td>
                      <td
                        style={{ ...tdStyle, display: 'flex', gap: 8, fontSize: '1.5rem' }}
                      >
                        {stu.moods.length > 0
                          ? stu.moods.map((m, i) => <span key={i}>{m.emoji}</span>)
                          : <span>No moods yet 😴</span>}
                      </td>
                      <td style={tdStyle}>
                        <span
                          style={{
                            color:
                              stu.averageMood <= 2
                                ? '#DC2626'
                                : stu.averageMood <= 3
                                ? '#D97706'
                                : '#16A34A',
                          }}
                        >
                          {stu.averageMood != null
                            ? stu.averageMood.toFixed(2)
                            : 'N/A'}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        {editingId === stu.id ? (
                          <input
                            type="text"
                            value={tempNote}
                            onChange={(e) => setTempNote(e.target.value)}
                            onBlur={() => saveNote(stu.id)}
                            onKeyDown={(e) => e.key === 'Enter' && saveNote(stu.id)}
                            autoFocus
                            style={inputStyle}
                          />
                        ) : (
                          <span
                            onClick={() => {
                              setEditingId(stu.id);
                              setTempNote(stu.notes || '');
                            }}
                          >
                            {stu.notes || '—'}
                          </span>
                        )}
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

// Style Objects
const containerStyle = {
  width: '100dvw',
  height: '100dvh',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  margin: 0,
  padding: 0,
  backgroundImage: `
    linear-gradient(to bottom right, rgba(255, 182, 193, 0.3), rgba(173, 216, 230, 0.3)),
    radial-gradient(circle at 20% 30%, rgba(255, 182, 193, 0.5), transparent 50%),
    radial-gradient(circle at 80% 70%, rgba(173, 216, 230, 0.5), transparent 50%),
    radial-gradient(circle at 50% 50%, rgba(255, 228, 181, 0.4), transparent 50%)
  `,
  backgroundBlendMode: 'overlay',
};
const controlsStyle = { position: 'fixed', top: 8, right: 8, display: 'flex', gap: 12, zIndex: 10 };
const uploadButtonStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '8px 16px',
  backgroundColor: 'white',
  border: '1px solid #A78BFA',
  borderRadius: 9999,
  color: '#7C3AED',
  cursor: 'pointer',
};
const moodSelectorStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '8px 16px',
  backgroundColor: '#8B5CF6',
  color: 'white',
  border: 'none',
  borderRadius: 9999,
  cursor: 'pointer',
};
const signOutStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '8px 16px',
  backgroundColor: '#EC4899',
  color: 'white',
  border: 'none',
  borderRadius: 9999,
  cursor: 'pointer',
};
const iconStyle = { width: 20, height: 20 };
const headerStyle = { padding: 8 };
const titleStyle = {
  fontSize: '1.875rem',
  fontWeight: 800,
  background: 'linear-gradient(to right, #7C3AED, #EC4899)',
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  color: 'transparent',
};
const mainStyle = { flex: 1, overflow: 'auto' };
const loadingStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  color: '#7C3AED',
  fontSize: '1.25rem',
};
const contentStyle = { maxHeight: '100%', display: 'flex', flexDirection: 'column' };
const introStyle = { padding: 8 };
const subtitleStyle = { fontSize: '1.5rem', fontWeight: 700, color: '#1F2937' };
const introTextStyle = { marginTop: 4, fontSize: '0.875rem', color: '#4B5563' };
const tableContainerStyle = { overflow: 'auto' };
const tableStyle = { width: '100%', borderCollapse: 'collapse' };
const theadStyle = {
  background: 'linear-gradient(to right, #EDE9FE, #FCE7F3)',
  position: 'sticky',
  top: 0,
};
const thStyle = {
  padding: '8px 16px',
  textAlign: 'left',
  fontSize: '0.75rem',
  fontWeight: 600,
  color: '#7C3AED',
  textTransform: 'uppercase',
  borderBottom: '1px solid #D1D5DB',
};
const tdStyle = {
  padding: '8px 16px',
  fontSize: '0.875rem',
  color: '#4B5563',
  borderBottom: '1px solid #E5E7EB',
};
const inputStyle = { width: '100%', padding: '4px 8px', fontSize: '0.875rem', border: '1px solid #D1D5DB', borderRadius: 4 };
