import React, { useEffect, useState } from 'react';
import {
  getFirestore,
  collection,
  getDocs,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { getAuth, signOut } from 'firebase/auth';
import { LogOut } from 'lucide-react';
import clsx from 'clsx';

const moodScoreMap = {
  '😠': 1,
  '😟': 2,
  '🙂': 3,
  '😄': 4,
  '😁': 5,
};

export default function AdminDashboard({ user }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const db = getFirestore();

  const fetchStudentsWithMoods = async () => {
    try {
      const studentRef = collection(db, 'schools', user.school, 'students');
      const studentSnap = await getDocs(studentRef);

      const studentData = await Promise.all(
        studentSnap.docs.map(async (docSnap) => {
          const student = docSnap.data();
          const moodsRef = collection(
            db,
            'schools',
            user.school,
            'students',
            docSnap.id,
            'moods'
          );
          const moodsQuery = query(moodsRef, orderBy('date', 'desc'), limit(5));
          const moodSnap = await getDocs(moodsQuery);

          const moodEntries = moodSnap.docs.map((d) => d.data());

          const averageMood =
            moodEntries.length > 0
              ? moodEntries.reduce((acc, m) => acc + (m.score || 3), 0) /
                moodEntries.length
              : null;

          return {
            id: docSnap.id,
            ...student,
            moods: moodEntries,
            averageMood,
          };
        })
      );

      // Sort by averageMood ascending (nulls last), prioritizing vulnerable students
      const sorted = studentData.sort(
        (a, b) =>
          (a.averageMood === null ? 99 : a.averageMood) -
          (b.averageMood === null ? 99 : b.averageMood)
      );
      setStudents(sorted);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.school) {
      fetchStudentsWithMoods();
    }
  }, [user]);

  const handleSignOut = async () => {
    await signOut(getAuth());
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Counselor Dashboard for{' '}
            <span className="text-indigo-600">{user.school}</span>
          </h1>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
            title="Sign Out"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="text-center py-10">
            <p className="text-lg text-gray-600">Loading students...</p>
          </div>
        ) : students.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-lg text-gray-600">No students found.</p>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h2 className="text-lg font-medium text-gray-900">Student Mood Overview</h2>
              <p className="mt-1 text-sm text-gray-600">
                Students are sorted by average mood (lowest first) to highlight those who may need support.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Name
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Student ID
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Grade
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Birthday
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Last 5 Moods
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Average Mood
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students.map((student) => (
                    <tr
                      key={student.id}
                      className={clsx(
                        student.averageMood !== null && student.averageMood <= 2
                          ? 'border-l-4 border-red-500'
                          : student.averageMood !== null && student.averageMood <= 3
                          ? 'border-l-4 border-yellow-500'
                          : 'border-l-4 border-green-500'
                      )}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {student.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {student.studentId || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {student.grade || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {student.birthday || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex gap-2 text-2xl">
                          {student.moods.length > 0 ? (
                            student.moods.map((mood, idx) => (
                              <span key={idx} title={mood.date}>
                                {mood.emoji}
                              </span>
                            ))
                          ) : (
                            'No moods recorded'
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {student.averageMood !== null
                          ? student.averageMood.toFixed(2)
                          : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
