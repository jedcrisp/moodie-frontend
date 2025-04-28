import Papa from 'papaparse';
import { doc, setDoc } from 'firebase/firestore';

export const handleCsvUpload = async (e, user, db, selectedCampus, setUploading, fetchStudents) => {
  const file = e.target.files?.[0];
  if (!file) return;
  setUploading(true);
  try {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async ({ data }) => {
        if (!data.length) {
          alert('CSV is empty or invalid.');
          return;
        }
        for (const row of data) {
          if (!row.studentId || !row.name) continue;
          await setDoc(
            doc(db, 'schools', user.school, 'students', row.studentId),
            {
              name: row.name.trim(),
              studentId: row.studentId.trim(),
              grade: row.grade ? row.grade.trim() : '',
              birthday: row.birthday ? row.birthday.trim() : '',
              email: row.email ? row.email.trim() : '',
              campus: selectedCampus || 'DefaultCampus',
            }
          );
        }
        await fetchStudents();
        alert('CSV uploaded successfully!');
      },
      error: err => {
        console.error('Error parsing CSV:', err);
        alert('Failed to parse CSV. Please check the file format.');
      },
    });
  } catch (err) {
    console.error('Error uploading CSV:', err);
    alert('Failed to upload CSV. Please try again.');
  } finally {
    setUploading(false);
  }
};

export const handleDownloadCsv = (filteredStudents, user, selectedCampus) => {
  const schoolName = typeof user?.school === 'string' && user.school.trim() ? user.school : 'School';
  const safeSchoolName = schoolName
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_+/g, '_') || 'School';
  const filename = `Moodie_${safeSchoolName}_${selectedCampus || 'AllCampuses'}_Students.csv`;

  const rows = filteredStudents.map(s => ({
    Name: s.name,
    'Student ID': s.studentId,
    Grade: s.grade,
    Birthday: s.birthday,
    Email: s.email || '',
    'Last 5 Moods': s.moods.map(m => m.emoji).join(' '),
    'Average Mood': s.averageMood != null ? s.averageMood.toFixed(2) : '',
    Campus: s.campus,
  }));
  const csv = Papa.unparse(rows);
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};
