// src/components/StudentProfile.jsx
import React, { useState, useEffect } from 'react';
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  updateDoc,
} from 'firebase/firestore';
import { ArrowLeft } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from './firebase';

export default function StudentProfile({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [moods, setMoods] = useState([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ grade: '', birthday: '', teacher: '', notes: '' });

  // Fetch student data
  useEffect(() => {
    async function load() {
      const ref = doc(db, 'schools', user.school, 'students', id);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        setStudent(data);
        setForm({
          grade: data.grade || '',
          birthday: data.birthday || '',
          teacher: data.teacher || '',
          notes: data.notes || '',
        });
      }
      // load moods
      const moodsSnap = await getDocs(
        query(
          collection(db, 'schools', user.school, 'students', id, 'moods'),
          orderBy('date', 'desc'),
          limit(10)
        )
      );
      setMoods(moodsSnap.docs.map(d => d.data()));
    }
    load();
  }, [db, user, id]);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    const ref = doc(db, 'schools', user.school, 'students', id);
    await updateDoc(ref, form);
    setStudent(prev => ({ ...prev, ...form }));
    setEditing(false);
  };

  if (!student) return <div>Loading…</div>;

  return (
    <div style={styles.container}>
      <button style={styles.back} onClick={() => navigate(-1)}>
        <ArrowLeft size={20} /> Back
      </button>
      <div style={styles.card}>
        <h1 style={styles.name}>{student.name}</h1>
        <div style={styles.grid}>
          <div style={styles.field}>
            <label style={styles.label}>Student ID</label>
            <div style={styles.value}>{student.studentId}</div>
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Grade</label>
            {editing ? (
              <input
                style={styles.input}
                name="grade"
                value={form.grade}
                onChange={handleChange}
              />
            ) : (
              <div style={styles.value}>{student.grade}</div>
            )}
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Birthday</label>
            {editing ? (
              <input
                type="date"
                style={styles.input}
                name="birthday"
                value={form.birthday}
                onChange={handleChange}
              />
            ) : (
              <div style={styles.value}>{student.birthday || '—'}</div>
            )}
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Homeroom Teacher</label>
            {editing ? (
              <input
                style={styles.input}
                name="teacher"
                value={form.teacher}
                onChange={handleChange}
                placeholder="Enter name"
              />
            ) : (
              <div style={styles.value}>{student.teacher || '—'}</div>
            )}
          </div>
        </div>

        <div style={styles.field}>  
          <label style={styles.label}>Notes</label>
          <div style={styles.notesBox}>
            {editing ? (
              <textarea
                name="notes"
                style={styles.textArea}
                value={form.notes}
                onChange={handleChange}
                placeholder="Add your notes..."
              />
            ) : (
              <div style={styles.value}>{student.notes || '—'}</div>
            )}
          </div>
        </div>

        <div style={styles.actions}>
          {editing ? (
            <>
              <button style={styles.cancel} onClick={() => setEditing(false)}>
                Cancel
              </button>
              <button style={styles.save} onClick={handleSave}>
                Save Changes
              </button>
            </>
          ) : (
            <button style={styles.edit} onClick={() => setEditing(true)}>
              Edit Profile
            </button>
          )}
        </div>

        <h2 style={styles.section}>Recent Moods</h2>
        <div style={styles.moodList}>
          {moods.length > 0 ? (
            moods.map((m, i) => (
              <span key={i} style={styles.mood}>{m.emoji}</span>
            ))
          ) : (
            <div style={styles.value}>—</div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '2rem',
    background: 'linear-gradient(to bottom right, #fff, #f0f4f8)',
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  back: {
    marginBottom: '1rem',
    background: 'none',
    border: 'none',
    color: '#4B5563',
    fontSize: '1rem',
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
  },
  card: {
    background: 'white',
    borderRadius: '0.5rem',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    padding: '2rem',
    width: '100%',
    maxWidth: '600px',
  },
  name: {
    fontSize: '2rem',
    marginBottom: '1rem',
    color: '#1F2937',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem',
    marginBottom: '1.5rem',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
  },
  label: {
    fontSize: '0.875rem',
    fontWeight: 600,
    color: '#4B5563',
    marginBottom: '0.5rem',
  },
  value: {
    fontSize: '1rem',
    color: '#1F2937',
  },
  input: {
    padding: '0.5rem',
    border: '1px solid #CBD5E0',
    borderRadius: '0.375rem',
    fontSize: '1rem',
    outline: 'none',
  },
  notesBox: {
    background: '#F9FAFB',
    border: '1px solid #E5E7EB',
    borderRadius: '0.375rem',
    padding: '0.75rem',
    minHeight: '4rem',
  },
  textArea: {
    width: '100%',
    height: '100%',
    border: 'none',
    outline: 'none',
    resize: 'vertical',
    background: 'transparent',
    fontSize: '1rem',
    color: '#1F2937',
  },
  actions: {
    marginTop: '1rem',
    display: 'flex',
    gap: '0.5rem',
  },
  edit: {
    background: '#4F46E5',
    color: 'white',
    padding: '0.5rem 1rem',
    border: 'none',
    borderRadius: '0.375rem',
    cursor: 'pointer',
  },
  cancel: {
    background: 'none',
    color: '#6B7280',
    padding: '0.5rem 1rem',
    border: '1px solid #D1D5DB',
    borderRadius: '0.375rem',
    cursor: 'pointer',
  },
  save: {
    background: '#10B981',
    color: 'white',
    padding: '0.5rem 1rem',
    border: 'none',
    borderRadius: '0.375rem',
    cursor: 'pointer',
  },
  section: {
    fontSize: '1.25rem',
    fontWeight: 600,
    color: '#1F2937',
    marginTop: '2rem',
    marginBottom: '0.5rem',
  },
  moodList: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap',
  },
  mood: {
    fontSize: '1.5rem',
  },
};
