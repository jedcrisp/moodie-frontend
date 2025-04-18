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
  getDoc
} from 'firebase/firestore';
import { getAuth, signOut, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { LogOut, Upload, Smile, ArrowLeft } from 'lucide-react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import Papa from 'papaparse';

export default function AdminDashboard({ user }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [tempNote, setTempNote] = useState('');
  const [userRole, setUserRole] = useState(user.role || null);
  const db = getFirestore();
  const auth = getAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Set Firebase Auth persistence
  useEffect(() => {
    setPersistence(auth, browserLocalPersistence)
      .catch(error => console.error('Error setting auth persistence:', error));
  }, [auth]);

  // Fetch user role if not provided
  useEffect(() => {
    async function fetchUserRole() {
      if (!userRole && user?.uid) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setUserRole(userDoc.data().role || 'admin');
        } else {
          console.warn('No user role found, defaulting to admin');
          setUserRole('admin');
        }
      }
    }
    fetchUserRole();
  }, [db, user?.uid, userRole]);

  // Fetch students + moods
  useEffect(() => {
    async function fetchStudents() {
      const ref = collection(db, 'schools', user.school, 'students');
      const snap = await getDocs(ref);
      const data = await Promise.all(
        snap.docs.map(async d => {
          const s = d.data();
          const moodsSnap = await getDocs(
            query(
              collection(db, 'schools', user.school, 'students', d.id, 'moods'),
              orderBy('date', 'desc'),
              limit(5)
            )
          );
          const moods = moodsSnap.docs.map(m => m.data());
          const avg =
            moods.length > 0
              ? moods.reduce((a, m) => a + (m.score || 3), 0) / moods.length
              : null;
          return { id: d.id, ...s, moods, averageMood: avg };
        })
      );
      setStudents(data.sort((a, b) => (a.averageMood ?? 99) - (b.averageMood ?? 99)));
      setLoading(false);
    }
    fetchStudents();
  }, [db, user.school]);

  const handleSignOut = async () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      await signOut(auth);
      navigate('/');
    }
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
              notes: row.notes || ''
            }
          );
        }
        navigate(0);
      }
    });
  };

  const handleMoodSelectorRedirect = () => {
    console.log('Navigating to mood-selector');
    navigate('mood-selector');
  };

  const handleBackToDashboard = () => {
    console.log('Navigating back to /admin');
    navigate('/admin');
  };

  const saveNote = async id => {
    await updateDoc(
      doc(db, 'schools', user.school, 'students', id),
      { notes: tempNote }
    );
    setEditingId(null);
    navigate(0);
  };

  const isMoodSelectorPage = location.pathname === '/admin/mood-selector';

  return (
    <div style={containerStyle}>
      <div style={controlsStyle}>
        {userRole !== 'counselor' && (
          <label style={uploadButtonStyle}>
            <Upload style={iconStyle} />
            <span>Upload CSV</span>
            <input type="file" accept=".csv" style={{ display: 'none' }} onChange={handleCsvUpload} />
          </label>
        )}

        {isMoodSelectorPage ? (
          <button style={backButtonStyle} onClick={handleBackToDashboard}>
            <ArrowLeft style={iconStyle} />
            <span>Back to Dashboard</span>
          </button>
        ) : (
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

      <header style={headerStyle}>
        <h1 style={titleStyle}>Moodie Dashboard: {user.school}</h1>
      </header>

      <main style={mainStyle}>
        {loading ? (
          <div style={loadingStyle}><p>Loading… 🌈</p></div>
        ) : isMoodSelectorPage ? (
          <Outlet />
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
              {students.map(stu => (
                <tr
                  key={stu.id}
                  style={{
                    borderLeft:
                      stu.averageMood <= 2
                        ? '4px solid #EF4444'
                        : stu.averageMood <= 3
                        ? '4px solid #FACC15'
                        : '4px solid #22C55E'
                  }}
                >
                  <td style={tdStyle}>{stu.name}</td>
                  <td style={tdStyle}>{stu.studentId}</td>
                  <td style={tdStyle}>{stu.grade}</td>
                  <td style={tdStyle}>{stu.birthday}</td>
                  <td style={{ ...tdStyle, display: 'flex', gap: 8, fontSize: '1.5rem' }}>
                    {stu.moods.length
                      ? stu.moods.map((m, i) => <span key={i}>{m.emoji}</span>)
                      : <span>No moods yet 😴</span>}
                  </td>
                  <td style={tdStyle}>
                    <span style={{
                      color:
                        stu.averageMood <= 2
                          ? '#DC2626'
                          : stu.averageMood <= 3
                          ? '#D97706'
                          : '#16A34A'
                    }}>
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
                        onChange={e => setTempNote(e.target.value)}
                        onBlur={() => saveNote(stu.id)}
                        onKeyDown={e => e.key === 'Enter' && saveNote(stu.id)}
                        autoFocus
                        style={inputStyle}
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
        )}
      </main>
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
const downloadButtonStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '8px 16px',
  backgroundColor: '#3B82F6', // blue
  color: 'white',
  border: 'none',
  borderRadius: 9999,
  cursor: 'pointer',
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
