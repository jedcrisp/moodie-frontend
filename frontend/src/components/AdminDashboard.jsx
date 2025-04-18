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
import { LogOut, Upload, Smile } from 'lucide-react';
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

  // fetch
  useEffect(() => {
    async function fetchStudents() {
      setLoading(true);
      const snapshot = await getDocs(collection(db, 'schools', user.school, 'students'));
      const data = await Promise.all(snapshot.docs.map(async d => {
        const student = d.data();
        const moodsSnap = await getDocs(
          query(
            collection(db, 'schools', user.school, 'students', d.id, 'moods'),
            orderBy('date', 'desc'),
            limit(5)
          )
        );
        const moods = moodsSnap.docs.map(x => x.data());
        const avg = moods.length
          ? moods.reduce((sum, m) => sum + (m.score||0), 0) / moods.length
          : null;
        return { id: d.id, ...student, moods, averageMood: avg };
      }));
      setStudents(data.sort((a,b)=> (a.averageMood||99)-(b.averageMood||99)));
      setLoading(false);
    }
    fetchStudents();
  }, [db, user.school]);

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
              name:     row.name,
              studentId:row.studentId,
              grade:    row.grade,
              birthday: row.birthday,
              notes:    row.notes||'',
            }
          );
        }
        // re-fetch
        const studentRef = collection(db, 'schools', user.school, 'students');
        const snap = await getDocs(studentRef);
        // ...same logic as above...
        navigate(0);
      },
    });
  };

  const handleMoodSelectorRedirect = () => {
    navigate('mood-selector');
  };

  const saveNote = async id => {
    await updateDoc(
      doc(db, 'schools', user.school, 'students', id),
      { notes: tempNote }
    );
    setEditingId(null);
    navigate(0);
  };

  const handleDownloadCsv = () => {
    const rows = students.map(s => ({
      Name:       s.name,
      'Student ID': s.studentId,
      Grade:      s.grade,
      Birthday:   s.birthday,
      Notes:      s.notes||'',
    }));
    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `${user.school}_students.csv`;
    a.click();
  };

  return (
    <div style={containerStyle}>
      {/* Top-Right Controls */}
      <div style={controlsStyle}>
        <label style={uploadButtonStyle}>
          <Upload style={iconStyle} />
          <span>Upload CSV</span>
          <input type="file" accept=".csv" onChange={handleCsvUpload} style={{ display: 'none' }} />
        </label>

        <button style={downloadButtonStyle} onClick={handleDownloadCsv}>
          Download CSV
        </button>

        <button style={moodSelectorStyle} onClick={handleMoodSelectorRedirect}>
          <Smile style={iconStyle} />
          <span>Mood Selector</span>
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

      {/* Main */}
      <main style={mainStyle}>
        {loading ? (
          <div style={loadingStyle}>Loading student moods… 🌈</div>
        ) : students.length === 0 ? (
          <div style={loadingStyle}>No students found. 😊</div>
        ) : (
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
              {students.map(s => (
                <tr key={s.id} style={rowStyle(s.averageMood)}>
                  <td style={tdStyle}>{s.name}</td>
                  <td style={tdStyle}>{s.studentId}</td>
                  <td style={tdStyle}>{s.grade}</td>
                  <td style={tdStyle}>{s.birthday}</td>
                  <td style={moodTdStyle}>
                    {s.moods.length
                      ? s.moods.map((m,i)=><span key={i}>{m.emoji}</span>)
                      : '—'}
                  </td>
                  <td style={tdStyle}>
                    {s.averageMood != null ? s.averageMood.toFixed(2) : 'N/A'}
                  </td>
                  <td style={tdStyle}>
                    {editingId===s.id ? (
                      <input
                        style={inputStyle}
                        value={tempNote}
                        onChange={e=>setTempNote(e.target.value)}
                        onBlur={()=>saveNote(s.id)}
                        onKeyDown={e=>e.key==='Enter' && saveNote(s.id)}
                        autoFocus
                      />
                    ) : (
                      <span onClick={()=>{ setEditingId(s.id); setTempNote(s.notes||''); }}>
                        {s.notes||'—'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </main>

      {/* Nested Routes Outlet */}
      <Outlet />
    </div>
  );
}

// — Styles —

const containerStyle = {
  width: '100vw', height: '100vh',
  display: 'flex', flexDirection: 'column',
  background: 'linear-gradient(to bottom right, rgba(255,182,193,0.3), rgba(173,216,230,0.3))',
};
const controlsStyle = {
  position: 'fixed', top: 8, right: 8,
  display: 'flex', gap: 12, zIndex: 10,
};
const uploadButtonStyle = {
  display: 'flex', alignItems: 'center', gap: 8,
  padding: '8px 16px', backgroundColor: 'white',
  border: '1px solid #A78BFA', borderRadius: 9999,
  color: '#7C3AED', cursor: 'pointer',
};
const downloadButtonStyle = {
  display: 'flex', alignItems: 'center', gap: 8,
  padding: '8px 16px', backgroundColor: '#3B82F6',
  color: 'white', border: 'none', borderRadius: 9999,
  cursor: 'pointer',
};
const moodSelectorStyle = {
  display: 'flex', alignItems: 'center', gap: 8,
  padding: '8px 16px', backgroundColor: '#8B5CF6',
  color: 'white', border: 'none', borderRadius: 9999,
  cursor: 'pointer',
};
const signOutStyle = {
  display: 'flex', alignItems: 'center', gap: 8,
  padding: '8px 16px', backgroundColor: '#EC4899',
  color: 'white', border: 'none', borderRadius: 9999,
  cursor: 'pointer',
};
const iconStyle = { width: 20, height: 20 };
const headerStyle = { padding: 16 };
const titleStyle = {
  fontSize: '1.875rem', fontWeight: 800,
  background: 'linear-gradient(to right, #7C3AED, #EC4899)',
  WebkitBackgroundClip: 'text', color: 'transparent',
};
const mainStyle = {
  flex: 1, overflow: 'auto', paddingTop: 80, padding: 16,
};
const loadingStyle = {
  textAlign: 'center', fontSize: '1.25rem', color: '#7C3AED',
};
const tableStyle = {
  width: '100%', borderCollapse: 'collapse',
};
const theadStyle = {
  background: 'linear-gradient(to right, #EDE9FE, #FCE7F3)',
  position: 'sticky', top: 0, zIndex: 1,
};
const thStyle = {
  padding: '8px', textAlign: 'left',
  fontSize: '0.75rem', fontWeight: 600,
  color: '#7C3AED', textTransform: 'uppercase',
  borderBottom: '1px solid #D1D5DB',
};
const tdStyle = {
  padding: '8px', fontSize: '0.875rem',
  color: '#4B5563', borderBottom: '1px solid #E5E7EB',
};
const moodTdStyle = { ...tdStyle, display: 'flex', gap: 8, fontSize: '1.5rem' };
const inputStyle = {
  width: '100%', padding: '4px 8px', fontSize: '0.875rem',
  border: '1px solid #D1D5DB', borderRadius: 4,
};
const rowStyle = avg => ({
  borderLeft: avg <= 2
    ? '4px solid #EF4444'
    : avg <= 3
    ? '4px solid #FACC15'
    : '4px solid #22C55E',
});
