// src/index.jsx
import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import { SchoolProvider } from './context/SchoolContext';

ReactDOM.render(
  <SchoolProvider>
    <App />
  </SchoolProvider>,
  document.getElementById('root')
);
