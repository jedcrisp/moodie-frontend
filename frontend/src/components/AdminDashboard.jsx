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
  deleteDoc,
  getDoc,
  serverTimestamp,
  where,
  updateDoc,
  arrayUnion,
} from 'firebase/firestore';
import { getAuth, signOut } from 'firebase/auth';
import {
  Upload,
  LogOut,
  Smile,
  ArrowLeft,
  Trash2,
  Search,
  UserPlus,
  X,
} from 'lucide-react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import Papa from 'papaparse';

export default function AdminDashboard({ user }) {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [schoolDisplayName, setSchoolDisplayName] = useState('');
  const [selectedCampus, setSelectedCampus] = useState('');
  const [showCounselorModal, setShowCounselorModal] = useState(false);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [newCounselorName, setNewCounselorName] = useState('');
  const [newCounselorEmail, setNewCounselorEmail] = useState('');
  const [newCounselorCampus, setNewCounselorCampus] = useState('');
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentId, setNewStudentId] = useState('');
  const [newStudentGrade, setNewStudentGrade] = useState('');
  const [newStudentBirthday, setNewStudentBirthday] = useState('');
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [newStudentCampus, setNewStudentCampus] = useState('');
  const [availableCampuses, setAvailableCampuses] = useState([]);
  const db = getFirestore();
  const navigate = useNavigate();
  const location = useLocation();
  const onMoodSelector = location.pathname.endsWith('/mood-selector');
  const onStudentProfile = location.pathname.includes('/admin/students/');

  // Load school displayName and campuses
  useEffect(() => {
    async function fetchSchoolData() {
      if (!user?.school) {
        console.warn('No school defined for user:', user);
        setAvailableCampuses(['DefaultCampus']);
        setSchoolDisplayName('Unknown School');
        setSelectedCampus('DefaultCampus');
        setNewStudentCampus('DefaultCampus');
        return;
      }
      try {
        console.log('Fetching school data for school:', user.school);
        // Fetch display name
        const schoolSnap = await getDoc(doc(db, 'schools', user.school));
        setSchoolDisplayName(
          schoolSnap.exists() ? schoolSnap.data().displayName || user.school : user.school
        );
        // Fetch campuses
        const campusesDoc = await getDoc(doc(db, 'schools', user.school, 'campuses', 'list'));
        let campusList = ['DefaultCampus']; // Fallback
        if (campusesDoc.exists() && Array.isArray(campusesDoc.data().names) && campusesDoc.data().names.length > 0) {
          campusList = campusesDoc.data().names;
        } else {
          // Initialize Firestore document with default campus
          await setDoc(doc(db, 'schools', user.school, 'campuses', 'list'), {
            names: ['DefaultCampus'],
          });
        }
        console.log('Available campuses from Firestore:', campusList);
        setAvailableCampuses(campusList);
        // Set default selectedCampus and newStudentCampus
        const defaultCampus = campusList[0] || 'DefaultCampus';
        setSelectedCampus(defaultCampus);
        setNewStudentCampus(defaultCampus);
      } catch (err) {
        console.error('Error fetching school data:', err);
        setAvailableCampuses(['DefaultCampus']);
        setSchoolDisplayName(user?.school || 'Unknown School');
        setSelectedCampus('DefaultCampus');
        setNewStudentCampus('DefaultCampus');
      }
    }
    fetchSchoolData();
  }, [db, user]);

  // Load students + last 5 moods for the selected campus
  const fetchStudents = async () => {
    setLoading(true);
    try {
      const studentsQuery = selectedCampus
        ? query(
            collection(db, 'schools', user.school, 'students'),
            where('campus', '==', selectedCampus)
          )
        : collection(db, 'schools', user.school, 'students');
      const snap = await getDocs(studentsQuery);
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
      setFilteredStudents(arr);
    } catch (err) {
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.school) fetchStudents();
  }, [db, user, selectedCampus]);

  // Filter students by search query
  useEffect(() => {
    const q = searchQuery.toLowerCase();
    setFilteredStudents(
      students.filter(
        s =>
          (s.name || '').toLowerCase().includes(q) ||
          (s.studentId || '').toLowerCase().includes(q)
      )
    );
  }, [searchQuery, students]);

  // Handlers
  const handleSignOut = async () => {
    try {
      await signOut(getAuth());
      navigate('/signin', { replace: true });
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  const handleCsvUpload = async e => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async ({ data }) => {
          if (!data.length) {
            alert('CSV is empty or invalid.');
            return;
          }
          for (const row of data) {
            if (!row.studentId || !row.name) continue;
            await setDoc(
              doc(db, 'schools', user.school, 'students', row.studentId),
              {
                name: row.name.trim(),
                studentId: row.studentId.trim(),
                grade: row.grade ? row.grade.trim() : '',
                birthday: row.birthday ? row.birthday.trim() : '',
                email: row.email ? row.email.trim() : '',
                campus: selectedCampus || 'DefaultCampus',
              }
            );
          }
          await fetchStudents();
          alert('CSV uploaded successfully!');
        },
        error: err => {
          console.error('Error parsing CSV:', err);
          alert('Failed to parse CSV. Please check the file format.');
        },
      });
    } catch (err) {
      console.error('Error uploading CSV:', err);
      alert('Failed to upload CSV. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadCsv = () => {
    const schoolName = typeof user?.school === 'string' && user.school.trim() ? user.school : 'School';
    const safeSchoolName = schoolName
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .replace(/_+/g, '_') || 'School';
    const filename = `Moodie_${safeSchoolName}_${selectedCampus || 'AllCampuses'}_Students.csv`;

    const rows = filteredStudents.map(s => ({
      Name: s.name,
      'Student ID': s.studentId,
      Grade: s.grade,
      Birthday: s.birthday,
      Email: s.email || '',
      'Last 5 Moods': s.moods.map(m => m.emoji).join(' '),
      'Average Mood': s.averageMood != null ? s.averageMood.toFixed(2) : '',
      Campus: s.campus,
    }));
    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleMoodSelectorRedirect = () => navigate('mood-selector');

  const deleteStudent = async id => {
    if (!window.confirm('Are you sure you want to delete this student? This cannot be undone.')) {
      return;
    }
    try {
      const moodsSnap = await getDocs(
        collection(db, 'schools', user.school, 'students', id, 'moods')
      );
      const deleteMoodsPromises = moodsSnap.docs.map(moodDoc =>
        deleteDoc(moodDoc.ref)
      );
      await Promise.all(deleteMoodsPromises);
      await deleteDoc(doc(db, 'schools', user.school, 'students', id));
      setStudents(prev => prev.filter(student => student.id !== id));
      setFilteredStudents(prev => prev.filter(student => student.id !== id));
      alert('Student deleted successfully.');
    } catch (err) {
      console.error('Error deleting student:', err);
      alert('Failed to delete student. Please try again.');
    }
  };

  const handleAddCounselor = async () => {
    if (!newCounselorName || !newCounselorEmail || !newCounselorCampus) {
      alert('Please fill in all fields.');
      return;
    }
    if (!newCounselorEmail.includes('@')) {
      alert('Please enter a valid email address.');
      return;
    }
    try {
      if (!availableCampuses.includes(newCounselorCampus)) {
        const newCampuses = [...availableCampuses, newCounselorCampus];
        await updateDoc(doc(db, 'schools', user.school, 'campuses', 'list'), {
          names: newCampuses,
        });
        setAvailableCampuses(newCampuses);
        await updateDoc(doc(db, 'users', user.uid), {
          campuses: arrayUnion(newCounselorCampus),
        });
      }
      await setDoc(
        doc(db, 'schools', user.school, 'counselors', newCounselorEmail),
        {
          email: newCounselorEmail,
          name: newCounselorName,
          campus: newCounselorCampus,
          addedAt: serverTimestamp(),
        }
      );
      setNewCounselorName('');
      setNewCounselorEmail('');
      setNewCounselorCampus('');
      setShowCounselorModal(false);
      alert('Counselor added successfully.');
    } catch (err) {
      console.error('Error adding counselor:', err);
      alert('Failed to add counselor. Please try again.');
    }
  };

  const handleAddStudent = async () => {
    if (!newStudentName || !newStudentId || !newStudentEmail) {
      alert('Please fill in all required fields: Name, Student ID, and Email.');
      return;
    }
    if (!newStudentCampus) {
      alert('Please select a campus.');
      return;
    }
    if (!newStudentEmail.includes('@')) {
      alert('Please enter a valid email address.');
      return;
    }
    try {
      await setDoc(
        doc(db, 'schools', user.school, 'students', newStudentId),
        {
          name: newStudentName.trim(),
          studentId: newStudentId.trim(),
          grade: newStudentGrade ? newStudentGrade.trim() : '',
          birthday: newStudentBirthday ? newStudentBirthday.trim() : '',
          email: newStudentEmail.trim(),
          campus: newStudentCampus,
          createdAt: serverTimestamp(),
        }
      );
      setNewStudentName('');
      setNewStudentId('');
      setNewStudentGrade('');
      setNewStudentBirthday('');
      setNewStudentEmail('');
      setNewStudentCampus(selectedCampus || availableCampuses[0] || 'DefaultCampus');
      setShowStudentModal(false);
      await fetchStudents();
      alert('Student added successfully.');
    } catch (err) {
      console.error('Error adding student:', err);
      alert('Failed to add student. Please try again.');
    }
  };

  return (
    <div style={containerStyle}>
      {showCounselorModal && (
        <div style={modalOverlayStyle}>
          <div style={modalStyle}>
            <div style={modalHeaderStyle}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Add Counselor</h2>
              <button
                onClick={() => setShowCounselorModal(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
              >
                <X style={{ width: 20, height: 20 }} />
              </button>
            </div>
            <div style={modalBodyStyle}>
              <div style={formGroupStyle}>
                <label style={labelStyle}>Name</label>
                <input
                  type="text"
                  value={newCounselorName}
                  onChange={e => setNewCounselorName(e.target.value)}
                  style={modalInputStyle}
                  placeholder="Enter counselor name"
                />
              </div>
              <div style={formGroupStyle}>
                <label style={labelStyle}>Email</label>
                <input
                  type="email"
                  value={newCounselorEmail}
                  onChange={e => setNewCounselorEmail(e.target.value)}
                  style={modalInputStyle}
                  placeholder="Enter counselor email"
                />
              </div>
              <div style={formGroupStyle}>
                <label style={labelStyle}>Campus</label>
                <input
                  type="text"
                  value={newCounselorCampus}
                  onChange={e => setNewCounselorCampus(e.target.value)}
                  style={modalInputStyle}
                  placeholder="Enter campus name"
                />
              </div>
            </div>
            <div style={modalFooterStyle}>
              <button
                onClick={() => setShowCounselorModal(false)}
                style={cancelButtonStyle}
              >
                Cancel
              </button>
              <button onClick={handleAddCounselor} style={addButtonStyle}>
                Add Counselor
              </button>
            </div>
          </div>
        </div>
      )}

      {showStudentModal && (
        <div style={modalOverlayStyle}>
          <div style={modalStyle}>
            <div style={modalHeaderStyle}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Add Student</h2>
              <button
                onClick={() => setShowStudentModal(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
              >
                <X style={{ width: 20, height: 20 }} />
              </button>
            </div>
            <div style={modalBodyStyle}>
              <div style={formGroupStyle}>
                <label style={labelStyle}>Name *</label>
                <input
                  type="text"
                  value={newStudentName}
                  onChange={e => setNewStudentName(e.target.value)}
                  style={modalInputStyle}
                  placeholder="Enter student name"
                  required
                />
              </div>
              <div style={formGroupStyle}>
                <label style={labelStyle}>Student ID *</label>
                <input
                  type="text"
                  value={newStudentId}
                  onChange={e => setNewStudentId(e.target.value)}
                  style={modalInputStyle}
                  placeholder="Enter student ID"
                  required
                />
              </div>
              <div style={formGroupStyle}>
                <label style={labelStyle}>Email *</label>
                <input
                  type="email"
                  value={newStudentEmail}
                  onChange={e => setNewStudentEmail(e.target.value)}
                  style={modalInputStyle}
                  placeholder="Enter student email"
                  required
                />
              </div>
              <div style={formGroupStyle}>
                <label style={labelStyle}>Grade</label>
                <input
                  type="text"
                  value={newStudentGrade}
                  onChange={e => setNewStudentGrade(e.target.value)}
                  style={modalInputStyle}
                  placeholder="Enter grade (e.g., 9)"
                />
              </div>
              <div style={formGroupStyle}>
                <label style={labelStyle}>Birthday</label>
                <input
                  type="text"
                  value={newStudentBirthday}
                  onChange={e => setNewStudentBirthday(e.target.value)}
                  style={modalInputStyle}
                  placeholder="Enter birthday (e.g., MM/DD/YYYY)"
                />
              </div>
              <div style={formGroupStyle}>
                <label style={labelStyle}>Campus *</label>
                <select
                  value={newStudentCampus}
                  onChange={e => setNewStudentCampus(e.target.value)}
                  style={modalInputStyle}
                  required
                >
                  <option value="">Select a campus</option>
                  {availableCampuses.map(campus => (
                    <option key={campus} value={campus}>
                      {campus}
                    </option>
                  ))}
                </select>
                {availableCampuses.length === 0 && (
                  <p style={{ color: '#EF4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                    No campuses available. Please contact support.
                  </p>
                )}
              </div>
            </div>
            <div style={modalFooterStyle}>
              <button
                onClick={() => setShowStudentModal(false)}
                style={cancelButtonStyle}
              >
                Cancel
              </button>
              <button onClick={handleAddStudent} style={addButtonStyle}>
                Add Student
              </button>
            </div>
          </div>
        </div>
      )}

      <header style={headerStyle}>
        <div style={headerInnerStyle}>
          <div style={brandingStyle}>
            <h1 style={titleStyle}>{schoolDisplayName} Dashboard</h1>
            <div style={searchContainerStyle}>
              <input
                type="text"
                placeholder="Search by name or ID…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={searchInputStyle}
              />
            </div>
            <select
              value={selectedCampus}
              onChange={e => setSelectedCampus(e.target.value)}
              style={campusSelectorStyle}
            >
              <option value="">All Campuses</option>
              {availableCampuses.map(campus => (
                <option
                  key={campus}
                  value={campus}
                  disabled={user?.campuses && !user.campuses.includes(campus)}
                >
                  {campus}
                  {user?.campuses && !user.campuses.includes(campus) ? ' (Restricted)' : ''}
                </option>
              ))}
            </select>
          </div>
          <div style={controlsStyle}>
            <label style={uploadButtonStyle}>
              <Upload style={iconStyle} />
              <span>{uploading ? 'Uploading...' : 'Upload CSV'}</span>
              <input
                type="file"
                accept=".csv"
                style={{ display: 'none' }}
                onChange={handleCsvUpload}
                disabled={uploading}
              />
            </label>
            <button style={addCounselorButtonStyle} onClick={() => setShowCounselorModal(true)}>
              <UserPlus style={iconStyle} />
              <span>Add Counselor</span>
            </button>
            <button style={addStudentButtonStyle} onClick={() => setShowStudentModal(true)}>
              <UserPlus style={iconStyle} />
              <span>Add Student</span>
            </button>
            {onMoodSelector || onStudentProfile ? (
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

      {onMoodSelector || onStudentProfile ? (
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
                    {['Name', 'Student ID', 'Grade', 'Birthday', 'Last 5 Moods', 'Average Mood', 'DELETE'].map(h => (
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
                            : '4px solid #22C55E',
                      }}
                    >
                      <td style={tdStyle}>
                        <Link to={`/admin/students/${s.id}`} style={linkStyle}>
                          {s.name}
                        </Link>
                      </td>
                      <td style={tdStyle}>{s.studentId}</td>
                      <td style={tdStyle}>{s.grade}</td>
                      <td style={tdStyle}>{s.birthday}</td>
                      <td style={{ ...tdStyle, fontSize: '1.5rem' }}>
                        {s.moods.length > 0 ? s.moods.map((m, i) => <span key={i}>{m.emoji}</span>) : '—'}
                      </td>
                      <td style={tdStyle}>
                        {s.averageMood != null ? s.averageMood.toFixed(2) : '—'}
                      </td>
                      <td style={tdStyle}>
                        <button onClick={() => deleteStudent(s.id)} style={deleteButtonStyle}>
                          <Trash2 style={{ width: 16, height: 16 }} />
                        </button>
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
const containerStyle = {
  width: '100vw',
  height: '100vh',
  display: 'flex',
  flexDirection: 'column',
  background: 'linear-gradient(to bottom right, rgba(255,182,193,0.3), rgba(173,216,230,0.3))',
};
const headerStyle = {
  padding: '0.5rem 1rem',
  background: 'linear-gradient(to right, #ede9fe, #fce7f3)',
  boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
};
const headerInnerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};
const brandingStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
};
const titleStyle = {
  fontSize: '1.75rem',
  fontWeight: 700,
  background: 'linear-gradient(to right, #7C3AED, #EC4899)',
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
const addCounselorButtonStyle = {
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
const addStudentButtonStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '6px 12px',
  backgroundColor: '#10B981',
  border: 'none',
  borderRadius: 9999,
  color: 'white',
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
const searchContainerStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
};
const searchInputStyle = {
  padding: '0.5rem 1rem',
  border: '1px solid #D1D5DB',
  borderRadius: '9999px',
  width: '200px',
};
const campusSelectorStyle = {
  padding: '0.5rem',
  border: '1px solid #D1D5DB',
  borderRadius: '4px',
  backgroundColor: 'white',
  cursor: 'pointer',
};
const mainStyle = { flex: 1, overflow: 'auto', padding: '1rem' };
const loadingStyle = {
  fontSize: '1.25rem',
  color: '#7C3AED',
  textAlign: 'center',
  marginTop: 40,
};
const tableContainerStyle = { width: '100%', overflowX: 'auto' };
const tableStyle = { width: '100%', borderCollapse: 'collapse' };
const theadStyle = {
  background: 'linear-gradient(to right, #EDE9FE, #FCE7F3)',
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
const linkStyle = {
  color: '#3B82F6',
  textDecoration: 'underline',
};
const deleteButtonStyle = {
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
};
const modalOverlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1000,
};
const modalStyle = {
  backgroundColor: 'white',
  padding: '1.5rem',
  borderRadius: '8px',
  width: '400px',
  maxWidth: '90%',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
};
const modalHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '1rem',
};
const modalBodyStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
};
const modalFooterStyle = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '0.5rem',
  marginTop: '1rem',
};
const formGroupStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.25rem',
};
const labelStyle = {
  fontSize: '0.875rem',
  fontWeight: 500,
  color: '#4B5563',
};
const modalInputStyle = {
  padding: '0.5rem',
  border: '1px solid #D1D5DB',
  borderRadius: '4px',
  fontSize: '0.875rem',
};
const cancelButtonStyle = {
  padding: '0.5rem 1rem',
  backgroundColor: '#6B7280',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
};
const addButtonStyle = {
  padding: '0.5rem 1rem',
  backgroundColor: '#3B82F6',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
};
