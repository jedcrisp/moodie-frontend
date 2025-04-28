// frontend/src/components/StudentProfile.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getFirestore, doc, getDoc, collection, getDocs, addDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { ArrowLeft, X, Calendar, UserPlus, Edit, Save, XCircle, Trash2 } from 'lucide-react';
import { profileContainerStyle, profileCardStyle, profileHeaderStyle, profileContentStyle, infoSectionStyle, eventsSectionStyle, notesSectionStyle, eventsListStyle, eventChipStyle, addEventButtonStyle, editButtonStyle, saveButtonStyle, cancelEditButtonStyle, modalOverlayStyle, modalStyle, modalHeaderStyle, modalBodyStyle, modalFooterStyle, formGroupStyle, labelStyle, modalInputStyle, cancelButtonStyle, addButtonStyle, backButtonStyle, notesTextareaStyle, studentInfoGridStyle, eventActionButtonStyle } from '../styles.js';

export default function StudentProfile({ user }) {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const db = getFirestore();
  const [student, setStudent] = useState(null);
  const [lifeEvents, setLifeEvents] = useState([]);
  const [showEventModal, setShowEventModal] = useState(false);
  const [isEditingEvent, setIsEditingEvent] = useState(false);
  const [currentEventId, setCurrentEventId] = useState(null);
  const [newEventType, setNewEventType] = useState('');
  const [newEventDate, setNewEventDate] = useState(new Date().toISOString().split('T')[0]); // Initialize with today's date
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
        const events = eventsSnap.docs.map(doc => {
          const eventData = { id: doc.id, ...doc.data() };
          // Ensure event.date is a valid Date object
          if (eventData.date && typeof eventData.date.toDate === 'function') {
            eventData.date = eventData.date.toDate();
          } else {
            console.warn(`Invalid date for event ${eventData.id}:`, eventData.date);
            eventData.date = new Date(); // Fallback to current date
          }
          return eventData;
        });
        events.sort((a, b) => b.date - a.date);
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

  const handleAddOrEditEvent = async () => {
    if (!newEventType || !newEventDate) {
      alert('Please select an event type and date.');
      return;
    }
    const parsedDate = new Date(newEventDate);
    if (isNaN(parsedDate.getTime())) {
      alert('Please enter a valid date.');
      return;
    }
    if (newEventNotes.length > 100) {
      alert('Notes cannot exceed 100 characters.');
      return;
    }
    try {
      const eventData = {
        type: newEventType,
        date: parsedDate,
        notes: newEventNotes.trim(),
        createdAt: serverTimestamp(),
      };
      if (isEditingEvent) {
        // Edit existing event
        await setDoc(doc(db, 'schools', user.school, 'students', studentId, 'lifeEvents', currentEventId), eventData, { merge: true });
        setLifeEvents(prev =>
          prev.map(event =>
            event.id === currentEventId ? { ...event, ...eventData, date: parsedDate } : event
          )
        );
        alert('Life event updated successfully.');
      } else {
        // Add new event
        const eventRef = await addDoc(
          collection(db, 'schools', user.school, 'students', studentId, 'lifeEvents'),
          eventData
        );
        setLifeEvents(prev => [
          { id: eventRef.id, ...eventData, date: parsedDate },
          ...prev,
        ]);
        alert('Life event added successfully.');
      }
      setShowEventModal(false);
      setIsEditingEvent(false);
      setCurrentEventId(null);
      setNewEventType('');
      setNewEventDate(new Date().toISOString().split('T')[0]);
      setNewEventNotes('');
    } catch (err) {
      console.error('Error saving life event:', err);
      alert('Failed to save life event. Please try again.');
    }
  };

  const handleEditEvent = (event) => {
    setIsEditingEvent(true);
    setCurrentEventId(event.id);
    setNewEventType(event.type);
    // Safely convert event.date to YYYY-MM-DD format
    const eventDate = event.date instanceof Date && !isNaN(event.date.getTime())
      ? event.date.toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0]; // Fallback to today if invalid
    setNewEventDate(eventDate);
    setNewEventNotes(event.notes || '');
    setShowEventModal(true);
  };

  const handleDeleteEvent = async (eventId) => {
    if (window.confirm('Are you sure you want to delete this life event?')) {
      try {
        await deleteDoc(doc(db, 'schools', user.school, 'students', studentId, 'lifeEvents', eventId));
        setLifeEvents(prev => prev.filter(event => event.id !== eventId));
        alert('Life event deleted successfully.');
      } catch (err) {
        console.error('Error deleting life event:', err);
        alert('Failed to delete life event. Please try again.');
      }
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
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{isEditingEvent ? 'Edit Life Event' : 'Add Life Event'}</h3>
                <button
                  onClick={() => {
                    setShowEventModal(false);
                    setIsEditingEvent(false);
                    setCurrentEventId(null);
                    setNewEventType('');
                    setNewEventDate(new Date().toISOString().split('T')[0]);
                    setNewEventNotes('');
                  }}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
                  aria-label="Close modal"
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
                    aria-label="Life event notes"
                  />
                </div>
              </div>
              <div style={modalFooterStyle}>
                <button onClick={() => {
                  setShowEventModal(false);
                  setIsEditingEvent(false);
                  setCurrentEventId(null);
                  setNewEventType('');
                  setNewEventDate(new Date().toISOString().split('T')[0]);
                  setNewEventNotes('');
                }} style={cancelButtonStyle} aria-label="Cancel">
                  Cancel
                </button>
                <button onClick={handleAddOrEditEvent} style={addButtonStyle} aria-label={isEditingEvent ? "Save edited life event" : "Add life event"}>
                  {isEditingEvent ? 'Save' : 'Add Event'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div style={profileHeaderStyle}>
          <button onClick={() => navigate('/admin')} style={backButtonStyle} aria-label="Go back">
            <ArrowLeft style={{ width: 20, height: 20 }} />
            <span>Back</span>
          </button>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>{student.name}</h2>
        </div>
        <div style={profileContentStyle}>
          <div style={infoSectionStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#1F2937' }}>Student Info</h3>
              {!isEditing && (
                <button onClick={() => setIsEditing(true)} style={editButtonStyle} aria-label="Edit student information">
                  <Edit style={{ width: 16, height: 16 }} />
                  <span>Edit</span>
                </button>
              )}
            </div>
            {isEditing ? (
              <>
                <div style={formGroupStyle}>
                  <label style={{ ...labelStyle, fontSize: '0.75rem' }}>Student ID</label>
                  <input
                    type="text"
                    value={student.studentId}
                    disabled
                    style={{ ...modalInputStyle, backgroundColor: '#F3F4F6', fontSize: '0.875rem' }}
                  />
                </div>
                <div style={formGroupStyle}>
                  <label style={{ ...labelStyle, fontSize: '0.75rem' }}>Grade</label>
                  <input
                    type="text"
                    value={editForm.grade}
                    onChange={e => setEditForm({ ...editForm, grade: e.target.value })}
                    style={{ ...modalInputStyle, fontSize: '0.875rem' }}
                  />
                </div>
                <div style={formGroupStyle}>
                  <label style={{ ...labelStyle, fontSize: '0.75rem' }}>Birthday</label>
                  <input
                    type="text"
                    value={editForm.birthday}
                    onChange={e => setEditForm({ ...editForm, birthday: e.target.value })}
                    style={{ ...modalInputStyle, fontSize: '0.875rem' }}
                    placeholder="e.g., MM/DD/YYYY"
                  />
                </div>
                <div style={formGroupStyle}>
                  <label style={{ ...labelStyle, fontSize: '0.75rem' }}>Campus</label>
                  <input
                    type="text"
                    value={editForm.campus}
                    onChange={e => setEditForm({ ...editForm, campus: e.target.value })}
                    style={{ ...modalInputStyle, fontSize: '0.875rem' }}
                  />
                </div>
                <div style={formGroupStyle}>
                  <label style={{ ...labelStyle, fontSize: '0.75rem' }}>Email</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                    style={{ ...modalInputStyle, fontSize: '0.875rem' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <button onClick={handleEditSave} style={saveButtonStyle} aria-label="Save changes">
                    <Save style={{ width: 16, height: 16 }} />
                    <span>Save</span>
                  </button>
                  <button onClick={() => setIsEditing(false)} style={cancelEditButtonStyle} aria-label="Cancel editing">
                    <XCircle style={{ width: 16, height: 16 }} />
                    <span>Cancel</span>
                  </button>
                </div>
              </>
            ) : (
              <div style={studentInfoGridStyle}>
                <p><strong style={{ color: '#1F2937' }}>Student ID:</strong> {student.studentId}</p>
                <p><strong style={{ color: '#1F2937' }}>Grade:</strong> {student.grade || '—'}</p>
                <p><strong style={{ color: '#1F2937' }}>Birthday:</strong> {student.birthday || '—'}</p>
                <p><strong style={{ color: '#1F2937' }}>Campus:</strong> {student.campus || '—'}</p>
                <p><strong style={{ color: '#1F2937' }}>Email:</strong> {student.email || '—'}</p>
              </div>
            )}
          </div>

          <div style={notesSectionStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#1F2937' }}>Notes</h3>
              <button onClick={handleSaveNotes} style={saveButtonStyle} aria-label="Save notes">
                <Save style={{ width: 16, height: 16 }} />
                <span>Save Notes</span>
              </button>
            </div>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              style={notesTextareaStyle}
              placeholder="Add general notes about the student..."
              aria-label="General notes about the student"
            />
          </div>

          <div style={eventsSectionStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#1F2937' }}>Life Events</h3>
              <button onClick={() => {
                setIsEditingEvent(false);
                setCurrentEventId(null);
                setNewEventType('');
                setNewEventDate(new Date().toISOString().split('T')[0]);
                setNewEventNotes('');
                setShowEventModal(true);
              }} style={addEventButtonStyle} aria-label="Add a life event">
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
                  const eventDate = event.date instanceof Date && !isNaN(event.date.getTime())
                    ? event.date
                    : new Date(); // Fallback to current date if invalid
                  return (
                    <div key={event.id} style={{ display: 'flex', alignItems: 'center' }}>
                      <div style={chipStyle}>
                        <span style={{ marginRight: '4px' }}>
                          {eventType.category === 'emotional' ? '❤️' : eventType.category === 'relocation' ? '🏠' : '📅'}
                        </span>
                        {event.type} ({eventDate.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })})
                        {event.notes && <span style={{ marginLeft: '4px', fontStyle: 'italic' }}>- {event.notes}</span>}
                      </div>
                      <button
                        onClick={() => handleEditEvent(event)}
                        style={eventActionButtonStyle}
                        aria-label={`Edit life event: ${event.type}`}
                      >
                        <Edit style={{ width: 16, height: 16, color: '#3B82F6' }} />
                      </button>
                      <button
                        onClick={() => handleDeleteEvent(event.id)}
                        style={eventActionButtonStyle}
                        aria-label={`Delete life event: ${event.type}`}
                      >
                        <Trash2 style={{ width: 16, height: 16, color: '#EF4444' }} />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p style={{ color: '#4B5563', fontStyle: 'italic', fontSize: '0.875rem' }}>No life events recorded.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
