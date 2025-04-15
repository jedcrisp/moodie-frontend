import React, { useState, useEffect } from 'react';
import { getFirestore, collection, query, orderBy, getDocs } from 'firebase/firestore';

// Helper function to calculate the average mood score over the last N days
function calcAverage(moodHistory, days) {
  // Filter moods within the last N days
  const today = new Date();
  const cutoffDate = new Date(today);
  cutoffDate.setDate(today.getDate() - days);

  const recent = moodHistory.filter((record) => new Date(record.date) >= cutoffDate);
  if (recent.length === 0) return 'N/A';
  const total = recent.reduce((sum, record) => sum + record.mood.score, 0);
  return (total / recent.length).toFixed(1);
}

// Helper function to get today's mood for a student
function getTodaysMood(moodHistory) {
  const today = new Date().toISOString().split('T')[0]; // e.g., "2025-04-15"
  const todayMood = moodHistory.find((record) => record.date === today);
  return todayMood ? todayMood.mood : { emoji: '❓', label: 'N/A', score: 0 };
}

export default function AdminDashboard({ user }) {
  const [averageDays, setAverageDays] = useState(5);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const db = getFirestore();

    const fetchData = async () => {
      try {
        // Fetch users with role 'student' from the current school
        const usersQuery = query(
          collection(db, 'schools', user.school, 'users'),
          where('role', '==', 'student')
        );
        const usersSnapshot = await getDocs(usersQuery);
        const studentList = usersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Fetch all moods for the school, ordered by timestamp
        const moodsQuery = query(
          collection(db, 'schools', user.school, 'moods'),
          orderBy('timestamp', 'desc')
        );
        const moodsSnapshot = await getDocs(moodsQuery);
        const moodsData = moodsSnapshot.docs.map((doc) => ({
          userId: doc.data().userId,
          date: doc.data().timestamp.toDate().toISOString().split('T')[0], // e.g., "2025-04-15"
          mood: {
            emoji: doc.data().mood.emoji,
            label: doc.data().mood.label,
            score: doc.data().mood.score,
          },
        }));

        // Aggregate mood data by student
        const studentsWithMoods = studentList.map((student) => {
          const studentMoods = moodsData.filter((mood) => mood.userId === student.id);
          return {
            id: student.id,
            name: student.name || 'Unknown',
            studentId: student.studentId || `S${student.id.slice(0, 3)}`, // Fallback studentId
            todaysMood: getTodaysMood(studentMoods),
            moodHistory: studentMoods,
          };
        });

        setStudents(studentsWithMoods);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user && user.school) {
      fetchData();
    }
  }, [user]);

  if (loading) {
    return <div className="p-4 text-center">Loading...</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold text-center mb-6">
        Counselor Dashboard for {user.school}
      </h1>

      <div className="mb-4 text-center">
        <label htmlFor="daysInput" className="mr-2 font-semibold">
          Show average over last
        </label>
        <input
          id="daysInput"
          type="number"
          min="1"
          max="30"
          value={averageDays}
          onChange={(e) => setAverageDays(Number(e.target.value))}
          className="border p-1 rounded w-20 text-center"
        />
        <span className="ml-2">days</span>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-gray-200">
              <th className="border p-2">Name</th>
              <th className="border p-2">Student ID</th>
              <th className="border p-2">Today's Mood</th>
              <th className="border p-2">
                Average Mood (Last {averageDays} Days)
              </th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr key={student.id} className="text-center">
                <td className="border p-2">{student.name}</td>
                <td className="border p-2">{student.studentId}</td>
                <td className="border p-2">
                  <span className="text-3xl">{student.todaysMood.emoji}</span>
                  <br />
                  <span>{student.todaysMood.label}</span>
                </td>
                <td className="border p-2">
                  {calcAverage(student.moodHistory, averageDays)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}