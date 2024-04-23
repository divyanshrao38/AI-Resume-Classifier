import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import MainComponent from './components/MainComponent';
import CustomNavbar from './components/Navbar';
import Login from './components/Login'; // Assume this component handles login.

function App() {
  return (
    <Router>
      <AuthProvider>
        <CustomNavbar />
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/landing" element={<MainComponent />} />
          {/* Redirect users to the login page by default */}
          <Route path="*" element={<Navigate replace to="/login" />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
