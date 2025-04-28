// frontend/src/hooks/useStudents.js
import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, limit, where, deleteDoc } from 'firebase/firestore';

const useStudents = (db, user, selectedCampus) => {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const studentsQuery = selectedCampus
        ? query(
            collection(db, 'schools', user.school, 'students'),
            where('campus', '==', selectedCampus)
          )
        : collection(db, 'schools', user.school, 'students');
      const snap = await getDocs(studentsQuery);
      const arr = await Promise.all(
        snap.docs.map(async ds => {
          const s = ds.data();
          // Fetch last 5 moods
          const moodsSnap = await getDocs(
            query(
              collection(
                db,
                'schools',
                user.school,
                'students',
                ds.id,
                'moods'
              ),
              orderBy('date', 'desc'),
              limit(5)
            )
          );
          const moods = moodsSnap.docs.map(d => d.data());
          const avg =
            moods.length > 0
              ? moods.reduce((sum, m) => sum + (m.score || 3), 0) /
                moods.length
              : null;

          // Fetch life events
          const eventsSnap = await getDocs(
            collection(db, 'schools', user.school, 'students', ds.id, 'lifeEvents')
          );
          const events = eventsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          events.sort((a, b) => b.date.toDate() - a.date.toDate()); // Sort by date, newest first
          const recentEvent = events.find(event => {
            const eventDate = event.date.toDate();
            const now = new Date();
            const diffDays = (now - eventDate) / (1000 * 60 * 60 * 24);
            return diffDays <= 60; // Within 60 days
          });

          const studentData = { 
            id: ds.id, 
            ...s, 
            moods, 
            averageMood: avg, 
            lifeEvents: events,
            recentLifeEvent: recentEvent ? {
              type: recentEvent.type,
              date: recentEvent.date.toDate(),
            } : null 
          };
          console.log('Student data:', studentData); // Debug log
          return studentData;
        })
      );
      arr.sort((a, b) => (a.averageMood ?? 99) - (b.averageMood ?? 99));
      setStudents(arr);
      setFilteredStudents(arr);
    } catch (err) {
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.school) fetchStudents();
  }, [db, user, selectedCampus]);

  useEffect(() => {
    const q = searchQuery.toLowerCase();
    setFilteredStudents(
      students.filter(
        s =>
          (s.name || '').toLowerCase().includes(q) ||
          (s.studentId || '').toLowerCase().includes(q)
      )
    );
  }, [searchQuery, students]);

  const deleteStudent = async id => {
    if (!window.confirm('Are you sure you want to delete this student? This cannot be undone.')) {
      return;
    }
    try {
      const moodsSnap = await getDocs(
        collection(db, 'schools', user.school, 'students', id, 'moods')
      );
      const deleteMoodsPromises = moodsSnap.docs.map(moodDoc =>
        deleteDoc(moodDoc.ref)
      );
      await Promise.all(deleteMoodsPromises);

      // Delete life events
      const eventsSnap = await getDocs(
        collection(db, 'schools', user.school, 'students', id, 'lifeEvents')
      );
      const deleteEventsPromises = eventsSnap.docs.map(eventDoc =>
        deleteDoc(eventDoc.ref)
      );
      await Promise.all(deleteEventsPromises);

      await deleteDoc(doc(db, 'schools', user.school, 'students', id));
      setStudents(prev => prev.filter(student => student.id !== id));
      setFilteredStudents(prev => prev.filter(student => student.id !== id));
      alert('Student deleted successfully.');
    } catch (err) {
      console.error('Error deleting student:', err);
      alert('Failed to delete student. Please try again.');
    }
  };

  return {
    students,
    filteredStudents,
    searchQuery,
    setSearchQuery,
    loading,
    fetchStudents,
    deleteStudent,
  };
};

export default useStudents;
