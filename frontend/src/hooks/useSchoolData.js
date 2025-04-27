import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';

const useSchoolData = (db, user) => {
  const [schoolDisplayName, setSchoolDisplayName] = useState('');
  const [availableCampuses, setAvailableCampuses] = useState([]);
  const [selectedCampus, setSelectedCampus] = useState('');
  const [newStudentCampus, setNewStudentCampus] = useState('');

  useEffect(() => {
    async function fetchSchoolData() {
      if (!user?.school) {
        console.warn('No school defined for user:', user);
        setAvailableCampuses(['DefaultCampus']);
        setSchoolDisplayName('Unknown School');
        setSelectedCampus('DefaultCampus');
        setNewStudentCampus('DefaultCampus');
        return;
      }
      try {
        console.log('Fetching school data for school:', user.school);
        // Fetch display name
        const schoolSnap = await getDoc(doc(db, 'schools', user.school));
        setSchoolDisplayName(
          schoolSnap.exists() ? schoolSnap.data().displayName || user.school : user.school
        );
        // Fetch campuses
        const campusesDoc = await getDoc(doc(db, 'schools', user.school, 'campuses', 'list'));
        let campusList = ['DefaultCampus']; // Fallback
        if (campusesDoc.exists() && Array.isArray(campusesDoc.data().names) && campusesDoc.data().names.length > 0) {
          campusList = campusesDoc.data().names;
        } else {
          // Initialize Firestore document with default campus
          await setDoc(doc(db, 'schools', user.school, 'campuses', 'list'), {
            names: ['DefaultCampus'],
          });
        }
        console.log('Available campuses from Firestore:', campusList);
        setAvailableCampuses(campusList);
        // Set default selectedCampus and newStudentCampus
        const defaultCampus = campusList[0] || 'DefaultCampus';
        setSelectedCampus(defaultCampus);
        setNewStudentCampus(defaultCampus);
      } catch (err) {
        console.error('Error fetching school data:', err);
        setAvailableCampuses(['DefaultCampus']);
        setSchoolDisplayName(user?.school || 'Unknown School');
        setSelectedCampus('DefaultCampus');
        setNewStudentCampus('DefaultCampus');
      }
    }
    fetchSchoolData();
  }, [db, user]);

  const addNewCampus = async (newCampus) => {
    if (!availableCampuses.includes(newCampus)) {
      const newCampuses = [...availableCampuses, newCampus];
      await updateDoc(doc(db, 'schools', user.school, 'campuses', 'list'), {
        names: newCampuses,
      });
      setAvailableCampuses(newCampuses);
      await updateDoc(doc(db, 'users', user.uid), {
        campuses: arrayUnion(newCampus),
      });
    }
  };

  return {
    schoolDisplayName,
    availableCampuses,
    selectedCampus,
    setSelectedCampus,
    newStudentCampus,
    setNewStudentCampus,
    addNewCampus,
  };
};

export default useSchoolData;