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
import { Upload, LogOut, Smile, ArrowLeft, Edit2, Check, X } from 'lucide-react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import Papa from 'papaparse';

export default function AdminDashboard({ user }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [tempRow, setTempRow] = useState({});
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
    navigate('/signin', { replace: true });
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
      'Last 5 Moods': s.moods.map(m => m.emoji).join(' '),
      'Average Mood': s.averageMood != null ? s.averageMood.toFixed(2) : '',
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

  const startEditing = s => {
    setEditingId(s.id);
    setTempRow({
      name: s.name,
      studentId: s.studentId,
      grade: s.grade,
      birthday: s.birthday,
      notes: s.notes || '',
    });
  };

  const saveRow = async id => {
    await updateDoc(
      doc(db, 'schools', user.school, 'students', id),
      tempRow
    );
    setEditingId(null);
    setTimeout(() => navigate('/admin', { replace: true }), 100);
  };

  const cancelEdit = () => setEditingId(null);

  return (
    <div style={containerStyle}>
      {/* Header */}
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
              <button style={moodSelectorStyle} onClick={handleMoodSelectorRedirect}>
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

      {/* Content or Nested */}
      {onMoodSelector ? (
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
                    {[ 'Name','Student ID','Grade','Birthday','Last 5 Moods','Average Mood','Notes','Actions' ].map(h => (
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
                      {/* Editable cells */}
                      <td style={tdStyle}>
                        {editingId === s.id ? (
                          <input
                            style={inputStyle}
                            value={tempRow.name}
                            onChange={e => setTempRow(prev => ({ ...prev, name: e.target.value }))}
                          />
                        ) : (
                          s.name
                        )}
                      </td>
                      <td style={tdStyle}>
                        {editingId === s.id ? (
                          <input
                            style={inputStyle}
                            value={tempRow.studentId}
                            onChange={e => setTempRow(prev => ({ ...prev, studentId: e.target.value }))}
                          />
                        ) : (
                          s.studentId
                        )}
                      </td>
                      <td style={tdStyle}>
                        {editingId === s.id ? (
                          <input
                            style={inputStyle}
                            value={tempRow.grade}
                            onChange={e => setTempRow(prev => ({ ...prev, grade: e.target.value }))}
                          />
                        ) : (
                          s.grade
                        )}
                      </td>
                      <td style={tdStyle}>
                        {editingId === s.id ? (
                          <input
                            style={inputStyle}
                            value={tempRow.birthday}
                            onChange={e => setTempRow(prev => ({ ...prev, birthday: e.target.value }))}
                          />
                        ) : (
                          s.birthday
                        )}
                      </td>
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
                            value={tempRow.notes}
                            onChange={e => setTempRow(prev => ({ ...prev, notes: e.target.value }))}
                          />
                        ) : (
                          s.notes || '—'
                        )}
                      </td>
                      <td style={tdStyle}>
                        {editingId === s.id ? (
                          <>
                            <button onClick={() => saveRow(s.id)}><Check style={{ width:16,height:16 }} /></button>
                            <button onClick={cancelEdit}><X style={{ width:16,height:16 }} /></button>
                          </>
                        ) : (
                          <button onClick={() => startEditing(s)}><Edit2 style={{ width:16,height:16 }} /></button>
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

// Styles omitted for brevity (reuse your existing style objects)
