// src/context/SchoolContext.jsx
import React, { createContext, useState, useEffect } from 'react';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

export const SchoolContext = createContext({
  slug: '',
  displayName: '',
});

export function SchoolProvider({ children }) {
  const [displayName, setDisplayName] = useState('');
  const slug = (() => {
    const h = window.location.hostname.split('.');
    if (h[0]==='localhost' || window.location.hostname.includes('127.0.0.1')) return 'TestSchool';
    if (h[0]==='www') return 'TestSchool';
    return h[0];
  })();

  useEffect(() => {
    const db = getFirestore();
    async function fetchName() {
      const snap = await getDoc(doc(db, 'schools', slug));
      if (snap.exists() && snap.data().displayName) {
        setDisplayName(snap.data().displayName);
      } else {
        // fallback formatting
        const base = slug.toLowerCase().endsWith('isd')
          ? slug.slice(0, -3).replace(/^\w/, c=>c.toUpperCase()) + ' ISD'
          : slug
              .split(/[-_]/)
              .map(w=>w[0].toUpperCase()+w.slice(1))
              .join(' ');
        setDisplayName(base);
      }
    }
    fetchName();
  }, [slug]);

  return (
    <SchoolContext.Provider value={{ slug, displayName }}>
      {children}
    </SchoolContext.Provider>
  );
}
