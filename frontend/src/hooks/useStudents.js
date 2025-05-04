import { useState, useEffect } from 'react';
import { getFirestore, collection, getDocs, deleteDoc, doc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { tooltipTextStyle } from '../styles.js';

export default function useStudents(db, user, defaultCampus) {
  const [students, setStudents] = useState([]); // Initialize as empty array
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCampus, setSelectedCampus] = useState(defaultCampus || '');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tokenClaims, setTokenClaims] = useState(null);

  const fetchStudents = async () => {
    if (!user || !user.school || !user.uid) {
      setError('User or school not defined');
      setLoading(false);
      setStudents([]);
      setFilteredStudents([]);
      return;
    }

    setLoading(true);
    try {
      // Fetch user document
      const userDocRef = doc(db, 'schools', user.school, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        console.log('User role document:', userDocSnap.data());
      } else {
        console.log('User role document does not exist at:', userDocRef.path);
        setError('User role document not found. Please contact support.');
        setStudents([]);
        setFilteredStudents([]);
        setLoading(false);
        return;
      }

      // Verify counselor role
      const userRole = userDocSnap.data().role;
      if (userRole !== 'counselor') {
        setError('Insufficient permissions: User is not a counselor.');
        setStudents([]);
        setFilteredStudents([]);
        setLoading(false);
        return;
      }

      // Fetch counselor document
      const auth = getAuth();
      const currentUser = auth.currentUser;
      const userEmail = currentUser ? currentUser.email : 'unknown';
      const counselorDocRef = doc(db, 'schools', user.school, 'counselors', userEmail);
      const counselorDocSnap = await getDoc(counselorDocRef);
      if (counselorDocSnap.exists()) {
        console.log('Counselor document by email exists:', counselorDocSnap.data());
      } else {
        console.log('Counselor document does not exist at:', counselorDocRef.path);
      }

      // Fetch students
      const studentsSnap = await getDocs(collection(db, 'schools', user.school, 'students'));
      const studentsData = studentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Fetch moods and life events for each student
      const studentsWithMoodsAndEvents = await Promise.all(
        studentsData.map(async student => {
          const moodsSnap = await getDocs(
            collection(db, 'schools', user.school, 'students', student.id, 'moods')
          );
          const eventsSnap = await getDocs(
            collection(db, 'schools', user.school, 'students', student.id, 'lifeEvents')
          );

          const moods = moodsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          const events = eventsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

          const moodsWithEmoji = moods.map(m => ({
            ...m,
            emoji: m.score === 1 ? '😢' : m.score === 2 ? '😕' : m.score === 3 ? '😐' : m.score === 4 ? '😊' : '😄',
          }));
          const averageMood = moods.length > 0
            ? moods.reduce((sum, m) => sum + m.score, 0) / moods.length
            : null;
          const recentEvent = events.find(event => {
            const eventDate = event.date && event.date.toDate ? event.date.toDate() : null;
            if (!eventDate) return false;
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
        })
      );

      setStudents(studentsWithMoodsAndEvents);

      // Filter students
      const newFilteredStudents = studentsWithMoodsAndEvents.filter(student => {
        const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          student.studentId.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCampus = selectedCampus ? student.campus === selectedCampus : true;
        return matchesSearch && matchesCampus;
      });

      setFilteredStudents(newFilteredStudents);
      setError(null);
    } catch (err) {
      console.error('Error fetching students:', err);
      setError('Failed to fetch students: ' + err.message);
      setStudents([]);
      setFilteredStudents([]);
    } finally {
      setLoading(false);
    }
  };

  // Token refresh
  useEffect(() => {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    if (currentUser) {
      currentUser.getIdTokenResult(true).then(tokenResult => {
        console.log('Token claims:', tokenResult.claims);
        setTokenClaims(tokenResult.claims);
      }).catch(err => {
        console.error('Error getting token claims:', err);
      });
    }
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [user, db]);

  // Update filteredStudents when searchQuery or selectedCampus changes
  useEffect(() => {
    const newFilteredStudents = students.filter(student => {
      const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.studentId.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCampus = selectedCampus ? student.campus === selectedCampus : true;
      return matchesSearch && matchesCampus;
    });
    setFilteredStudents(newFilteredStudents);
  }, [searchQuery, selectedCampus, students]);

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
        setError('Failed to delete student: ' + err.message);
      }
    },
    error,
    tokenClaims,
  };
}
