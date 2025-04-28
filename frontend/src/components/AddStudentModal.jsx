// frontend/src/components/AddStudentModal.jsx
import React from 'react';
import { X } from 'lucide-react';

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
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Add Student</h2>
          <button
            onClick={() => setShowStudentModal(false)}
            className="cancel-button"
            style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
            aria-label="Close modal"
          >
            <X className="icon" style={{ width: 20, height: 20 }} />
          </button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="label">Name *</label>
            <input
              type="text"
              value={newStudentName}
              onChange={e => setNewStudentName(e.target.value)}
              className="modal-input"
              placeholder="Enter student name"
              required
            />
          </div>
          <div className="form-group">
            <label className="label">Student ID *</label>
            <input
              type="text"
              value={newStudentId}
              onChange={e => setNewStudentId(e.target.value)}
              className="modal-input"
              placeholder="Enter student ID"
              required
            />
          </div>
          <div className="form-group">
            <label className="label">Email *</label>
            <input
              type="email"
              value={newStudentEmail}
              onChange={e => setNewStudentEmail(e.target.value)}
              className="modal-input"
              placeholder="Enter student email"
              required
            />
          </div>
          <div className="form-group">
            <label className="label">Grade</label>
            <input
              type="text"
              value={newStudentGrade}
              onChange={e => setNewStudentGrade(e.target.value)}
              className="modal-input"
              placeholder="Enter grade (e.g., 9)"
            />
          </div>
          <div className="form-group">
            <label className="label">Birthday</label>
            <input
              type="text"
              value={newStudentBirthday}
              onChange={e => setNewStudentBirthday(e.target.value)}
              className="modal-input"
              placeholder="Enter birthday (e.g., MM/DD/YYYY)"
            />
          </div>
          <div className="form-group">
            <label className="label">Campus *</label>
            <select
              value={newStudentCampus}
              onChange={e => setNewStudentCampus(e.target.value)}
              className="modal-input"
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
        <div className="modal-footer">
          <button
            onClick={() => setShowStudentModal(false)}
            className="cancel-button"
          >
            Cancel
          </button>
          <button onClick={handleAddStudent} className="add-button">
            Add Student
          </button>
        </div>
      </div>
    </div>
  )
);

export default AddStudentModal;
