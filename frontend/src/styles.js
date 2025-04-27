export const containerStyle = {
  width: '100vw',
  height: '100vh',
  display: 'flex',
  flexDirection: 'column',
  background: 'linear-gradient(to bottom right, rgba(255,182,193,0.3), rgba(173,216,230,0.3))',
};

export const headerStyle = {
  padding: '0.5rem 1rem',
  background: 'linear-gradient(to right, #ede9fe, #fce7f3)',
  boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
};

export const headerInnerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

export const brandingStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
};

export const titleStyle = {
  fontSize: '1.75rem',
  fontWeight: 700,
  background: 'linear-gradient(to right, #7C3AED, #EC4899)',
  WebkitBackgroundClip: 'text',
  color: 'transparent',
};

export const controlsStyle = {
  display: 'flex',
  gap: '0.75rem',
};

export const iconStyle = { width: 20, height: 20 };

export const uploadButtonStyle = {
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

export const addCounselorButtonStyle = {
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

export const addStudentButtonStyle = {
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

export const downloadButtonStyle = {
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

export const moodSelectorStyle = {
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

export const backButtonStyle = {
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

export const signOutStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '6px 12px',
  backgroundColor: '#9CA3AF',
  border: 'none',
  borderRadius: 9999,
  color: 'white',
  cursor: 'pointer',
};

export const searchContainerStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
};

export const searchInputStyle = {
  padding: '0.5rem 1rem',
  border: '1px solid #D1D5DB',
  borderRadius: '9999px',
  width: '200px',
};

export const campusSelectorStyle = {
  padding: '0.5rem',
  border: '1px solid #D1D5DB',
  borderRadius: '4px',
  backgroundColor: 'white',
  cursor: 'pointer',
};

export const mainStyle = { flex: 1, overflow: 'auto', padding: '1rem' };

export const loadingStyle = {
  fontSize: '1.25rem',
  color: '#7C3AED',
  textAlign: 'center',
  marginTop: 40,
};

export const tableContainerStyle = { width: '100%', overflowX: 'auto' };

export const tableStyle = { width: '100%', borderCollapse: 'collapse' };

export const theadStyle = {
  background: 'linear-gradient(to right, #EDE9FE, #FCE7F3)',
  position: 'sticky',
  top: 0,
};

export const thStyle = {
  padding: '8px 12px',
  textAlign: 'left',
  fontSize: '0.75rem',
  fontWeight: 600,
  color: '#7C3AED',
  textTransform: 'uppercase',
  borderBottom: '1px solid #D1D5DB',
};

export const tdStyle = {
  padding: '8px 12px',
  fontSize: '0.875rem',
  color: '#4B5563',
  borderBottom: '1px solid #E5E7EB',
};

export const linkStyle = {
  color: '#3B82F6',
  textDecoration: 'underline',
};

export const deleteButtonStyle = {
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
};

export const tooltipStyle = {
  position: 'relative',
  display: 'inline-block',
};

export const tooltipTextStyle = {
  visibility: 'hidden',
  width: '200px',
  backgroundColor: '#111827',
  color: 'white',
  textAlign: 'center',
  borderRadius: '4px',
  padding: '4px 8px',
  position: 'absolute',
  zIndex: 1,
  bottom: '125%',
  left: '50%',
  transform: 'translateX(-50%)',
  fontSize: '0.75rem',
  opacity: 0,
  transition: 'opacity 0.3s',
};

export const modalOverlayStyle = {
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

export const modalStyle = {
  backgroundColor: 'white',
  padding: '1.5rem',
  borderRadius: '8px',
  width: '400px',
  maxWidth: '90%',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
};

export const modalHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '1rem',
};

export const modalBodyStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
};

export const modalFooterStyle = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '0.5rem',
  marginTop: '1rem',
};

export const formGroupStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.25rem',
};

export const labelStyle = {
  fontSize: '0.875rem',
  fontWeight: 500,
  color: '#4B5563',
};

export const modalInputStyle = {
  padding: '0.5rem',
  border: '1px solid #D1D5DB',
  borderRadius: '4px',
  fontSize: '0.875rem',
};

export const cancelButtonStyle = {
  padding: '0.5rem 1rem',
  backgroundColor: '#6B7280',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
};

export const addButtonStyle = {
  padding: '0.5rem 1rem',
  backgroundColor: '#3B82F6',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
};