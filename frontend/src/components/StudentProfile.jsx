// frontend/src/components/StudentProfile.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getFirestore, doc, getDoc, collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { ArrowLeft, X, Calendar, UserPlus } from 'lucide-react';
import { profileContainerStyle, profileHeaderStyle, profileContentStyle, infoSectionStyle, eventsSectionStyle, eventsListStyle, eventChipStyle, addEventButtonStyle, modalOverlayStyle, modalStyle, modalHeaderStyle, modalBodyStyle, modalFooterStyle, formGroupStyle, labelStyle, modalInputStyle, cancelButtonStyle, addButtonStyle, backButtonStyle } from '../styles.js';

export default function StudentProfile({ user }) {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const db = getFirestore();
  const [student, setStudent] = useState(null);
  const [lifeEvents, setLifeEvents] = useState([]);
  const [showEventModal, setShowEventModal] = useState(false);
  const [newEventType, setNewEventType] = useState('');
  const [newEventDate, setNewEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [newEventNotes, setNewEventNotes] = useState('');

  const eventTypes = [
    { name: 'Divorce', category: 'emotional' },
    { name: 'Death in Family', category: 'emotional' },
    { name: 'Moved House', category: 'relocation' },
    { name: 'New Sibling', category: 'family' },
    { name: 'Other', category: 'other' },
  ];

  useEffect(() => {
    // Defensive check: Ensure user, user.school, and studentId are defined
    if (!user || !user.school || !studentId) {
      console.error('Missing required data:', { user, studentId });
      navigate('/admin');
      return;
    }

    async function fetchStudentData() {
      try {
        // Fetch student details
        const studentDoc = await getDoc(doc(db, 'schools', user.school, 'students', studentId));
        if (studentDoc.exists()) {
          setStudent({ id: studentDoc.id, ...studentDoc.data() });
        } else {
          console.error('Student not found');
          navigate('/admin');
          return;
        }

        // Fetch life events
        const eventsSnap = await getDocs(
          collection(db, 'schools', user.school, 'students', studentId, 'lifeEvents')
        );
        const events = eventsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        events.sort((a, b) => b.date.toDate() - a.date.toDate()); // Sort by date, newest first
        setLifeEvents(events);
      } catch (err) {
        console.error('Error fetching student data:', err);
        navigate('/admin');
      }
    }

    fetchStudentData();
  }, [user, studentId, navigate, db]); // Ensure all dependencies are included

  const handleAddEvent = async () => {
    if (!newEventType || !newEventDate) {
      alert('Please select an event type and date.');
      return;
    }
    if (newEventNotes.length > 100) {
      alert('Notes cannot exceed 100 characters.');
      return;
    }
    try {
      const eventData = {
        type: newEventType,
        date: new Date(newEventDate),
        notes: newEventNotes.trim(),
        createdAt: serverTimestamp(),
      };
      const eventRef = await addDoc(
        collection(db, 'schools', user.school, 'students', studentId, 'lifeEvents'),
        eventData
      );
      setLifeEvents(prev => [
        { id: eventRef.id, ...eventData, date: new Date(newEventDate) },
        ...prev,
      ]);
      setShowEventModal(false);
      setNewEventType('');
      setNewEventDate(new Date().toISOString().split('T')[0]);
      setNewEventNotes('');
    } catch (err) {
      console.error('Error adding life event:', err);
      alert('Failed to add life event. Please try again.');
    }
  };

  if (!student) return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-rose-200 to-blue-200">
      <p className="text-2xl text-purple-700" aria-live="polite">Loading student data…</p>
    </div>
  );

  return (
    <div style={profileContainerStyle}>
      {showEventModal && (
        <div style={modalOverlayStyle}>
          <div style={modalStyle}>
            <div style={modalHeaderStyle}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Add Life Event</h3>
              <button
                onClick={() => setShowEventModal(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
              >
                <X style={{ width: 20, height: 20 }} />
              </button>
            </div>
            <div style={modalBodyStyle}>
              <div style={formGroupStyle}>
                <label style={labelStyle}>Event Type *</label>
                <select
                  value={newEventType}
                  onChange={e => setNewEventType(e.target.value)}
                  style={modalInputStyle}
                  required
                >
                  <option value="">Select an event</option>
                  {eventTypes.map(event => (
                    <option key={event.name} value={event.name}>
                      {event.name}
                    </option>
                  ))}
                </select>
              </div>
              <div style={formGroupStyle}>
                <label style={labelStyle}>Date *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="date"
                    value={newEventDate}
                    onChange={e => setNewEventDate(e.target.value)}
                    style={modalInputStyle}
                    required
                  />
                  <Calendar style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: '#4B5563' }} />
                </div>
              </div>
              <div style={formGroupStyle}>
                <label style={labelStyle}>Notes (optional, max 100 chars)</label>
                <textarea
                  value={newEventNotes}
                  onChange={e => setNewEventNotes(e.target.value)}
                  style={{ ...modalInputStyle, resize: 'none', height: '60px' }}
                  maxLength={100}
                  placeholder="Brief notes..."
                />
              </div>
            </div>
            <div style={modalFooterStyle}>
              <button onClick={() => setShowEventModal(false)} style={cancelButtonStyle}>
                Cancel
              </button>
              <button onClick={handleAddEvent} style={addButtonStyle}>
                Add Event
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={profileHeaderStyle}>
        <button onClick={() => navigate('/admin')} style={backButtonStyle}>
          <ArrowLeft style={{ width: 20, height: 20 }} />
          <span>Back</span>
        </button>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>{student.name}</h2>
      </div>
      <div style={profileContentStyle}>
        <div style={infoSectionStyle}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Student Info</h3>
          <p><strong>Student ID:</strong> {student.studentId}</p>
          <p><strong>Grade:</strong> {student.grade || '—'}</p>
          <p><strong>Birthday:</strong> {student.birthday || '—'}</p>
          <p><strong>Campus:</strong> {student.campus || '—'}</p>
          <p><strong>Email:</strong> {student.email || '—'}</p>
        </div>
        <div style={eventsSectionStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Life Events</h3>
            <button onClick={() => setShowEventModal(true)} style={addEventButtonStyle}>
              <UserPlus style={{ width: 16, height: 16 }} />
              <span>Add Event</span>
            </button>
          </div>
          {lifeEvents.length > 0 ? (
            <div style={eventsListStyle}>
              {lifeEvents.map(event => {
                const eventType = eventTypes.find(type => type.name === event.type) || { category: 'other' };
                const chipStyle = {
                  ...eventChipStyle,
                  backgroundColor: eventType.category === 'emotional' ? '#FEE2E2' : eventType.category === 'relocation' ? '#DBEAFE' : '#E5E7EB',
                  color: eventType.category === 'emotional' ? '#DC2626' : eventType.category === 'relocation' ? '#2563EB' : '#4B5563',
                };
                return (
                  <div key={event.id} style={chipStyle}>
                    <span style={{ marginRight: '4px' }}>
                      {eventType.category === 'emotional' ? '❤️' : eventType.category === 'relocation' ? '🏠' : '📅'}
                    </span>
                    {event.type} ({new Date(event.date).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })})
                    {event.notes && <span style={{ marginLeft: '4px', fontStyle: 'italic' }}>- {event.notes}</span>}
                  </div>
                );
              })}
            </div>
          ) : (
            <p style={{ color: '#4B5563', fontStyle: 'italic' }}>No life events recorded.</p>
          )}
        </div>
      </div>
    </div>
  );
}
