// src/components/StudentProfile.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  updateDoc
} from 'firebase/firestore';
import { ArrowLeft, Edit2, Check, X } from 'lucide-react';
import { db } from './firebase';

export default function StudentProfile({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [moods, setMoods] = useState([]);
  const [editing, setEditing] = useState(false);
  const [tempNotes, setTempNotes] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const studentRef = doc(db, 'schools', user.school, 'students', id);
        const studentSnap = await getDoc(studentRef);
        if (studentSnap.exists()) {
          const data = { id: studentSnap.id, ...studentSnap.data() };
          setStudent(data);
          setTempNotes(data.notes || '');
        }
        const moodsSnap = await getDocs(
          query(
            collection(db, 'schools', user.school, 'students', id, 'moods'),
            orderBy('date', 'desc'),
            limit(10)
          )
        );
        setMoods(moodsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error('Error loading student profile:', err);
      }
    }
    loadData();
  }, [id, user.school]);

  const saveNotes = async () => {
    try {
      const studentRef = doc(db, 'schools', user.school, 'students', id);
      await updateDoc(studentRef, { notes: tempNotes });
      setStudent(prev => ({ ...prev, notes: tempNotes }));
      setEditing(false);
    } catch (err) {
      console.error('Error saving notes:', err);
      alert('Failed to save notes.');
    }
  };

  if (!student) {
    return <div style={loadingStyle}>Loading student profile…</div>;
  }

  return (
    <div style={pageContainer}>
      <button onClick={() => navigate(-1)} style={backButtonStyle}>
        <ArrowLeft /> Back
      </button>
      <div style={cardStyle}>
        <h1 style={nameStyle}>{student.name}</h1>
        <div style={infoGrid}>
          <div style={infoItem}>
            <span style={infoLabel}>Student ID:</span>
            <span style={infoValue}>{student.studentId}</span>
          </div>
          <div style={infoItem}>
            <span style={infoLabel}>Grade:</span>
            <span style={infoValue}>{student.grade}</span>
          </div>
          <div style={infoItem}>
            <span style={infoLabel}>Birthday:</span>
            <span style={infoValue}>{student.birthday}</span>
          </div>
        </div>
        <div style={notesBox}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={notesHeader}>Notes</h2>
            {editing ? (
              <div>
                <button onClick={saveNotes} style={iconButtonStyle}><Check /></button>
                <button onClick={() => { setEditing(false); setTempNotes(student.notes || ''); }} style={iconButtonStyle}><X /></button>
              </div>
            ) : (
              <button onClick={() => setEditing(true)} style={iconButtonStyle}><Edit2 /></button>
            )}
          </div>
          {editing ? (
            <textarea
              style={notesTextarea}
              value={tempNotes}
              onChange={e => setTempNotes(e.target.value)}
            />
          ) : (
            <p style={notesContent}>{student.notes || '—'}</p>
          )}
        </div>
        <div style={moodsSection}>
          <h2 style={sectionHeader}>Recent Moods</h2>
          <div style={moodsContainer}>
            {moods.length > 0 ? (
              moods.map(m => (
                <div key={m.id} style={moodItem}>{m.emoji}</div>
              ))
            ) : (
              <p style={emptyText}>No moods recorded.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// — Styles —
const pageContainer = {
  maxWidth: 800,
  margin: '2rem auto',
  padding: '0 1rem'
};
const backButtonStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  background: 'none',
  border: 'none',
  color: '#4B5563',
  cursor: 'pointer',
  fontSize: '1rem',
  marginBottom: '1rem'
};
const cardStyle = {
  background: '#FFFFFF',
  borderRadius: 8,
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  padding: '2rem'
};
const nameStyle = { margin: 0, fontSize: '2rem', fontWeight: 700, color: '#1F2937' };
const infoGrid = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' };
const infoItem = { display: 'flex', gap: '0.5rem' };
const infoLabel = { fontWeight: 600, color: '#4B5563' };
const infoValue = { color: '#1F2937' };
const notesBox = { marginTop: '1.5rem', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 4, padding: '1rem' };
const notesHeader = { margin: '0 0 0.5rem', fontSize: '1.25rem', fontWeight: 600, color: '#374151' };
const notesContent = { margin: 0, color: '#4B5563', whiteSpace: 'pre-wrap' };
const notesTextarea = { width: '100%', minHeight: 100, padding: '0.5rem', fontSize: '1rem', border: '1px solid #D1D5DB', borderRadius: 4, resize: 'vertical' };
const iconButtonStyle = { background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', padding: 4, marginLeft: 8 };
const sectionHeader = { fontSize: '1.5rem', fontWeight: 600, color: '#1F2937', marginTop: '2rem', marginBottom: '1rem' };
const moodsSection = {};
const moodsContainer = { display: 'flex', gap: '0.5rem' };
const moodItem = { fontSize: '2rem' };
const emptyText = { color: '#9CA3AF' };
const loadingStyle = { textAlign: 'center', marginTop: '2rem', color: '#6B7280' };

