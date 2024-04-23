import React, { useState, useEffect } from 'react';
import { Button, Table, Modal, Form, Container, Row, Col } from 'react-bootstrap';

function UserView() {
  const [openings, setOpenings] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState('form');
  const [responseMessage, setResponseMessage] = useState('');
  const [applicant, setApplicant] = useState({
    name: '',
    resume: null,
    email: '',
    linkedIn: '',
    openingId: '',
    jobDescription: ''
  });

  useEffect(() => {
    async function fetchOpenings() {
      try {
        const response = await fetch('http://localhost:5000/getAllOpenings');
        const data = await response.json();
        setOpenings(data);
      } catch (error) {
        console.error('Failed to fetch openings:', error);
      }
    }
    fetchOpenings();
  }, []);

  const handleFileChange = event => {
    setApplicant(prev => ({ ...prev, resume: event.target.files[0] }));
  };

  const openApplyModal = (opening) => {
    setApplicant(prev => ({
      ...prev,
      openingId: opening.opening_id,
      jobDescription: opening.description
    }));
    setShowModal(true);
    setModalContent('form');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const formData = new FormData();
    formData.append('name', applicant.name);
    formData.append('resume', applicant.resume);
    formData.append('linkedinProfile', applicant.linkedIn);
    formData.append('openingId', applicant.openingId);
    formData.append('jobDescription', applicant.jobDescription);
    formData.append('email', applicant.email);

    try {
      const response = await fetch('http://localhost:5000/apply', {
        method: 'POST',
        body: formData
      });
      if (response.ok) {
        const result = await response.json();
        setResponseMessage(`Application submitted successfully! Response: ${result.score}`);
        setModalContent('response');
      } else {
        throw new Error('Failed to submit application');
      }
    } catch (error) {
      setResponseMessage(`Error submitting application: ${error.message}`);
      setModalContent('response');
    }
  };

  return (
    <Container fluid="md" className="bg-dark text-white">
      <Row className="mb-4">
        <Col>
          <h1>User Dashboard</h1>
          <p>Explore open applications and submit your application.</p>
        </Col>
      </Row>
      <Row>
        <Col>
          <Table responsive="sm" striped bordered hover variant="dark" className="mt-3">
            <thead>
              <tr>
                <th>Title</th>
                <th>Description</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {openings.map((opening, index) => (
                <tr key={index}>
                  <td>{opening.title}</td>
                  <td>{opening.description}</td>
                  <td>
                    <Button variant="success" onClick={() => openApplyModal(opening)}>Apply</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Col>
      </Row>

      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" contentClassName="bg-dark text-white">
        <Modal.Header closeButton className="bg-secondary text-white">
          <Modal.Title>{modalContent === 'form' ? 'Apply for Position' : 'Application Response'}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-dark">
          {modalContent === 'form' ? (
            <Form onSubmit={handleSubmit} className="text-white">
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Name</Form.Label>
                    <Form.Control type="text" placeholder="Enter your name" required value={applicant.name} onChange={e => setApplicant(prev => ({ ...prev, name: e.target.value }))} className="bg-dark text-white" />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Email</Form.Label>
                    <Form.Control type="email" placeholder="Enter your email" required value={applicant.email} onChange={e => setApplicant(prev => ({ ...prev, email: e.target.value }))} className="bg-dark text-white" />
                  </Form.Group>
                </Col>
              </Row>
              <Form.Group className="mb-3">
                <Form.Label>Resume (PDF only)</Form.Label>
                <Form.Control type="file" accept=".pdf" required onChange={handleFileChange} className="bg-dark text-white" />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>LinkedIn Profile URL</Form.Label>
                <Form.Control type="url" placeholder="Enter your LinkedIn URL" onChange={e => setApplicant(prev => ({ ...prev, linkedIn: e.target.value }))} className="bg-dark text-white" />
              </Form.Group>
              <Button variant="primary" type="submit">Submit Application</Button>
            </Form>
          ) : (
            <div className="alert alert-success">{responseMessage}</div>
          )}
        </Modal.Body>
      </Modal>
    </Container>
  );
}

export default UserView;
