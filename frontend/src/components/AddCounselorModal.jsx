// frontend/src/components/AddCounselorModal.jsx
import React from 'react';
import { X } from 'lucide-react';
import { modalOverlayStyle, modalStyle, modalHeaderStyle, modalBodyStyle, modalFooterStyle, formGroupStyle, labelStyle, modalInputStyle, cancelButtonStyle, addButtonStyle } from '../styles.js';

const AddCounselorModal = ({
  showCounselorModal,
  setShowCounselorModal,
  newCounselorName,
  setNewCounselorName,
  newCounselorEmail,
  setNewCounselorEmail,
  newCounselorCampus,
  setNewCounselorCampus,
  handleAddCounselor,
}) => (
  showCounselorModal && (
    <div style={modalOverlayStyle}>
      <div style={modalStyle}>
        <div style={modalHeaderStyle}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Add Counselor</h2>
          <button
            onClick={() => setShowCounselorModal(false)}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
            aria-label="Close modal"
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
  )
);

export default AddCounselorModal;
