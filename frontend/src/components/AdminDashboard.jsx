import React, { useEffect, useState } from 'react';
import {
  getFirestore,
  collection,
  getDocs,
  setDoc,
  doc,
  addDoc,
  query,
  orderBy,
  limit
} from 'firebase/firestore';
import { getAuth, signOut } from 'firebase/auth';
import { LogOut } from 'lucide-react';
import clsx from 'clsx';

const moodScoreMap = {
  '😠': 1,
  '😟': 2,
  '🙂': 3,
  '😄': 4,
  '😁': 5
};

export default function AdminDashboard({ user }) {
  const [students, setStudents] = useState([]);
  const db = getFirestore();

  // Fetch existing students from Firestore
  const fetchStudentsWithMoods = async () => {
    const studentRef = collection(db, 'schools', user.school, 'students');
    const studentSnap = await getDocs(studentRef);

    const studentData = await Promise.all(
      studentSnap.docs.map(async (docSnap) => {
        const student = docSnap.data();
        const moodsRef = collection(db, 'schools', user.school, 'students', docSnap.id, 'moods');
        const moodsQuery = query(moodsRef, orderBy('date', 'desc'), limit(5));
        const moodSnap = await getDocs(moodsQuery);

        const moodEntries = moodSnap.docs.map((d) => d.data());
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

    const sorted = studentData.sort(
      (a, b) => (a.averageMood ?? 99) - (b.averageMood ?? 99)
    );
    setStudents(sorted);
  };

  useEffect(() => {
    fetchStudentsWithMoods().catch((err) => console.error('Error loading students:', err));
  }, []);

  const handleSignOut = async () => {
    await signOut(getAuth());
    window.location.reload();
  };

  // Upload CSV and populate Firestore
  const handleCSVUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target.result;
      const lines = text.split('\n').slice(1); // skip header

      for (const row of lines) {
        const [name, grade, studentId, birthday, moodsRaw] = row.split(',');
        if (!name || !studentId) continue;

        const studentRef = doc(db, 'schools', user.school, 'students', studentId.trim());
        await setDoc(studentRef, {
          name: name.trim(),
          grade: grade.trim(),
          studentId: studentId.trim(),
          birthday: birthday.trim()
        });

        const moods = moodsRaw.trim().split('');
        const moodsCol = collection(studentRef, 'moods');

        for (let i = 0; i < moods.length; i++) {
          const emoji = moods[i];
          const score = moodScoreMap[emoji] || 3;

          const moodDate = new Date();
          moodDate.setDate(moodDate.getDate() - i);

          await addDoc(moodsCol, {
            emoji,
            score,
            date: moodDate.toISOString().split('T')[0],
          });
        }
      }

      console.log('✅ CSV upload complete');
      fetchStudentsWithMoods(); // refresh UI
    };

    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-[#ffdee9] to-[#b5fffc]">
      {/* Header */}
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

      {/* Upload */}
      <div className="mb-6">
        <label className="block mb-2 text-gray-700 font-medium">Upload student CSV:</label>
        <input
          type="file"
          accept=".csv"
          onChange={handleCSVUpload}
          className="file:py-2 file:px-4 file:rounded-lg file:border file:border-gray-300 file:text-sm file:bg-white file:text-gray-700"
        />
      </div>

      {/* Student Mood Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {students.map((s, i) => (
          <div
            key={i}
            className={clsx(
              'p-4 rounded-xl shadow bg-white border-l-8',
              s.averageMood <= 2
                ? 'border-red-400'
                : s.averageMood <= 3
                ? 'border-yellow-400'
                : 'border-green-400'
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
