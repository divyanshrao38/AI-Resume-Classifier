// src/components/Navbar.js
import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button, Navbar, Nav, Container } from 'react-bootstrap';

function CustomNavbar() {
  const { user, logout } = useAuth();

  return (
    <Navbar bg="dark" variant="dark" expand="lg">
      <Container>
        <Navbar.Brand href="/landing">AI Resume Classfier</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            {user && (
              <Nav.Link href="/landing">Dashboard</Nav.Link>
            )}
          </Nav>
          <Nav>
            {user ? (
              <>
                <Navbar.Text>
                  Signed in as: <a href="#login">{user.user}</a>
                </Navbar.Text>
                <Button variant="outline-light" onClick={logout} style={{ marginLeft: '10px' }}>
                  Logout
                </Button>
              </>
            ) : (
              <Nav.Link href="/login">Login</Nav.Link>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default CustomNavbar;
