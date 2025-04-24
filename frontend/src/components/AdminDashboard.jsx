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
  deleteDoc,
  getDoc
} from 'firebase/firestore';
import { getAuth, signOut } from 'firebase/auth';
import {
  Upload,
  LogOut,
  Smile,
  ArrowLeft,
  Edit2,
  Check,
  X,
  Trash2,
  Search
} from 'lucide-react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import Papa from 'papaparse';

export default function AdminDashboard({ user }) {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [tempRow, setTempRow] = useState({});
  const [schoolDisplayName, setSchoolDisplayName] = useState('');
  const db = getFirestore();
  const navigate = useNavigate();
  const location = useLocation();

  // flags for nested routes
  const onMoodSelector   = location.pathname.endsWith('/mood-selector');
  const onStudentProfile = location.pathname.includes('/admin/students/');

  // Fetch school displayName once
  useEffect(() => {
    async function loadDisplayName() {
      if (!user?.school) return;
      const ref = doc(db, 'schools', user.school);
      const snap = await getDoc(ref);
      setSchoolDisplayName(
        snap.exists() ? snap.data().displayName || user.school : user.school
      );
    }
    loadDisplayName();
  }, [db, user]);

  // Load students + last 5 moods
  useEffect(() => {
    async function loadStudents() {
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
                ? moods.reduce((sum, m) => sum + (m.score || 3), 0) / moods.length
                : null;
            return { id: ds.id, ...s, moods, averageMood: avg };
          })
        );
        arr.sort((a, b) => (a.averageMood ?? 99) - (b.averageMood ?? 99));
        setStudents(arr);
        setFilteredStudents(arr);
      } catch (err) {
        console.error('Error fetching students:', err);
      } finally {
        setLoading(false);
      }
    }
    if (user?.school) loadStudents();
  }, [db, user]);

  // Filter students on search
  useEffect(() => {
    const q = searchQuery.toLowerCase();
    setFilteredStudents(
      students.filter(s =>
        (s.name || '').toLowerCase().includes(q) ||
        (s.studentId || '').toLowerCase().includes(q) ||
        (s.notes || '').toLowerCase().includes(q)
      )
    );
  }, [searchQuery, students]);

  const handleSignOut = async () => {
    await signOut(getAuth());
    navigate('/signin', { replace: true });
  };

  const handleCsvUpload = e => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async ({ data }) => {
        if (!data.length) {
          alert('CSV is empty or invalid.');
          setUploading(false);
          return;
        }
        for (const row of data) {
          if (!row.studentId || !row.name) continue;
          await setDoc(
            doc(db, 'schools', user.school, 'students', row.studentId),
            {
              name: row.name.trim(),
              studentId: row.studentId.trim(),
              grade: row.grade?.trim() || '',
              birthday: row.birthday?.trim() || '',
              notes: row.notes?.trim() || ''
            }
          );
        }
        // reload
        await loadStudents();
        setUploading(false);
        alert('CSV uploaded successfully!');
      },
      error: err => {
        console.error('Error parsing CSV:', err);
        alert('Failed to parse CSV.');
        setUploading(false);
      }
    });
  };

  const handleDownloadCsv = () => {
    const safeName = (user.school || 'School')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .replace(/_+/g, '_');
    const rows = students.map(s => ({
      Name: s.name,
      'Student ID': s.studentId,
      Grade: s.grade,
      Birthday: s.birthday,
      'Last 5 Moods': s.moods.map(m => m.emoji).join(' '),
      'Average Mood': s.averageMood != null ? s.averageMood.toFixed(2) : '',
      Notes: s.notes || ''
    }));
    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Moodie_${safeName}_Students.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleMoodSelectorRedirect = () => navigate('mood-selector');

  const startEditing = s => {
    setEditingId(s.id);
    setTempRow({
      name: s.name,
      studentId: s.studentId,
      grade: s.grade,
      birthday: s.birthday,
      notes: s.notes || ''
    });
  };

  const saveRow = async id => {
    await updateDoc(
      doc(db, 'schools', user.school, 'students', id),
      tempRow
    );
    setStudents(prev =>
      prev.map(s => (s.id === id ? { ...s, ...tempRow } : s))
    );
    setEditingId(null);
  };

  const deleteStudent = async id => {
    if (!window.confirm('Are you sure?')) return;
    const moodsSnap = await getDocs(
      collection(db, 'schools', user.school, 'students', id, 'moods')
    );
    await Promise.all(moodsSnap.docs.map(d => deleteDoc(d.ref)));
    await deleteDoc(doc(db, 'schools', user.school, 'students', id));
    setStudents(prev => prev.filter(s => s.id !== id));
  };

  const cancelEdit = () => setEditingId(null);

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <div style={headerInnerStyle}>
          <h1 style={titleStyle}>
            Moodie Dashboard: {schoolDisplayName}
          </h1>
          <div style={controlsStyle}>
            <label style={uploadButtonStyle}>
              <Upload style={iconStyle} />
              <span>{uploading ? 'Uploading…' : 'Upload CSV'}</span>
              <input
                type="file"
                accept=".csv"
                style={{ display: 'none' }}
                onChange={handleCsvUpload}
                disabled={uploading}
              />
            </label>
            {onMoodSelector ? (
              <button
                style={backButtonStyle}
                onClick={() => navigate('/admin')}
              >
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
            <button
              style={downloadButtonStyle}
              onClick={handleDownloadCsv}
            >
              <span>Download CSV</span>
            </button>
            <button
              style={signOutStyle}
              onClick={handleSignOut}
            >
              <LogOut style={iconStyle} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
        <div style={searchContainerStyle}>
          <Search style={{ width: 18, height: 18 }} />
          <input
            type="text"
            placeholder="Search by name, ID, or notes…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={searchInputStyle}
          />
        </div>
      </header>

      {/* Render nested routes for mood-selector or student-profile */}
      {(onMoodSelector || onStudentProfile) ? (
        <Outlet />
      ) : (
        <main style={mainStyle}>
          {loading ? (
            <p style={loadingStyle}>Loading student moods…</p>
          ) : (
              <div style={tableContainerStyle}>
              <table style={tableStyle}>
                <thead style={theadStyle}>
                  <tr>
                    {[
                      'Name',
                      'Student ID',
                      'Grade',
                      'Birthday',
                      'Last 5 Moods',
                      'Average Mood'
                    ].map(h => (
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map(s => (
                    <tr
                      key={s.id}
                      style={{
                        borderLeft:
                          s.averageMood <= 2
                            ? '4px solid #EF4444'
                            : s.averageMood <= 3
                            ? '4px solid #FACC15'
                            : '4px solid #22C55E'
                      }}
                    >
                      <td style={tdStyle}>
                        <Link to={`/admin/students/${s.id}`} style={linkButtonStyle}>
                          {s.name}
                        </Link>
                      </td>
                      <td style={tdStyle}>{s.studentId}</td>
                      <td style={tdStyle}>{s.grade}</td>
                      <td style={tdStyle}>{s.birthday}</td>
                      <td style={{ ...tdStyle, fontSize: '1.5rem' }}>
                        {s.moods.length
                          ? s.moods.map((m, i) => <span key={i}>{m.emoji}</span>)
                          : '—'}
                      </td>
                      <td style={tdStyle}>
                        {s.averageMood != null ? s.averageMood.toFixed(2) : '—'}
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

// — Styles —  
const linkButtonStyle = {
  background: 'none',
  border: 'none',
  padding: 0,
  margin: 0,
  color: '#3B82F6',
  cursor: 'pointer',
  fontSize: 'inherit'
};
const notesBoxStyle = {
  padding:      '0.5rem',
  border:       '1px solid #D1D5DB',
  borderRadius: '0.375rem',
  background:   'white',
  minHeight:    '2rem',
};
const containerStyle = {
  width: '100vw',
  height: '100vh',
  display: 'flex',
  flexDirection: 'column',
  background:
    'linear-gradient(to bottom right, rgba(255,182,193,0.3), rgba(173,216,230,0.3))'
};
const headerStyle = {
  padding: '0.5rem 1rem',
  background: 'linear-gradient(to right, #ede9fe, #fce7f3)',
  boxShadow: '0 1px 4px rgba(0,0,0,0.1)'
};
const headerInnerStyle = { display: 'flex', alignItems: 'center', justifyContent: 'space-between' };
const titleStyle = {
  fontSize: '1.75rem',
  fontWeight: 700,
  background: 'linear-gradient(to right, #7C3AED, #EC4899)',
  WebkitBackgroundClip: 'text',
  color: 'transparent'
};
const controlsStyle = { display: 'flex', gap: '0.75rem' };
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
  cursor: 'pointer'
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
  cursor: 'pointer'
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
  cursor: 'pointer'
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
  cursor: 'pointer'
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
  cursor: 'pointer'
};
const searchContainerStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  padding: '0.5rem 1rem',
  marginTop: '-0.5rem',
  justifyContent: 'flex-start'
};
const searchInputStyle = {
  padding: '0.5rem 1rem',
  fontSize: '1rem',
  border: '1px solid #D1D5DB',
  borderRadius: '9999px',
  width: '100%',
  maxWidth: '300px'
};
const mainStyle = { flex: 1, overflow: 'auto', padding: '1rem' };
const loadingStyle = { fontSize: '1.25rem', color: '#7C3AED', textAlign: 'center', marginTop: 40 };
const tableContainerStyle = { width: '100%', overflowX: 'auto' };
const tableStyle = { width: '100%', borderCollapse: 'collapse' };
const theadStyle = { background: 'linear-gradient(to right, #EDE9FE, #FCE7F3)', position: 'sticky', top: 0 };
const thStyle = {
  padding: '8px 12px',
  textAlign: 'left',
  fontSize: '0.75rem',
  fontWeight: 600,
  color: '#7C3AED',
  textTransform: 'uppercase',
  borderBottom: '1px solid #D1D5DB'
};
const tdStyle = {
  padding: '8px 12px',
  fontSize: '0.875rem',
  color: '#4B5563',
  borderBottom: '1px solid #E5E7EB'
};
const inputStyle = {
  width: '100%',
  padding: 4,
  fontSize: '0.875rem',
  border: '1px solid #D1D5DB',
  borderRadius: 4
};
