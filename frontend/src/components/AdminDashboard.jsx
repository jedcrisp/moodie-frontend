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

      // Sort by averageMood ascending (nulls last) for vulnerability
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
    <div className="min-h-screen bg-gradient-to-br from-pink-200 via-purple-100 to-blue-200">
      {/* Header */}
      <header className="bg-white shadow-lg rounded-b-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
            Moodie Dashboard: {user.school}
          </h1>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-4 py-2 bg-pink-500 text-white rounded-full hover:bg-pink-600 transition transform hover:scale-105"
            title="Sign Out"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-xl text-purple-700 animate-pulse">Loading student moods...</p>
          </div>
        ) : students.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-xl text-gray-600">No students found. Add some to get started! 😊</p>
          </div>
        ) : (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Student Mood Cards
              <span className="text-sm font-normal block text-gray-600">
                Sorted to show students who need support first 🌟
              </span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {students.map((student) => (
                <div
                  key={student.id}
                  className={clsx(
                    'bg-white rounded-2xl shadow-xl p-6 transition transform hover:scale-105 hover:shadow-2xl',
                    student.averageMood !== null && student.averageMood <= 2
                      ? 'border-4 border-red-400'
                      : student.averageMood !== null && student.averageMood <= 3
                      ? 'border-4 border-yellow-400'
                      : 'border-4 border-green-400'
                  )}
                >
                  <h3 className="text-xl font-semibold text-purple-700 mb-2">
                    {student.name}
                  </h3>
                  <div className="space-y-2 text-gray-700">
                    <p className="text-sm">
                      <span className="font-medium">ID:</span>{' '}
                      {student.studentId || 'N/A'}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Grade:</span>{' '}
                      {student.grade || 'N/A'}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Birthday:</span>{' '}
                      {student.birthday || 'N/A'}
                    </p>
                    <div>
                      <p className="text-sm font-medium mb-1">Last 5 Moods:</p>
                      <div className="flex gap-2 text-3xl">
                        {student.moods.length > 0 ? (
                          student.moods.map((mood, idx) => (
                            <span
                              key={idx}
                              className="transition transform hover:scale-125"
                              title={mood.date}
                            >
                              {mood.emoji}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm text-gray-500">
                            No moods yet 😴
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-sm font-medium text-gray-800">
                      Average Mood:{' '}
                      <span
                        className={clsx(
                          student.averageMood !== null && student.averageMood <= 2
                            ? 'text-red-600'
                            : student.averageMood !== null && student.averageMood <= 3
                            ? 'text-yellow-600'
                            : 'text-green-600'
                        )}
                      >
                        {student.averageMood !== null
                          ? student.averageMood.toFixed(2)
                          : 'N/A'}
                      </span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
