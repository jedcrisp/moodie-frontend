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
import { LogOut, Upload, Smile, Download } from 'lucide-react';
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

  // 1) FETCH all students + last 5 moods
  useEffect(() => {
    async function fetchStudents() {
      setLoading(true);
      try {
        const ref = collection(db, 'schools', user.school, 'students');
        const snap = await getDocs(ref);
        const data = await Promise.all(
          snap.docs.map(async docSnap => {
            const s = docSnap.data();
            const moodsRef = collection(
              db, 'schools', user.school, 'students', docSnap.id, 'moods'
            );
            const moodsSnap = await getDocs(query(moodsRef, orderBy('date','desc'), limit(5)));
            const moods = moodsSnap.docs.map(d => d.data());
            const avg = moods.length
              ? moods.reduce((sum,m)=> sum + (m.score||0),0)/moods.length
              : null;
            return { id: docSnap.id, ...s, moods, averageMood: avg };
          })
        );
        setStudents(data.sort((a,b)=> (a.averageMood||99)-(b.averageMood||99)));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    if (user?.school) fetchStudents();
  }, [db, user]);

  // 2) SIGN OUT
  const handleSignOut = async () => {
    await signOut(getAuth());
    window.location.reload();
  };

  // 3) CSV UPLOAD
  const handleCsvUpload = e => {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      complete: async ({ data }) => {
        if (!Array.isArray(data)) return;
        for (const row of data) {
          if (!row.studentId || !row.name) continue;
          const studentRef = doc(db, 'schools', user.school, 'students', row.studentId);
          await setDoc(studentRef, {
            name: row.name,
            studentId: row.studentId,
            grade: row.grade,
            birthday: row.birthday,
            notes: row.notes || ''
          });
        }
        // re-fetch
        setLoading(true);
        await new Promise(r => setTimeout(r, 500)); // slight delay
        navigate(0);
      },
      error: console.error
    });
  };

  // 4) NAVIGATE to Mood Selector
  const handleMoodSelectorRedirect = () => {
    navigate('mood-selector');
  };

  // 5) DOWNLOAD CSV of current students
  const handleDownloadCsv = () => {
    const rows = students.map(s => ({
      Name: s.name,
      'Student ID': s.studentId,
      Grade: s.grade,
      Birthday: s.birthday,
      'Average Mood': s.averageMood != null ? s.averageMood.toFixed(2) : '',
      Notes: s.notes || ''
    }));
    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `students_${user.school}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // 6) SAVE edited note
  const saveNote = async id => {
    const ref = doc(db, 'schools', user.school, 'students', id);
    await updateDoc(ref, { notes: tempNote });
    setEditingId(null);
    navigate(0); // refresh
  };

  return (
    <div style={containerStyle}>
      {/* Top-Right Controls */}
      <div style={controlsStyle}>
        <label style={uploadButtonStyle}>
          <Upload style={iconStyle} />
          <span>Upload CSV</span>
          <input type="file" accept=".csv" style={{ display:'none' }} onChange={handleCsvUpload} />
        </label>

        <button style={downloadButtonStyle} onClick={handleDownloadCsv}>
          <Download style={iconStyle} />
          <span>Download CSV</span>
        </button>

        {!location.pathname.endsWith('/mood-selector') && (
          <button style={moodSelectorStyle} onClick={handleMoodSelectorRedirect}>
            <Smile style={iconStyle} />
            <span>Mood Selector</span>
          </button>
        )}

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
          <div style={loadingStyle}>Loading…</div>
        ) : students.length === 0 ? (
          <div style={loadingStyle}>No students found.</div>
        ) : (
          <div style={contentStyle}>
            <table style={tableStyle}>
              <thead style={theadStyle}>
                <tr>
                  <th style={thStyle}>Name</th>
                  <th style={thStyle}>Student ID</th>
                  <th style={thStyle}>Grade</th>
                  <th style={thStyle}>Birthday</th>
                  <th style={thStyle}>Avg Mood</th>
                  <th style={thStyle}>Notes</th>
                </tr>
              </thead>
              <tbody>
                {students.map(s => (
                  <tr key={s.id} style={{ borderLeft: s.averageMood <=2 ? '4px solid red' : s.averageMood<=3 ? '4px solid orange' : '4px solid green' }}>
                    <td style={tdStyle}>{s.name}</td>
                    <td style={tdStyle}>{s.studentId}</td>
                    <td style={tdStyle}>{s.grade}</td>
                    <td style={tdStyle}>{s.birthday}</td>
                    <td style={tdStyle}>{s.averageMood?.toFixed(2) ?? '–'}</td>
                    <td style={tdStyle}>
                      {editingId === s.id ? (
                        <input
                          style={inputStyle}
                          value={tempNote}
                          onChange={e=>setTempNote(e.target.value)}
                          onBlur={()=>saveNote(s.id)}
                          onKeyDown={e=>e.key==='Enter' && saveNote(s.id)}
                          autoFocus
                        />
                      ) : (
                        <span onClick={()=>{ setEditingId(s.id); setTempNote(s.notes||'') }}>
                          {s.notes||'—'}
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

      {/* nested mood-selector route */}
      <Outlet />
    </div>
  );
}
const containerStyle = {
  width:'100dvw', height:'100dvh', display:'flex',flexDirection:'column',
  overflow:'hidden',margin:0,padding:0,
  backgroundImage:`
    linear-gradient(to bottom right, rgba(255,182,193,0.3),rgba(173,216,230,0.3)),
    radial-gradient(circle at 20% 30%,rgba(255,182,193,0.5),transparent 50%),
    radial-gradient(circle at 80% 70%,rgba(173,216,230,0.5),transparent 50%),
    radial-gradient(circle at 50% 50%,rgba(255,228,181,0.4),transparent 50%)
  `,
  backgroundBlendMode:'overlay'
};
const controlsStyle = { position:'fixed',top:8,right:8,display:'flex',gap:12,zIndex:10 };
const uploadButtonStyle = {
  display:'flex',alignItems:'center',gap:8,padding:'8px 16px',
  backgroundColor:'white',border:'1px solid #A78BFA',borderRadius:9999,
  color:'#7C3AED',cursor:'pointer'
};
const moodSelectorStyle = {
  display:'flex',alignItems:'center',gap:8,padding:'8px 16px',
  backgroundColor:'#8B5CF6',color:'white',border:'none',borderRadius:9999,
  cursor:'pointer'
};
const backButtonStyle = {
  display:'flex',alignItems:'center',gap:8,padding:'8px 16px',
  backgroundColor:'#6B7280',color:'white',border:'none',borderRadius:9999,
  cursor:'pointer'
};
const signOutStyle = {
  display:'flex',alignItems:'center',gap:8,padding:'8px 16px',
  backgroundColor:'#EC4899',color:'white',border:'none',borderRadius:9999,
  cursor:'pointer'
};
const iconStyle = { width:20,height:20 };
const headerStyle = { padding:8 };
const titleStyle = {
  fontSize:'1.875rem',fontWeight:800,
  background:'linear-gradient(to right,#7C3AED,#EC4899)',
  WebkitBackgroundClip:'text',backgroundClip:'text',color:'transparent'
};
const mainStyle = { flex:1,overflow:'auto' };
const loadingStyle = {
  display:'flex',alignItems:'center',justifyContent:'center',
  height:'100%',color:'#7C3AED',fontSize:'1.25rem'
};
const contentStyle = { maxHeight:'100%',display:'flex',flexDirection:'column' };
const introStyle = { padding:8 };
const subtitleStyle = { fontSize:'1.5rem',fontWeight:700,color:'#1F2937' };
const introTextStyle = { marginTop:4,fontSize:'0.875rem',color:'#4B5563' };
const tableContainerStyle = { overflow:'auto' };
const tableStyle = { width:'100%',borderCollapse:'collapse' };
const theadStyle = {
  background:'linear-gradient(to right,#EDE9FE,#FCE7F3)',
  position:'sticky',top:0
};
const thStyle = {
  padding:'8px 16px',textAlign:'left',fontSize:'0.75rem',fontWeight:600,
  color:'#7C3AED',textTransform:'uppercase',borderBottom:'1px solid #D1D5DB'
};
const tdStyle = {
  padding:'8px 16px',fontSize:'0.875rem',color:'#4B5563',
  borderBottom:'1px solid #E5E7EB'
};
const inputStyle = {
  width:'100%',padding:'4px 8px',fontSize:'0.875rem',
  border:'1px solid #D1D5DB',borderRadius:4
};
