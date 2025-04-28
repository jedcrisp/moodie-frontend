// frontend/src/components/StudentProfile.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getFirestore, doc, getDoc, collection, getDocs, addDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ArrowLeft, X, Calendar, UserPlus, Edit, Save, XCircle } from 'lucide-react';
import { profileContainerStyle, profileCardStyle, profileHeaderStyle, profileContentStyle, infoSectionStyle, eventsSectionStyle, notesSectionStyle, eventsListStyle, eventChipStyle, addEventButtonStyle, editButtonStyle, saveButtonStyle, cancelEditButtonStyle, modalOverlayStyle, modalStyle, modalHeaderStyle, modalBodyStyle, modalFooterStyle, formGroupStyle, labelStyle, modalInputStyle, cancelButtonStyle, addButtonStyle, backButtonStyle, notesTextareaStyle } from '../styles.js';

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
  const [notes, setNotes] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ grade: '', birthday: '', campus: '', email: '' });

  const eventTypes = [
    { name: 'Divorce', category: 'emotional' },
    { name: 'Death in Family', category: 'emotional' },
    { name: 'Moved House', category: 'relocation' },
    { name: 'New Sibling', category: 'family' },
    { name: 'Other', category: 'other' },
  ];

  useEffect(() => {
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
          const studentData = { id: studentDoc.id, ...studentDoc.data() };
          setStudent(studentData);
          setEditForm({
            grade: studentData.grade || '',
            birthday: studentData.birthday || '',
            campus: studentData.campus || '',
            email: studentData.email || '',
          });
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
        events.sort((a, b) => b.date.toDate() - a.date.toDate());
        setLifeEvents(events);

        // Fetch notes
        const notesDoc = await getDoc(doc(db, 'schools', user.school, 'students', studentId, 'notes', 'general'));
        if (notesDoc.exists()) {
          setNotes(notesDoc.data().content || '');
        }
      } catch (err) {
        console.error('Error fetching student data:', err);
        navigate('/admin');
      }
    }

    fetchStudentData();
  }, [user, studentId, navigate, db]);

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

  const handleSaveNotes = async () => {
    try {
      await setDoc(doc(db, 'schools', user.school, 'students', studentId, 'notes', 'general'), {
        content: notes,
        updatedAt: serverTimestamp(),
      });
      alert('Notes saved successfully.');
    } catch (err) {
      console.error('Error saving notes:', err);
      alert('Failed to save notes. Please try again.');
    }
  };

  const handleEditSave = async () => {
    try {
      await setDoc(doc(db, 'schools', user.school, 'students', studentId), {
        ...student,
        grade: editForm.grade,
        birthday: editForm.birthday,
        campus: editForm.campus,
        email: editForm.email,
      }, { merge: true });
      setStudent(prev => ({
        ...prev,
        grade: editForm.grade,
        birthday: editForm.birthday,
        campus: editForm.campus,
        email: editForm.email,
      }));
      setIsEditing(false);
      alert('Student information updated successfully.');
    } catch (err) {
      console.error('Error updating student information:', err);
      alert('Failed to update student information. Please try again.');
    }
  };

  if (!student) return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-rose-200 to-blue-200">
      <p className="text-2xl text-purple-700" aria-live="polite">Loading student data…</p>
    </div>
  );

  return (
    <div style={profileContainerStyle}>
      <div style={profileCardStyle}>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Student Info</h3>
              {!isEditing && (
                <button onClick={() => setIsEditing(true)} style={editButtonStyle}>
                  <Edit style={{ width: 16, height: 16 }} />
                  <span>Edit</span>
                </button>
              )}
            </div>
            {isEditing ? (
              <>
                <div style={formGroupStyle}>
                  <label style={labelStyle}>Student ID</label>
                  <input
                    type="text"
                    value={student.studentId}
                    disabled
                    style={{ ...modalInputStyle, backgroundColor: '#F3F4F6' }}
                  />
                </div>
                <div style={formGroupStyle}>
                  <label style={labelStyle}>Grade</label>
                  <input
                    type="text"
                    value={editForm.grade}
                    onChange={e => setEditForm({ ...editForm, grade: e.target.value })}
                    style={modalInputStyle}
                  />
                </div>
                <div style={formGroupStyle}>
                  <label style={labelStyle}>Birthday</label>
                  <input
                    type="text"
                    value={editForm.birthday}
                    onChange={e => setEditForm({ ...editForm, birthday: e.target.value })}
                    style={modalInputStyle}
                    placeholder="e.g., MM/DD/YYYY"
                  />
                </div>
                <div style={formGroupStyle}>
                  <label style={labelStyle}>Campus</label>
                  <input
                    type="text"
                    value={editForm.campus}
                    onChange={e => setEditForm({ ...editForm, campus: e.target.value })}
                    style={modalInputStyle}
                  />
                </div>
                <div style={formGroupStyle}>
                  <label style={labelStyle}>Email</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                    style={modalInputStyle}
                  />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                  <button onClick={handleEditSave} style={saveButtonStyle}>
                    <Save style={{ width: 16, height: 16 }} />
                    <span>Save</span>
                  </button>
                  <button onClick={() => setIsEditing(false)} style={cancelEditButtonStyle}>
                    <XCircle style={{ width: 16, height: 16 }} />
                    <span>Cancel</span>
                  </button>
                </div>
              </>
            ) : (
              <>
                <p><strong>Student ID:</strong> {student.studentId}</p>
                <p><strong>Grade:</strong> {student.grade || '—'}</p>
                <p><strong>Birthday:</strong> {student.birthday || '—'}</p>
                <p><strong>Campus:</strong> {student.campus || '—'}</p>
                <p><strong>Email:</strong> {student.email || '—'}</p>
              </>
            )}
          </div>

          <div style={notesSectionStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Notes</h3>
              <button onClick={handleSaveNotes} style={saveButtonStyle}>
                <Save style={{ width: 16, height: 16 }} />
                <span>Save Notes</span>
              </button>
            </div>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              style={notesTextareaStyle}
              placeholder="Add general notes about the student..."
            />
          </div>

          <div style={eventsSectionStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
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
    </div>
  );
}
