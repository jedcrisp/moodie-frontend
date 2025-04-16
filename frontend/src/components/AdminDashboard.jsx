import React, { useEffect, useState } from 'react';
import {
  getFirestore,
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  doc,
  setDoc,
} from 'firebase/firestore';
import { getAuth, signOut } from 'firebase/auth';
import { LogOut, Upload, Smile } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import Papa from 'papaparse';

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
  const navigate = useNavigate();

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

  const handleCsvUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      complete: async (results) => {
        const rows = results?.data;
        if (!Array.isArray(rows)) {
          console.error("Invalid CSV format: missing or malformed data");
          return;
        }

        for (const row of rows) {
          if (!row.studentId || !row.name) continue;
          const studentRef = doc(db, 'schools', user.school, 'students', row.studentId);
          await setDoc(studentRef, {
            name: row.name,
            studentId: row.studentId,
            grade: row.grade,
            birthday: row.birthday,
          });
        }

        fetchStudentsWithMoods();
      },
      error: (err) => {
        console.error("CSV parse error:", err);
      },
    });
  };

  const handleMoodSelectorRedirect = () => {
    navigate('/');
  };

  return (
    <div
      className="h-screen w-screen flex flex-col overflow-hidden"
      style={{
        backgroundImage: `
          linear-gradient(to bottom right, rgba(255, 182, 193, 0.3), rgba(173, 216, 230, 0.3)),
          radial-gradient(circle at 20% 30%, rgba(255, 182, 193, 0.5), transparent 50%),
          radial-gradient(circle at 80% 70%, rgba(173, 216, 230, 0.5), transparent 50%),
          radial-gradient(circle at 50% 50%, rgba(255, 228, 181, 0.4), transparent 50%)
        `,
        backgroundBlendMode: 'overlay',
      }}
    >
      {/* Top Right Buttons */}
      <div className="fixed top-2 right-2 flex items-center gap-3 z-10">
        <label className="flex items-center gap-2 px-4 py-2 bg-white border border-purple-500 rounded-full text-purple-600 font-medium cursor-pointer hover:bg-purple-50 transition">
          <Upload className="w-5 h-5" />
          <span>Upload CSV</span>
          <input
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleCsvUpload}
          />
        </label>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 px-4 py-2 bg-pink-500 text-white rounded-full hover:bg-pink-600 transition transform hover:scale-105"
          title="Sign Out"
        >
          <LogOut className="w-5 h-5" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Header */}
      <header className="bg-transparent">
        <div className="p-4">
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
            Moodie Dashboard: {user.school}
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-xl text-purple-700 animate-pulse">
              Loading student moods... 🌈
            </p>
          </div>
        ) : students.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-xl text-gray-600">
              No students found. Let’s add some smiles! 😊
            </p>
          </div>
        ) : (
          <div className="bg-white shadow-xl rounded-none h-full flex flex-col">
            <div className="p-4 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  Student Mood Overview
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  Sorted to highlight students needing support first 🌟
                </p>
              </div>
              <button
                onClick={handleMoodSelectorRedirect}
                className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-full hover:bg-purple-600 transition transform hover:scale-105"
                title="Go to Mood Selector"
              >
                <Smile className="w-5 h-5" />
                <span>Mood Selector</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto overflow-x-auto">
              <table className="min-w-full min-h-full divide-y divide-gray-300">
                <thead className="bg-gradient-to-r from-purple-100 to-pink-100 sticky top-0 z-0">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-purple-700 uppercase tracking-wider border-r border-gray-300">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-purple-700 uppercase tracking-wider border-r border-gray-300">
                      Student ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-purple-700 uppercase tracking-wider border-r border-gray-300">
                      Grade
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-purple-700 uppercase tracking-wider border-r border-gray-300">
                      Birthday
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-purple-700 uppercase tracking-wider border-r border-gray-300">
                      Last 5 Moods
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-purple-700 uppercase tracking-wider">
                      Average Mood
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students.map((student) => (
                    <tr
                      key={student.id}
                      className={clsx(
                        'transition hover:bg-gray-50',
                        student.averageMood !== null && student.averageMood <= 2
                          ? 'border-l-4 border-red-500'
                          : student.averageMood !== null && student.averageMood <= 3
                          ? 'border-l-4 border-yellow-500'
                          : 'border-l-4 border-green-500'
                      )}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-r border-gray-200">
                        {student.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 border-r border-gray-200">
                        {student.studentId || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 border-r border-gray-200">
                        {student.grade || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 border-r border-gray-200">
                        {student.birthday || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 border-r border-gray-200">
                        <div className="flex gap-2 text-2xl">
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
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
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
