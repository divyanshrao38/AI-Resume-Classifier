// src/contexts/AuthContext.js
import React, { createContext, useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';


const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  const login = async (email, password, role, path) => {
    // Simulate an API call for user authentication
    console.log('Logging in...')
    // const path = isRegistering ? '/register' : '/login';
    try {
      const response = await fetch(`http://localhost:5000${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, ...(path ==="/register" && { role }) }),
      });

      const data = await response.json();

      if (response.ok) {
        setUser({ ...data }); // Set user data in state
      } else {
        throw new Error(data.message || 'Login failed');
      }
     } catch (error) {
      console.error('Error:', error);
    //   setErrorMessage(error.message);
    }
  };

  const logout = () => {
    setUser(null); // Reset user state
    navigate('/login'); // Redirect to login page
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
