// frontend/src/hooks/useStudents.js
import { useState, useEffect, useMemo } from 'react';
import { getFirestore, collection, getDocs, deleteDoc, doc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { tooltipTextStyle } from '../styles.js';

export default function useStudents(db, user, defaultCampus) {
  const [students, setStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCampus, setSelectedCampus] = useState(defaultCampus || '');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tokenClaims, setTokenClaims] = useState(null);

  // Separate useEffect for token refresh
  useEffect(() => {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    if (currentUser) {
      currentUser.getIdTokenResult(true).then(tokenResult => {
        console.log('Token claims:', tokenResult.claims);
        console.log('Token email (request.auth.token.email):', tokenResult.claims.email);
        console.log('Token UID (request.auth.uid):', tokenResult.claims.sub);
        setTokenClaims(tokenResult.claims);
      }).catch(err => {
        console.error('Error getting token claims:', err);
      });
    }
  }, []);

  const fetchStudents = async () => {
    if (!user || !user.school) {
      console.error('User or user.school is undefined:', user);
      setError('User or school not defined');
      setLoading(false);
      return;
    }

    console.log('Fetching students for user:', user);

    const auth = getAuth();
    const currentUser = auth.currentUser;
    const userEmail = currentUser ? currentUser.email : 'unknown';
    console.log('User email (currentUser.email):', userEmail);

    // Check Condition 1: User role document
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

    // Check Condition 2: Counselor document by email (for reference)
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

    setLoading(true);
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

      setStudents(studentsWithMoodsAndEvents);
      setError(null);
    } catch (err) {
      console.error('Error fetching students:', err);
      setError('Failed to fetch students: ' + err.message);
      setStudents([]);
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
    deleteStudent,
    error,
    tokenClaims,
  };
}
