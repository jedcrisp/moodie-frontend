// frontend/src/hooks/useStudents.js
import { useState, useEffect } from 'react';
import { getFirestore, collection, getDocs, deleteDoc, doc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { tooltipTextStyle } from '../styles.js';

export default function useStudents(db, user, defaultCampus) {
  const [state, setState] = useState({
    students: null, // Initialize as null to indicate uninitialized state
    filteredStudents: [],
    searchQuery: '',
    selectedCampus: defaultCampus || '',
    loading: true,
    error: null,
    tokenClaims: null,
  });

  const setSearchQuery = (query) => {
    setState(prevState => {
      const newFilteredStudents = prevState.students
        ? prevState.students.filter(student => {
            const matchesSearch = student.name.toLowerCase().includes(query.toLowerCase()) ||
              student.studentId.toLowerCase().includes(query.toLowerCase());
            const matchesCampus = prevState.selectedCampus
              ? student.campus === prevState.selectedCampus
              : true;
            return matchesSearch && matchesCampus;
          })
        : [];
      return {
        ...prevState,
        searchQuery: query,
        filteredStudents: newFilteredStudents,
      };
    });
  };

  const setSelectedCampus = (campus) => {
    setState(prevState => {
      const newFilteredStudents = prevState.students
        ? prevState.students.filter(student => {
            const matchesSearch = student.name.toLowerCase().includes(prevState.searchQuery.toLowerCase()) ||
              student.studentId.toLowerCase().includes(prevState.searchQuery.toLowerCase());
            const matchesCampus = campus ? student.campus === campus : true;
            return matchesSearch && matchesCampus;
          })
        : [];
      return {
        ...prevState,
        selectedCampus: campus,
        filteredStudents: newFilteredStudents,
      };
    });
  };

  const initialize = async () => {
    if (!user || !user.school) {
      console.error('User or user.school is undefined:', user);
      setState(prevState => ({
        ...prevState,
        error: 'User or school not defined',
        loading: false,
        students: [],
        filteredStudents: [],
      }));
      return;
    }

    console.log('Fetching students for user:', user);

    // Refresh token synchronously before fetching data
    const auth = getAuth();
    const currentUser = auth.currentUser;
    let userEmail = 'unknown';
    let tokenClaims = null;
    if (currentUser) {
      try {
        const tokenResult = await currentUser.getIdTokenResult(true);
        console.log('Token claims:', tokenResult.claims);
        console.log('Token email (request.auth.token.email):', tokenResult.claims.email);
        console.log('Token UID (request.auth.uid):', tokenResult.claims.sub);
        tokenClaims = tokenResult.claims;
        userEmail = currentUser.email;
      } catch (err) {
        console.error('Error getting token claims:', err);
      }
    }
    console.log('User email (currentUser.email):', userEmail);

    // Check user role document
    try {
      const userDocRef = doc(db, 'schools', user.school, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        console.log('User role document:', userDocSnap.data());
      } else {
        console.log('User role document does not exist at:', userDocRef.path);
      }
    } catch (err) {
      console.error('Error checking user role document:', err);
    }

    // Check counselor document by email
    try {
      const counselorDocRef = doc(db, 'schools', user.school, 'counselors', userEmail);
      const counselorDocSnap = await getDoc(counselorDocRef);
      if (counselorDocSnap.exists()) {
        console.log('Counselor document by email exists:', counselorDocSnap.data());
      } else {
        console.log('Counselor document does not exist at:', counselorDocRef.path);
      }
    } catch (err) {
      console.error('Error checking counselor document by email:', err);
    }

    setState(prevState => ({ ...prevState, loading: true }));
    try {
      const studentsSnap = await getDocs(collection(db, 'schools', user.school, 'students'));
      const moodsSnap = await getDocs(collection(db, 'schools', user.school, 'moods'));
      const eventsSnap = await getDocs(collection(db, 'schools', user.school, 'lifeEvents'));

      const studentsData = studentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const moods = moodsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const events = eventsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const studentsWithMoodsAndEvents = studentsData.map(student => {
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

      // Compute filtered students after initialization
      const filteredStudents = studentsWithMoodsAndEvents.filter(student => {
        const matchesSearch = student.name.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
          student.studentId.toLowerCase().includes(state.searchQuery.toLowerCase());
        const matchesCampus = state.selectedCampus ? student.campus === state.selectedCampus : true;
        return matchesSearch && matchesCampus;
      });

      setState(prevState => ({
        ...prevState,
        students: studentsWithMoodsAndEvents,
        filteredStudents,
        error: null,
        loading: false,
        tokenClaims,
      }));
    } catch (err) {
      console.error('Error fetching students:', err);
      setState(prevState => ({
        ...prevState,
        error: 'Failed to fetch students: ' + err.message,
        students: [],
        filteredStudents: [],
        loading: false,
        tokenClaims,
      }));
    }
  };

  useEffect(() => {
    initialize();
  }, [user, db]);

  const deleteStudent = async (studentId) => {
    if (!studentId) return;
    try {
      await deleteDoc(doc(db, 'schools', user.school, 'students', studentId));
      await initialize();
    } catch (err) {
      console.error('Error deleting student:', err);
      setState(prevState => ({
        ...prevState,
        error: 'Failed to delete student: ' + err.message,
      }));
    }
  };

  return {
    filteredStudents: state.filteredStudents,
    searchQuery: state.searchQuery,
    setSearchQuery,
    selectedCampus: state.selectedCampus,
    setSelectedCampus,
    loading: state.loading,
    fetchStudents: initialize,
    deleteStudent,
    error: state.error,
    tokenClaims: state.tokenClaims,
  };
}
