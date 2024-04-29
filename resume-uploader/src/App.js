import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import MainComponent from './components/MainComponent';
import CustomNavbar from './components/Navbar';
import Login from './components/Login'; // Assume this component handles login.
import { ConfigProvider, theme, Button, Card } from "antd";
const { defaultAlgorithm, darkAlgorithm } = theme;

function App() {
  const [isDarkMode, setIsDarkMode] = React.useState(false);
  const handleClick = () => {
    setIsDarkMode((previousValue) => !previousValue);
   };
  return (
    <ConfigProvider theme={{
      algorithm: isDarkMode ? darkAlgorithm : defaultAlgorithm,
    }}>

    <Router>
      <AuthProvider>
        <CustomNavbar handleClick={handleClick} isDarkMode={isDarkMode} />
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/landing" element={<MainComponent />} />
          {/* Redirect users to the login page by default */}
          <Route path="*" element={<Navigate replace to="/login" />} />
        </Routes>
      </AuthProvider>
    </Router>
    {/* <Card style={{ width: "max-content" }}>
      <Button onClick={handleClick}>
        Change Theme to {isDarkMode ? "Light" : "Dark"}
      </Button>
    </Card> */}

    </ConfigProvider>
  );
}

export default App;
