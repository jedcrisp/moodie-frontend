// frontend/src/components/StudentTable.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Trash2, Calendar } from 'lucide-react';

const StudentTable = ({ filteredStudents, deleteStudent }) => (
  <div className="table-container">
    <table className="table">
      <thead className="thead">
        <tr>
          {['Name', 'Student ID', 'Grade', 'Birthday', 'Last 5 Moods', 'Average Mood', 'DELETE'].map(h => (
            <th key={h} className="th">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {filteredStudents.map(s => (
          <tr
            key={s.id || Math.random()}
            style={{
              borderLeft:
                s.averageMood <= 2
                  ? '4px solid #EF4444'
                  : s.averageMood <= 3
                  ? '4px solid #FACC15'
                  : '4px solid #22C55E',
            }}
          >
            <td className="td">
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {s.id ? (
                  <Link to={`/admin/students/${s.id}`} className="link">
                    {s.name || 'Unknown'}
                  </Link>
                ) : (
                  <span style={{ color: '#EF4444' }}>{s.name || 'Unknown (Invalid ID)'}</span>
                )}
                {s.recentLifeEvent && (
                  <div className="tooltip">
                    <Calendar className="icon" style={{ width: 14, height: 14, color: '#EC4899' }} aria-label={`Recent Life Event: ${s.recentLifeEvent.type}`} />
                    <span className="tooltip-text">
                      Recent Life Event: {s.recentLifeEvent.type} (
                      {s.recentLifeEvent.date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' })})
                    </span>
                  </div>
                )}
              </div>
            </td>
            <td className="td">{s.studentId}</td>
            <td className="td">{s.grade}</td>
            <td className="td">{s.birthday}</td>
            <td className="td" style={{ fontSize: '1.5rem' }}>
              {s.moods.length > 0 ? s.moods.map((m, i) => <span key={i}>{m.emoji}</span>) : '—'}
            </td>
            <td className="td">
              {s.averageMood != null ? s.averageMood.toFixed(2) : '—'}
            </td>
            <td className="td">
              <button onClick={() => deleteStudent(s.id)} className="delete-button" disabled={!s.id}>
                <Trash2 className="icon" style={{ width: 20, height: 20 }} />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default StudentTable;
