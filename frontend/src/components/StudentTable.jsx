import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { Trash2, Calendar } from 'lucide-react';
import { tableContainerStyle, tableStyle, theadStyle, thStyle, tdStyle, linkStyle, deleteButtonStyle, tooltipStyle, tooltipTextStyle } from '../styles.js';

const StudentTable = ({ filteredStudents, deleteStudent }) => (
  <div style={tableContainerStyle}>
    <table style={tableStyle}>
      <thead style={theadStyle}>
        <tr>
          {['Name', 'Student ID', 'Grade', 'Birthday', 'Last 5 Moods', 'Average Mood', 'DELETE'].map(h => (
            <th key={h} style={thStyle}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {filteredStudents.length === 0 ? (
          <tr>
            <td colSpan="7" style={{ ...tdStyle, textAlign: 'center' }}>
              No students found.
            </td>
          </tr>
        ) : (
          filteredStudents.map(s => (
            <tr
              key={s.id}
              style={{
                borderLeft:
                  s.averageMood <= 2
                    ? '4px solid #EF4444'
                    : s.averageMood <= 3
                    ? '4px solid #FACC15'
                    : '4px solid #22C55E',
              }}
            >
              <td style={tdStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Link to={`/admin/students/${s.id}`} style={linkStyle}>
                    {s.name}
                  </Link>
                  {s.recentLifeEvent && s.recentLifeEvent.date && (
                    <div style={tooltipStyle}>
                      <Calendar style={{ width: 14, height: 14, color: '#EC4899' }} />
                      <span style={tooltipTextStyle}>
                        Recent Life Event: {s.recentLifeEvent.type} (
                        {s.recentLifeEvent.date.toDate
                          ? s.recentLifeEvent.date.toDate().toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' })
                          : 'Invalid Date'})
                      </span>
                    </div>
                  )}
                </div>
              </td>
              <td style={tdStyle}>{s.studentId}</td>
              <td style={tdStyle}>{s.grade || '-'}</td>
              <td style={tdStyle}>{s.birthday || '-'}</td>
              <td style={{ ...tdStyle, fontSize: '1.5rem' }}>
                {s.moods && s.moods.length > 0 ? s.moods.map((m, i) => <span key={i}>{m.emoji}</span>) : '—'}
              </td>
              <td style={tdStyle}>
                {s.averageMood != null ? s.averageMood.toFixed(2) : '—'}
              </td>
              <td style={tdStyle}>
                <button onClick={() => deleteStudent(s.id)} style={deleteButtonStyle}>
                  <Trash2 style={{ width: 20, height: 20 }} />
                </button>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
);

StudentTable.propTypes = {
  filteredStudents: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      studentId: PropTypes.string.isRequired,
      grade: PropTypes.string,
      birthday: PropTypes.string,
      moods: PropTypes.arrayOf(
        PropTypes.shape({
          emoji: PropTypes.string,
          score: PropTypes.number,
        })
      ),
      averageMood: PropTypes.number,
      recentLifeEvent: PropTypes.shape({
        type: PropTypes.string,
        date: PropTypes.any, // Firestore Timestamp
      }),
    })
  ).isRequired,
  deleteStudent: PropTypes.func.isRequired,
};

export default StudentTable;
