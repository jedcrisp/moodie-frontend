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
  updateDoc,
} from 'firebase/firestore';
import { getAuth, signOut } from 'firebase/auth';
import { Upload, LogOut, Smile, ArrowLeft } from 'lucide-react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import Papa from 'papaparse';

export default function AdminDashboard({ user }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [tempNote, setTempNote] = useState('');
  const db = getFirestore();
  const navigate = useNavigate();
  const location = useLocation();
  const onMoodSelector = location.pathname.endsWith('/mood-selector');

  // load students + last 5 moods
  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true);
      try {
        const snap = await getDocs(
          collection(db, 'schools', user.school, 'students')
        );
        const arr = await Promise.all(
          snap.docs.map(async ds => {
            const s = ds.data();
            const moodsSnap = await getDocs(
              query(
                collection(
                  db,
                  'schools',
                  user.school,
                  'students',
                  ds.id,
                  'moods'
                ),
                orderBy('date', 'desc'),
                limit(5)
              )
            );
            const moods = moodsSnap.docs.map(d => d.data());
            const avg =
              moods.length > 0
                ? moods.reduce((sum, m) => sum + (m.score || 3), 0) /
                  moods.length
                : null;
            return { id: ds.id, ...s, moods, averageMood: avg };
          })
        );
        arr.sort((a, b) => (a.averageMood ?? 99) - (b.averageMood ?? 99));
        setStudents(arr);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (user?.school) fetchStudents();
  }, [db, user]);

  // handlers
  const handleSignOut = async () => {
    await signOut(getAuth());
    window.location.reload();
  };
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
        // reload
        setTimeout(() => navigate('/admin', { replace: true }), 100);
      },
    });
  };
  const handleDownloadCsv = () => {
    const rows = students.map(s => ({
      Name: s.name,
      'Student ID': s.studentId,
      Grade: s.grade,
      Birthday: s.birthday,
      'Last 5 Moods': s.moods.map(m => m.emoji).join(' '),
      'Average Mood': s.averageMood != null ? s.averageMood.toFixed(2) : '',
      Notes: s.notes || '',
    }));
    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Moodie_${user.school}_Students.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
  const handleMoodSelectorRedirect = () => navigate('mood-selector');

  const saveNote = async id => {
    await updateDoc(
      doc(db, 'schools', user.school, 'students', id),
      { notes: tempNote }
    );
    setEditingId(null);
    // refresh
    setTimeout(() => navigate('/admin', { replace: true }), 100);
  };

  return (
    <div style={containerStyle}>
      {/* — Header + Controls — */}
      <header style={headerStyle}>
        <div style={headerInnerStyle}>
          <h1 style={titleStyle}>Moodie Dashboard: {user.school}</h1>
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

            {onMoodSelector ? (
              <button style={backButtonStyle} onClick={() => navigate('/admin')}>
                <ArrowLeft style={iconStyle} />
                <span>Back</span>
              </button>
            ) : (
              <button
                style={moodSelectorStyle}
                onClick={handleMoodSelectorRedirect}
              >
                <Smile style={iconStyle} />
                <span>Mood Selector</span>
              </button>
            )}

            <button style={downloadButtonStyle} onClick={handleDownloadCsv}>
              <span>Download CSV</span>
            </button>

            <button style={signOutStyle} onClick={handleSignOut}>
              <LogOut style={iconStyle} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* — Content or Nested Outlet — */}
      {onMoodSelector ? (
        <Outlet />
      ) : (
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
                    {['Name','Student ID','Grade','Birthday','Last 5 Moods','Average Mood','Notes'].map(h => (
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {students.map(s => (
                    <tr
                      key={s.id}
                      style={{
                        borderLeft:
                          s.averageMood <= 2
                            ? '4px solid #EF4444'
                            : s.averageMood <= 3
                            ? '4px solid #FACC15'
                            : '4px solid #22C55E',
                      }}
                    >
                      <td style={tdStyle}>{s.name}</td>
                      <td style={tdStyle}>{s.studentId}</td>
                      <td style={tdStyle}>{s.grade}</td>
                      <td style={tdStyle}>{s.birthday}</td>
                      <td style={{ ...tdStyle, fontSize: '1.5rem' }}>
                        {s.moods.length > 0 ? s.moods.map((m,i) => <span key={i}>{m.emoji}</span>) : '—'}
                      </td>
                      <td style={tdStyle}>
                        {s.averageMood != null ? s.averageMood.toFixed(2) : '—'}
                      </td>
                      <td style={tdStyle}>
                        {editingId === s.id ? (
                          <input
                            style={inputStyle}
                            value={tempNote}
                            onChange={e => setTempNote(e.target.value)}
                            onBlur={() => saveNote(s.id)}
                            onKeyDown={e => e.key==='Enter' && saveNote(s.id)}
                            autoFocus
                          />
                        ) : (
                          <span
                            onClick={() => {
                              setEditingId(s.id);
                              setTempNote(s.notes || '');
                            }}
                          >
                            {s.notes || '—'}
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
      )}
    </div>
  );
}

// —————— Styles ——————

const containerStyle = {
  width: '100vw',
  height: '100vh',
  display: 'flex',
  flexDirection: 'column',
  background:
    'linear-gradient(to bottom right, rgba(255,182,193,.3), rgba(173,216,230,.3))',
};
const headerStyle = { padding: '0.5rem 1rem', background: 'white', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' };
const headerInnerStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
};
const titleStyle = {
  fontSize: '1.75rem',
  fontWeight: 700,
  background: 'linear-gradient(to right,#7C3AED,#EC4899)',
  WebkitBackgroundClip: 'text',
  color: 'transparent',
};
const controlsStyle = {
  display: 'flex',
  gap: '0.75rem',
};
const iconStyle = { width: 20, height: 20 };

const uploadButtonStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '6px 12px',
  backgroundColor: 'white',
  border: '1px solid #A78BFA',
  borderRadius: 9999,
  color: '#7C3AED',
  cursor: 'pointer',
};
const downloadButtonStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '6px 12px',
  backgroundColor: '#3B82F6',
  border: 'none',
  borderRadius: 9999,
  color: 'white',
  cursor: 'pointer',
};
const moodSelectorStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '6px 12px',
  backgroundColor: '#8B5CF6',
  border: 'none',
  borderRadius: 9999,
  color: 'white',
  cursor: 'pointer',
};
const backButtonStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '6px 12px',
  backgroundColor: '#6B7280',
  border: 'none',
  borderRadius: 9999,
  color: 'white',
  cursor: 'pointer',
};
const signOutStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '6px 12px',
  backgroundColor: '#EC4899',
  border: 'none',
  borderRadius: 9999,
  color: 'white',
  cursor: 'pointer',
};

const mainStyle = { flex: 1, overflow: 'auto', padding: '1rem' };
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
