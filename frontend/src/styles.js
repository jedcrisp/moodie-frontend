// frontend/src/styles.js
// ... (existing styles remain unchanged)

// Updated styles for StudentProfile.jsx
export const profileContainerStyle = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '100vh', // Full viewport height
  background: 'linear-gradient(to bottom right, rgba(255,182,193,0.3), rgba(173,216,230,0.3))', // Match app background
  padding: '1rem',
};

export const profileCardStyle = {
  backgroundColor: 'white',
  borderRadius: '12px',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  padding: '1.5rem',
  maxWidth: '500px', // Constrain card width
  width: '100%',
  margin: '0 auto',
};

export const profileHeaderStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
  marginBottom: '1.5rem',
};

export const profileContentStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1.5rem',
};

export const infoSectionStyle = {
  padding: '0', // Remove extra padding since card has padding
};

export const eventsSectionStyle = {
  padding: '0',
};

export const notesSectionStyle = {
  padding: '0',
};

export const eventsListStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '0.5rem',
  marginTop: '0.5rem',
};

export const eventChipStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '4px 8px',
  borderRadius: '9999px',
  fontSize: '0.75rem',
  fontWeight: 500,
};

export const addEventButtonStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '4px 8px',
  backgroundColor: '#10B981',
  border: 'none',
  borderRadius: 9999,
  color: 'white',
  cursor: 'pointer',
  fontSize: '0.875rem',
};

export const editButtonStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '4px 8px',
  backgroundColor: '#3B82F6',
  border: 'none',
  borderRadius: 9999,
  color: 'white',
  cursor: 'pointer',
  fontSize: '0.875rem',
};

export const saveButtonStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '4px 8px',
  backgroundColor: '#10B981',
  border: 'none',
  borderRadius: 9999,
  color: 'white',
  cursor: 'pointer',
  fontSize: '0.875rem',
};

export const cancelEditButtonStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  padding: '4px 8px',
  backgroundColor: '#6B7280',
  border: 'none',
  borderRadius: 9999,
  color: 'white',
  cursor: 'pointer',
  fontSize: '0.875rem',
};

export const notesTextareaStyle = {
  padding: '0.5rem',
  border: '1px solid #D1D5DB',
  borderRadius: '4px',
  fontSize: '0.875rem',
  resize: 'vertical',
  minHeight: '100px',
  width: '100%',
};
