import React, { useState, useEffect } from 'react';
import { Button, Table, Modal, Form, Container, Row, Col } from 'react-bootstrap';

function AdminView() {
  const [openings, setOpenings] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showCandidatesModal, setShowCandidatesModal] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [newOpening, setNewOpening] = useState({ title: '', opening_id: '', description: '' });

  useEffect(() => {
    const fetchOpenings = async () => {
      try {
        const response = await fetch('http://localhost:5000/getAllOpenings');
        const data = await response.json();
        setOpenings(data);
      } catch (error) {
        console.error('Failed to fetch openings:', error);
      }
    };
    fetchOpenings();
  }, []);

  const handleCreateOpening = async () => {
    try {
      const response = await fetch('http://localhost:5000/createOpening', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOpening),
      });
      if (!response.ok) {
        throw new Error('Failed to create opening');
      }
      const result = await response.json();
      setOpenings([...openings, newOpening]);
      setShowModal(false);
      

    } catch (error) {
      console.error('Error creating opening:', error);
    }
  };
  const handleViewResume = (email) => {
    window.open(`http://localhost:5000/getCandidateResume?email=${email}`, '_blank');
  };
  const fetchCandidates = (applicants) => {
    try {
      setCandidates(applicants);
      setShowCandidatesModal(true);
    } catch (error) {
      console.error('Failed to fetch candidates:', error);
    }
  };

  return (
    <Container fluid className="bg-dark text-white">
      <Row className="mb-4">
        <Col>
          <h1>Admin Dashboard</h1>
          <p>Manage applications, view candidates, and create new openings.</p>
        </Col>
      </Row>
      <Row>
        <Col>
          <Button onClick={() => setShowModal(true)} variant="success">Create New Application</Button>
          <Table striped bordered hover variant="dark" className="mt-3">
            <thead>
              <tr>
                <th>Title</th>
                <th>ID</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {openings?.map((opening, index) => (
                <tr key={index}>
                  <td>{opening.title}</td>
                  <td>{opening.opening_id}</td>
                  <td>{opening.description}</td>
                  <td>
                    <Button variant="info" onClick={() => fetchCandidates(opening.applicants)}>
                      View Candidates
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Col>
      </Row>

      {/* Modal for creating a new application */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" className="text-white" contentClassName="bg-dark">
        <Modal.Header closeButton className="border-secondary">
          <Modal.Title>Create New Application</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Title</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter title"
                value={newOpening.title}
                onChange={e => setNewOpening({ ...newOpening, title: e.target.value })}
                className="bg-dark text-white"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Opening ID</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter Opening ID"
                value={newOpening.openingId}
                onChange={e => setNewOpening({ ...newOpening, opening_id: e.target.value })}
                className="bg-dark text-white"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Enter description"
                value={newOpening.description}
                onChange={e => setNewOpening({ ...newOpening, description: e.target.value })}
                className="bg-dark text-white"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer className="border-secondary">
          <Button variant="secondary" onClick={() => setShowModal(false)}>Close</Button>
          <Button variant="primary" onClick={handleCreateOpening}>Create</Button>
        </Modal.Footer>
      </Modal>

      {/* Modal for viewing candidates */}
      <Modal show={showCandidatesModal} onHide={() => setShowCandidatesModal(false)} size="lg" className="text-white" contentClassName="bg-dark">
        <Modal.Header closeButton className="border-secondary">
          <Modal.Title>Candidates</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Table striped bordered hover variant="dark" responsive>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Score</th>
                <th>Feedback</th>
                <th>Predicted Category</th>
                <th>linkedin Profile</th>
              </tr>
            </thead>
            <tbody>
              {candidates?.map((candidate, index) => (
                <tr key={index}>
                  <td>{candidate.name}</td>
                  <td>{candidate.email}</td>
                  <td>{candidate.resume_score}</td>
                  <td>{candidate.resume_feedback}</td>
                  <td>{candidate.predicted_category}</td>
                  <td>{candidate.linkedin_profile}</td>
                  <td>
                    <Button variant="primary" onClick={() => handleViewResume(candidate.email)}>
                      View Resume
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Modal.Body>
      </Modal>
    </Container>
  );
}

export default AdminView;
