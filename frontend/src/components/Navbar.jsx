// frontend/src/components/Navbar.jsx
import React from 'react';
import { Upload, LogOut, Smile, ArrowLeft, UserPlus } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

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
    <header className="header">
      <div className="header-inner">
        <div className="branding">
          <h1 className="title">{schoolDisplayName} Dashboard</h1>
          <div className="search-container">
            <input
              type="text"
              placeholder="Search by name or ID…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="search-input"
              aria-label="Search students by name or ID"
            />
            <select
              value={selectedCampus}
              onChange={e => setSelectedCampus(e.target.value)}
              className="campus-selector"
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
        <div className="controls">
          <label className="upload-button">
            <Upload className="icon" />
            <span>{uploading ? 'Uploading...' : 'Upload CSV'}</span>
            <input
              type="file"
              accept=".csv"
              style={{ display: 'none' }}
              onChange={handleCsvUpload}
              disabled={uploading}
            />
          </label>
          <button className="add-counselor-button" onClick={() => setShowCounselorModal(true)} aria-label="Add a counselor">
            <UserPlus className="icon" />
            <span>Add Counselor</span>
          </button>
          <button className="add-student-button" onClick={() => setShowStudentModal(true)} aria-label="Add a student">
            <UserPlus className="icon" />
            <span>Add Student</span>
          </button>
          {onMoodSelector ? (
            <button className="back-button" onClick={() => navigate('/admin')} aria-label="Go back">
              <ArrowLeft className="icon" />
              <span>Back</span>
            </button>
          ) : (
            <button className="mood-selector-button" onClick={handleMoodSelectorRedirect} aria-label="Go to mood selector">
              <Smile className="icon" />
              <span>Mood Selector</span>
            </button>
          )}
          <button className="download-button" onClick={handleDownloadCsv} aria-label="Download CSV">
            <span>Download CSV</span>
          </button>
          <button className="sign-out-button" onClick={handleSignOut} aria-label="Sign out">
            <LogOut className="icon" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
