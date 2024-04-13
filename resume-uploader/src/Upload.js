import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Form, Alert, Spinner, Container, Row, Col } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

function Upload() {
  const [file, setFile] = useState(null);
  const [responseMessage, setResponseMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate(); // For navigation

  const handleFileChange = (event) => {
    setFile(event.target.files[0]); // Update the state with the selected file
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setResponseMessage(''); // Reset the response message
    setErrorMessage(''); // Reset the error message
    setIsLoading(true);

    if (!file) {
      setErrorMessage("Please select a file before submitting.");
      setIsLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append('resume', file); // Match the key expected by your API

    try {
      const response = await fetch('http://localhost:5000/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      const result = await response.json();
      setResponseMessage(`Resume uploaded successfully! Score: ${result.score}, Feedback: ${result.feedback}`);
    } catch (error) {
      console.error('Error uploading the file:', error);
      setErrorMessage("Failed to upload resume. " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    // Here you would clear any authentication tokens or user data if necessary
    navigate('/login'); // Navigate back to the login screen
  };

  return (
    <Container className="mt-5">
      <Row className="justify-content-md-center">
        <Col xs={12} md={6}>
          <h2 className="mb-3">Upload Resume</h2>
          <Form onSubmit={handleSubmit}>
            <Form.Group controlId="formFile" className="mb-3">
              <Form.Control type="file" onChange={handleFileChange} accept=".pdf" />
            </Form.Group>
            <Button variant="primary" type="submit" disabled={isLoading}>
              {isLoading ? <><Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> Uploading...</> : 'Upload'}
            </Button>
          </Form>
          {isLoading && <div className="mt-3"><Spinner animation="border" /> Loading...</div>}
          {responseMessage && <Alert variant="success" className="mt-3">{responseMessage}</Alert>}
          {errorMessage && <Alert variant="danger" className="mt-3">{errorMessage}</Alert>}
          <Button variant="secondary" onClick={handleLogout} className="mt-3">Logout</Button>
        </Col>
      </Row>
    </Container>
  );
}

export default Upload;
