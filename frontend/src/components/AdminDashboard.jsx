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
import { Upload, LogOut, Smile, ArrowLeft } from 'lucide-react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import Papa from 'papaparse';

export default function AdminDashboard({ user }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [tempNote, setTempNote] = useState('');
  const db = getFirestore();
  const navigate = useNavigate();
  const location = useLocation();

  // Fetch students + last 5 moods
  const fetchStudentsWithMoods = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'schools', user.school, 'students'));
      const data = await Promise.all(
        snap.docs.map(async docSnap => {
          const s = docSnap.data();
          const moodsSnap = await getDocs(
            query(
              collection(db, 'schools', user.school, 'students', docSnap.id, 'moods'),
              orderBy('date', 'desc'),
              limit(5)
            )
          );
          const moodEntries = moodsSnap.docs.map(d => d.data());
          const avg =
            moodEntries.length > 0
              ? moodEntries.reduce((sum, m) => sum + (m.score || 3), 0) / moodEntries.length
              : null;
          return {
            id: docSnap.id,
            ...s,
            moods: moodEntries,
            averageMood: avg,
          };
        })
      );
      // sort low→high
      data.sort((a, b) => (a.averageMood ?? 99) - (b.averageMood ?? 99));
      setStudents(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.school) fetchStudentsWithMoods();
  }, [user]);

  // Sign out
  const handleSignOut = async () => {
    await signOut(getAuth());
    window.location.reload();
  };

  // CSV upload
  const handleCsvUpload = e => {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      complete: async ({ data }) => {
        for (const row of data) {
          if (!row.studentId || !row.name) continue;
          await setDoc(
            doc(db, 'schools', user.school, 'students', row.studentId),
            {
              name: row.name,
              studentId: row.studentId,
              grade: row.grade,
              birthday: row.birthday,
              notes: row.notes || '',
            }
          );
        }
        fetchStudentsWithMoods();
      },
    });
  };

  // Download CSV of current students table
  const handleDownloadCsv = () => {
    const rows = students.map(stu => ({
      Name: stu.name,
      'Student ID': stu.studentId,
      Grade: stu.grade,
      Birthday: stu.birthday,
      'Last 5 Moods': stu.moods.map(m => m.emoji).join(' '),
      'Average Mood': stu.averageMood != null ? stu.averageMood.toFixed(2) : '',
      Notes: stu.notes || '',
    }));
    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Moodie_${user.school}_Students.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Go to mood selector (nested route)
  const handleMoodSelectorRedirect = () => navigate('mood-selector');

  // Save a note inline
  const saveNote = async id => {
    const ref = doc(db, 'schools', user.school, 'students', id);
    await updateDoc(ref, { notes: tempNote });
    setEditingId(null);
    fetchStudentsWithMoods();
  };

  return (
    <div style={containerStyle}>
      {/* Top‑Right Controls */}
      <div style={controlsStyle}>
        <label style={uploadButtonStyle}>
          <Upload style={iconStyle} />
          <span>Upload CSV</span>
          <input type="file" accept=".csv" style={{ display: 'none' }} onChange={handleCsvUpload} />
        </label>

        {location.pathname.endsWith('/mood-selector') ? (
          <button style={backButtonStyle} onClick={() => navigate('/admin')}>
            <ArrowLeft style={iconStyle} />
            <span>Back</span>
          </button>
        ) : (
          <button style={moodSelectorStyle} onClick={handleMoodSelectorRedirect}>
            <Smile style={iconStyle} />
            <span>Mood Selector</span>
          </button>
        )}

        <button style={downloadButtonStyle} onClick={handleDownloadCsv}>
          Download CSV
        </button>

        <button style={signOutStyle} onClick={handleSignOut}>
          <LogOut style={iconStyle} />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Header */}
      <header style={headerStyle}>
        <h1 style={titleStyle}>Moodie Dashboard: {user.school}</h1>
      </header>

      {/* Main Table */}
      <main style={mainStyle}>
        {loading ? (
          <p style={loadingStyle}>Loading student moods…</p>
        ) : students.length === 0 ? (
          <p style={loadingStyle}>No students found. 😊</p>
        ) : (
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
                {students.map(stu => (
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
                    <td style={{ ...tdStyle, fontSize: '1.5rem' }}>
                      {stu.moods.length > 0 ? stu.moods.map((m, i) => <span key={i}>{m.emoji}</span>) : '—'}
                    </td>
                    <td style={tdStyle}>
                      {stu.averageMood != null ? stu.averageMood.toFixed(2) : '—'}
                    </td>
                    <td style={tdStyle}>
                      {editingId === stu.id ? (
                        <input
                          style={inputStyle}
                          value={tempNote}
                          onChange={e => setTempNote(e.target.value)}
                          onBlur={() => saveNote(stu.id)}
                          onKeyDown={e => e.key === 'Enter' && saveNote(stu.id)}
                          autoFocus
                        />
                      ) : (
                        <span onClick={() => { setEditingId(stu.id); setTempNote(stu.notes || ''); }}>
                          {stu.notes || '—'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* render nested mood‑selector route */}
      <Outlet />
    </div>
  );
}

// Styles
const containerStyle = {
  width: '100vw',
  height: '100vh',
  display: 'flex',
  flexDirection: 'column',
  background:
    'linear-gradient(to bottom right, rgba(255,182,193,.3), rgba(173,216,230,.3))',
};
const controlsStyle = {
  position: 'fixed',
  top: 8,
  right: 8,
  display: 'flex',
  gap: 12,
  zIndex: 10,
};
const iconStyle = { width: 20, height: 20 };
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
const downloadButtonStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '8px 16px',
  backgroundColor: '#3B82F6',
  border: 'none',
  borderRadius: 9999,
  color: 'white',
  cursor: 'pointer',
};
const moodSelectorStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '8px 16px',
  backgroundColor: '#8B5CF6',
  border: 'none',
  borderRadius: 9999,
  color: 'white',
  cursor: 'pointer',
};
const backButtonStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '8px 16px',
  backgroundColor: '#6B7280',
  border: 'none',
  borderRadius: 9999,
  color: 'white',
  cursor: 'pointer',
};
const signOutStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '8px 16px',
  backgroundColor: '#EC4899',
  border: 'none',
  borderRadius: 9999,
  color: 'white',
  cursor: 'pointer',
};
const headerStyle = { padding: 16 };
const titleStyle = {
  fontSize: '2rem',
  fontWeight: 800,
  background: 'linear-gradient(to right,#7C3AED,#EC4899)',
  WebkitBackgroundClip: 'text',
  color: 'transparent',
};
const mainStyle = { flex: 1, overflow: 'auto', padding: 16 };
const loadingStyle = { fontSize: '1.25rem', color: '#7C3AED', textAlign: 'center', marginTop: 40 };
const tableContainerStyle = { width: '100%', overflowX: 'auto' };
const tableStyle = { width: '100%', borderCollapse: 'collapse' };
const theadStyle = {
  background: 'linear-gradient(to right,#EDE9FE,#FCE7F3)',
  position: 'sticky',
  top: 0,
};
const thStyle = {
  padding: '8px 12px',
  textAlign: 'left',
  fontSize: '0.75rem',
  fontWeight: 600,
  color: '#7C3AED',
  textTransform: 'uppercase',
  borderBottom: '1px solid #D1D5DB',
};
const tdStyle = {
  padding: '8px 12px',
  fontSize: '0.875rem',
  color: '#4B5563',
  borderBottom: '1px solid #E5E7EB',
};
const inputStyle = {
  width: '100%',
  padding: 4,
  fontSize: '0.875rem',
  border: '1px solid #D1D5DB',
  borderRadius: 4,
};
