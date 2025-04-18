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
import { LogOut, Upload, Smile, Download } from 'lucide-react';   // ← Import Download icon
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

  // Fetch students...
  useEffect(() => {
    async function fetchStudents() {
      try {
        const studentRef = collection(db, 'schools', user.school, 'students');
        const studentSnap = await getDocs(studentRef);
        const data = await Promise.all(
          studentSnap.docs.map(async docSnap => {
            const student = docSnap.data();
            const moodsRef = collection(
              db, 'schools', user.school, 'students', docSnap.id, 'moods'
            );
            const moodSnap = await getDocs(query(moodsRef, orderBy('date','desc'), limit(5)));
            const moodEntries = moodSnap.docs.map(d => d.data());
            const avg = moodEntries.length
              ? moodEntries.reduce((sum,m) => sum + (m.score||0),0)/moodEntries.length
              : null;
            return { id: docSnap.id, ...student, moods: moodEntries, averageMood: avg };
          })
        );
        setStudents(data.sort((a,b)=> (a.averageMood||99)-(b.averageMood||99)));
      } catch(err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if(user?.school) fetchStudents();
  }, [db, user]);

  // Sign out
  const handleSignOut = async () => {
    await signOut(getAuth());
    window.location.reload();
  };

  // CSV upload (unchanged)...
  const handleCsvUpload = // ...

  // Mood selector nav
  const handleMoodSelectorRedirect = () => navigate('mood-selector');

  // Download CSV handler
  const handleDownloadCsv = () => {
    // Map to a simple array of objects
    const rows = students.map(s => ({
      Name: s.name,
      'Student ID': s.studentId,
      Grade: s.grade,
      Birthday: s.birthday,
      'Average Mood': s.averageMood != null ? s.averageMood.toFixed(2) : '',
      Notes: s.notes || ''
    }));
    // Convert to CSV
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

  // Save note (unchanged)...
  const saveNote = async id => { /* ... */ };

  return (
    <div style={containerStyle}>
      {/* Top-Right Controls */}
      <div style={controlsStyle}>
        <label style={uploadButtonStyle}>
          <Upload style={iconStyle} />
          <span>Upload CSV</span>
          <input type="file" accept=".csv" style={{display:'none'}} onChange={handleCsvUpload} />
        </label>

        {/* Download CSV */}
        <button
          style={downloadButtonStyle}
          onClick={handleDownloadCsv}
          title="Download CSV"
        >
          <Download style={iconStyle} />
          <span>Download CSV</span>
        </button>

        {/* Mood Selector */}
        { !location.pathname.endsWith('/mood-selector') && (
          <button style={moodSelectorStyle} onClick={handleMoodSelectorRedirect}>
            <Smile style={iconStyle} />
            <span>Mood Selector</span>
          </button>
        )}

        {/* Sign Out */}
        <button style={signOutStyle} onClick={handleSignOut}>
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
        {/* ... your existing table rendering ... */}
      </main>

      {/* Nested routes (mood selector screen) */}
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
