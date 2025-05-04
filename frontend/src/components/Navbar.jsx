// frontend/src/components/Navbar.jsx
import React from 'react';
import { Upload, LogOut, Smile, ArrowLeft, UserPlus } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { uploadButtonStyle, addCounselorButtonStyle, addStudentButtonStyle, downloadButtonStyle, moodSelectorStyle, backButtonStyle, signOutStyle, headerStyle, headerInnerStyle, brandingStyle, titleStyle, searchContainerStyle, searchInputStyle, campusSelectorStyle, controlsStyle } from '../styles.js';

const Navbar = ({
  schoolDisplayName,
  searchQuery,
  setSearchQuery,
  selectedCampus,
  setSelectedCampus,
  availableCampuses,
  user,
  uploading,
  handleCsvUpload,
  handleDownloadCsv,
  setShowCounselorModal,
  setShowStudentModal,
  handleSignOut,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const onMoodSelector = location.pathname.endsWith('/mood-selector');

  const handleMoodSelectorRedirect = () => navigate('mood-selector');

  return (
    <header style={headerStyle}>
      <div style={headerInnerStyle}>
        <div style={brandingStyle}>
          <h1 style={titleStyle}>{schoolDisplayName} Dashboard</h1>
          <div style={searchContainerStyle}>
            <input
              type="text"
              placeholder="Search by name or ID…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={searchInputStyle}
              aria-label="Search students by name or ID"
            />
            <select
              value={selectedCampus}
              onChange={e => setSelectedCampus(e.target.value)}
              style={campusSelectorStyle}
              aria-label="Select campus"
            >
              <option value="">All Campuses</option>
              {availableCampuses.map(campus => (
                <option
                  key={campus}
                  value={campus}
                  disabled={user?.campuses && !user.campuses.includes(campus)}
                >
                  {campus}
                  {user?.campuses && !user.campuses.includes(campus) ? ' (Restricted)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div style={controlsStyle}>
          <label style={uploadButtonStyle}>
            <Upload style={{ width: 20, height: 20 }} />
            <span>{uploading ? 'Uploading...' : 'Upload CSV'}</span>
            <input
              type="file"
              accept=".csv"
              style={{ display: 'none' }}
              onChange={handleCsvUpload}
              disabled={uploading}
            />
          </label>
          <button style={addCounselorButtonStyle} onClick={() => setShowCounselorModal(true)} aria-label="Add a counselor">
            <UserPlus style={{ width: 20, height: 20 }} />
            <span>Add Counselor</span>
          </button>
          <button style={addStudentButtonStyle} onClick={() => setShowStudentModal(true)} aria-label="Add a student">
            <UserPlus style={{ width: 20, height: 20 }} />
            <span>Add Student</span>
          </button>
          {onMoodSelector ? (
            <button style={backButtonStyle} onClick={() => navigate('/admin')} aria-label="Go back">
              <ArrowLeft style={{ width: 20, height: 20 }} />
              <span>Back</span>
            </button>
          ) : (
            <button style={moodSelectorStyle} onClick={handleMoodSelectorRedirect} aria-label="Go to mood selector">
              <Smile style={{ width: 20, height: 20 }} />
              <span>Mood Selector</span>
            </button>
          )}
          <button style={downloadButtonStyle} onClick={handleDownloadCsv} aria-label="Download CSV">
            <span>Download CSV</span>
          </button>
          <button style={signOutStyle} onClick={handleSignOut} aria-label="Sign out">
            <LogOut style={{ width: 20, height: 20 }} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
