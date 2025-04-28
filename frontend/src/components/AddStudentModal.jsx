// frontend/src/components/AddStudentModal.jsx
import React from 'react';
import { X } from 'lucide-react';
import { modalOverlayStyle, modalStyle, modalHeaderStyle, modalBodyStyle, modalFooterStyle, formGroupStyle, labelStyle, modalInputStyle, cancelButtonStyle, addButtonStyle } from '../styles.js';

const AddStudentModal = ({
  showStudentModal,
  setShowStudentModal,
  newStudentName,
  setNewStudentName,
  newStudentId,
  setNewStudentId,
  newStudentEmail,
  setNewStudentEmail,
  newStudentGrade,
  setNewStudentGrade,
  newStudentBirthday,
  setNewStudentBirthday,
  newStudentCampus,
  setNewStudentCampus,
  availableCampuses,
  selectedCampus,
  handleAddStudent,
}) => (
  showStudentModal && (
    <div style={modalOverlayStyle}>
      <div style={modalStyle}>
        <div style={modalHeaderStyle}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Add Student</h2>
          <button
            onClick={() => setShowStudentModal(false)}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
            aria-label="Close modal"
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
  )
);

export default AddStudentModal;
