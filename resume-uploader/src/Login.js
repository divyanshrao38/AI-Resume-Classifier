import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Form, Dropdown, DropdownButton, Alert, Container, Row, Col, ToggleButton, ToggleButtonGroup } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

function LoginOrRegister() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Role'); // Admin or Candidate
  const [errorMessage, setErrorMessage] = useState('');
  const [isRegistering, setIsRegistering] = useState(false); // Toggle between login and register
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage('');

    const path = isRegistering ? '/register' : '/login';
    try {
      const response = await fetch(`http://localhost:5000${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, ...(isRegistering && { role }) }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to process request');
      }
      setIsRegistering(false)
      navigate(isRegistering ? '/login' : '/upload'); // Redirect users accordingly
    } catch (error) {
      console.error('Error:', error);
      setErrorMessage(error.message);
    }
  };

  return (
    <Container className="py-5">
      <Row>
        <Col md={{ span: 6, offset: 3 }}>
          <h2>{isRegistering ? 'Register' : 'Login'}</h2>
          <ToggleButtonGroup type="radio" name="options" defaultValue={1}>
            <ToggleButton id="tbg-btn-1" value={1} variant="outline-secondary" onClick={() => setIsRegistering(false)}>Login</ToggleButton>
            <ToggleButton id="tbg-btn-2" value={2} variant="outline-secondary" onClick={() => setIsRegistering(true)}>Register</ToggleButton>
          </ToggleButtonGroup>
          <Form onSubmit={handleSubmit} className="mt-3">
            <Form.Group className="mb-3" controlId="formBasicEmail">
              <Form.Label>Email address</Form.Label>
              <Form.Control
                type="email"
                placeholder="Enter email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="formBasicPassword">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Form.Group>

            {isRegistering && (
              <DropdownButton
                id="dropdown-basic-button"
                title={role}
                onSelect={(eventKey) => setRole(eventKey)}
                className="mb-3"
              >
                <Dropdown.Item eventKey="Admin">Admin</Dropdown.Item>
                <Dropdown.Item eventKey="Candidate">Candidate</Dropdown.Item>
              </DropdownButton>
            )}

            <Button variant="primary" type="submit">
              {isRegistering ? 'Register' : 'Login'}
            </Button>
            {errorMessage && <Alert variant="danger" className="mt-3">{errorMessage}</Alert>}
          </Form>
        </Col>
      </Row>
    </Container>
  );
}

export default LoginOrRegister;
