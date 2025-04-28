// frontend/src/hooks/useStudents.js
import { useState, useEffect, useMemo } from 'react';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { tooltipTextStyle } from '../styles.js';

export default function useStudents(db, user, defaultCampus) {
  const [students, setStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCampus, setSelectedCampus] = useState(defaultCampus || '');
  const [loading, setLoading] = useState(true);

  const fetchStudents = async () => {
    if (!user || !user.school) return;
    setLoading(true);
    try {
      const studentsSnap = await getDocs(collection(db, 'schools', user.school, 'students'));
      const moodsSnap = await getDocs(collection(db, 'schools', user.school, 'moods'));
      const eventsSnap = await getDocs(collection(db, 'schools', user.school, 'lifeEvents'));

      const students = studentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const moods = moodsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const events = eventsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const studentsWithMoodsAndEvents = students.map(student => {
        const studentMoods = moods.filter(m => m.studentId === student.id);
        const studentEvents = events.filter(e => e.studentId === student.id);
        const moodsWithEmoji = studentMoods.map(m => ({
          ...m,
          emoji: m.score === 1 ? '😢' : m.score === 2 ? '😕' : m.score === 3 ? '😐' : m.score === 4 ? '😊' : '😄',
        }));
        const averageMood = studentMoods.length > 0
          ? studentMoods.reduce((sum, m) => sum + m.score, 0) / studentMoods.length
          : null;
        const recentEvent = studentEvents.find(event => {
          const eventDate = event.date.toDate();
          const now = new Date();
          const diffDays = (now - eventDate) / (1000 * 60 * 60 * 24);
          return diffDays <= 60;
        });

        return {
          ...student,
          moods: moodsWithEmoji.slice(0, 5),
          averageMood,
          recentLifeEvent: recentEvent || null,
        };
      });

      setStudents(studentsWithMoodsAndEvents);
    } catch (err) {
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [user, db]);

  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.studentId.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCampus = selectedCampus ? student.campus === selectedCampus : true;
      return matchesSearch && matchesCampus;
    });
  }, [students, searchQuery, selectedCampus]);

  return {
    filteredStudents,
    searchQuery,
    setSearchQuery,
    selectedCampus,
    setSelectedCampus,
    loading,
    fetchStudents,
    deleteStudent: async (studentId) => {
      if (!studentId) return;
      try {
        await deleteDoc(doc(db, 'schools', user.school, 'students', studentId));
        await fetchStudents();
      } catch (err) {
        console.error('Error deleting student:', err);
      }
    },
  };
}
