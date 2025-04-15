import React, { useEffect, useState } from 'react';
import { getFirestore, collection, getDocs, doc, getDoc, query, orderBy, limit } from 'firebase/firestore';
import { getAuth, signOut } from 'firebase/auth';
import { LogOut } from 'lucide-react';
import clsx from 'clsx';

const moodScoreMap = {
  '😠': 1, // Angry
  '😟': 2, // Sad
  '🙂': 3, // Okay
  '😄': 4, // Happy
  '😁': 5  // Excited
};

export default function AdminDashboard({ user }) {
  const [students, setStudents] = useState([]);
  const db = getFirestore();

  const fetchStudentsWithMoods = async () => {
    const studentRef = collection(db, 'schools', user.school, 'students');
    const studentSnap = await getDocs(studentRef);

    const studentData = await Promise.all(
      studentSnap.docs.map(async (docSnap) => {
        const student = docSnap.data();
        const moodsRef = collection(db, 'schools', user.school, 'students', docSnap.id, 'moods');
        const moodsQuery = query(moodsRef, orderBy('date', 'desc'), limit(5));
        const moodSnap = await getDocs(moodsQuery);

        const moodEntries = moodSnap.docs.map(d => d.data());
        const averageMood =
          moodEntries.length > 0
            ? moodEntries.reduce((acc, m) => acc + (m.score || 3), 0) / moodEntries.length
            : null;

        return {
          id: docSnap.id,
          ...student,
          moods: moodEntries,
          averageMood
        };
      })
    );

    const sorted = studentData.sort((a, b) => (a.averageMood ?? 99) - (b.averageMood ?? 99));
    setStudents(sorted);
  };

  useEffect(() => {
    fetchStudentsWithMoods();
  }, []);

  const handleSignOut = async () => {
    await signOut(getAuth());
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 to-blue-100 p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          Counselor Dashboard for <span className="text-indigo-600">{user.school}</span>
        </h1>
        <button
          onClick={handleSignOut}
          className="bg-white p-2 rounded-lg shadow hover:bg-red-100 transition"
        >
          <LogOut className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {students.map((s, i) => (
          <div
            key={i}
            className={clsx(
              'p-4 rounded-xl shadow bg-white border-l-8',
              s.averageMood <= 2 ? 'border-red-400' :
              s.averageMood <= 3 ? 'border-yellow-400' :
              'border-green-400'
            )}
          >
            <h2 className="text-xl font-semibold text-indigo-800 mb-1">{s.name}</h2>
            <p className="text-sm text-gray-600">ID: {s.studentId}</p>
            <p className="text-sm text-gray-600">Grade: {s.grade}</p>
            <p className="text-sm text-gray-600">Birthday: {s.birthday}</p>

            <div className="mt-3">
              <p className="text-sm font-medium text-gray-700 mb-1">Last 5 Moods:</p>
              <div className="flex gap-2 text-2xl">
                {s.moods.map((mood, idx) => (
                  <span key={idx}>{mood.emoji}</span>
                ))}
              </div>
            </div>

            {s.averageMood !== null && (
              <p className="mt-2 text-sm text-gray-500">Avg mood: {s.averageMood.toFixed(2)}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
