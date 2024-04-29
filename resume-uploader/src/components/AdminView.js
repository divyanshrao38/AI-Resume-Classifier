import React, { useState, useEffect } from 'react';
import { Button, Modal, Table, Input, Form, Layout, Typography, Tag, Tooltip, Spin, message } from 'antd';
import { DownloadOutlined, SelectOutlined } from '@ant-design/icons';
const { TextArea } = Input;
const { Header, Content } = Layout;
const { Title } = Typography;

function AdminView() {
  const [openings, setOpenings] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isCandidateModalVisible, setIsCandidateModalVisible] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [newOpening, setNewOpening] = useState({ title: '', opening_id: '', description: '' });
  const colors3 = ['#40e495', '#30dd8a', '#2bb673'];
  useEffect(() => {
    const fetchOpenings = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('http://localhost:5000/getAllOpenings');
        const data = await response.json();
        setIsLoading(false);
        setOpenings(data);
      } catch (error) {
        setIsLoading(false);
        console.error('Failed to fetch openings:', error);
      }
    };
    fetchOpenings();
  }, []);

  const handleViewResume = (email) => {
    window.open(`http://localhost:5000/getCandidateResume?email=${email}`, '_blank');
  };

  const handleNextSteps = (email) => {
    message.success(`${email} Moved to next steps successfully`);
  };

  const handleCreateOpening = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:5000/createOpening', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOpening),
      });
      setIsLoading(false);
      if (!response.ok) {
        throw new Error('Failed to create opening');
      }
      const result = await response.json();
      setOpenings([...openings, newOpening]);
      setIsModalVisible(false);
    } catch (error) {
      setIsLoading(false);
      console.error('Error creating opening:', error);
    }
  };

  const showModal = () => setIsModalVisible(true);
  const showCandidateModal = (applicants) => {
    setCandidates(applicants);
    setIsCandidateModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setIsCandidateModalVisible(false);
  };

  const columns = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: 'ID',
      dataIndex: 'opening_id',
      key: 'opening_id',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button onClick={() => showCandidateModal(record.applicants)}>View Candidates</Button>
      ),
    },
  ];

  const candidateColumns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      fixed: 'left',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Score',
      dataIndex: 'resume_score',
      key: 'resume_score',
      render: score => ( <Tag color={score >= 0.5 ? 'green' : 'red'}>{score}</Tag> ),
    },
    {
      title: 'Feedback',
      dataIndex: 'resume_feedback',
      key: 'resume_feedback',
      ellipsis: {
        showTitle: false,
      },
      render: (resume_feedback) => (
        <Tooltip placement="topLeft" title={resume_feedback}>
          {resume_feedback}
        </Tooltip>
      ),
      // width:"200px",
      // minHeight:"100px",
      // ellipsis:"true"
    },
    {
      title: 'Predicted Category',
      dataIndex: 'predicted_category',
      key: 'predicted_category',
      render: category => ( <Tag color='blue'>{category}</Tag> )
    },
    {
      title: 'LinkedIn Profile',
      dataIndex: 'linkedin_profile',
      key: 'linkedin_profile',
      ellipsis: {
        showTitle: false,
      },
      render: (linkedin_profile) => (
        <Tooltip placement="topLeft" title={linkedin_profile}>
          {linkedin_profile}
        </Tooltip>
      ),
    },

    {
      title: 'Resume Download',
      key: 'resume_download',
      fixed: 'right',
      render: (_, record) => (
        
        <Button icon={<DownloadOutlined />} size={"small"} onClick={() => handleViewResume(record.email)}>Download Resume</Button>
      
      ),
    },

    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      render: (_, record) => (
        
        <Button icon={<SelectOutlined /> } size={"small"} onClick={() => handleNextSteps(record.email)}>Next steps</Button>
      
      ),
    },

  ];

  return (
    <Layout className="layout"  >
      <Header style={{  padding: 0 }}>
        <Title level={3} style={{ margin: '16px' }}>Admin Dashboard</Title>
      </Header>
      <Content style={{ margin: '24px 16px 0' }}>
        <Spin spinning={isLoading} size="large">
        <div style={{ padding: 24 }}>
          <Button type="primary" onClick={showModal}>
            Create New Application
          </Button>
          <Table style={{ padding: 24}} columns={columns} dataSource={openings} rowKey="opening_id"  />

          <Modal title="Create New Application" visible={isModalVisible} onOk={handleCreateOpening} onCancel={handleCancel}>
            <Form layout="vertical">
              <Form.Item label="Title">
                <Input value={newOpening.title} onChange={e => setNewOpening({ ...newOpening, title: e.target.value })} />
              </Form.Item>
              <Form.Item label="Opening ID">
                <Input value={newOpening.opening_id} onChange={e => setNewOpening({ ...newOpening, opening_id: e.target.value })} />
              </Form.Item>
              <Form.Item label="Description">
                <TextArea rows={3} value={newOpening.description} onChange={e => setNewOpening({ ...newOpening, description: e.target.value })} />
              </Form.Item>
            </Form>
          </Modal>

          <Modal title="View Candidates" visible={isCandidateModalVisible} onCancel={handleCancel} footer={null}  width={1500}>
            <Table columns={candidateColumns} dataSource={candidates} rowKey="email"   />
          </Modal>
        </div>
        </Spin>
      </Content>
    </Layout>
  );
}

export default AdminView;
