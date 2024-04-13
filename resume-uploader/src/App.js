import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import LoginOrRegister from './Login'; // Import the Login component
import Upload from './Upload'; // Make sure this is correctly imported

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginOrRegister />} />
        <Route path="/upload" element={<Upload />} />
        {/* Redirect users to the login page by default */}
        <Route path="/" element={<Navigate replace to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
