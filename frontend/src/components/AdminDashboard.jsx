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
    <div className="min-h-screen bg-gradient-to-br from-pink-200 to-blue-200">
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-xl text-purple-700 animate-pulse">
              Loading student moods... 🌈
            </p>
          </div>
        ) : students.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-xl text-gray-600">
              No students found. Let’s add some smiles! 😊
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {students.map((student) => (
              <div
                key={student.id}
                className={clsx(
                  'grid grid-cols-6 gap-4 items-center p-4 rounded-xl shadow-sm border bg-white',
                  student.averageMood !== null && student.averageMood <= 2
                    ? 'border-red-300'
                    : student.averageMood !== null && student.averageMood <= 3
                    ? 'border-yellow-300'
                    : 'border-green-300'
                )}
              >
                <div className="text-sm font-medium text-gray-900 col-span-1">{student.name}</div>
                <div className="text-sm text-gray-600 col-span-1">{student.studentId || 'N/A'}</div>
                <div className="text-sm text-gray-600 col-span-1">{student.grade || 'N/A'}</div>
                <div className="text-sm text-gray-600 col-span-1">{student.birthday || 'N/A'}</div>
                <div className="flex gap-2 text-2xl col-span-1">
                  {student.moods.length > 0 ? (
                    student.moods.map((mood, idx) => (
                      <span key={idx} className="hover:scale-110 transition">{mood.emoji}</span>
                    ))
                  ) : (
                    <span className="text-sm text-gray-400">No moods yet</span>
                  )}
                </div>
                <div
                  className={clsx(
                    'text-sm font-semibold col-span-1',
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
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
