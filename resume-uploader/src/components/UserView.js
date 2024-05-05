import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Table, Modal, Layout, Typography, Upload,  message, Spin, Result } from 'antd';
import { InboxOutlined } from '@ant-design/icons';

const { Header, Content } = Layout;
const { TextArea } = Input;
const { Title } = Typography;
const { Dragger } = Upload;

function UserView() {
  const [openings, setOpenings] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
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

  const navigate = useNavigate();

  useEffect(() => {
    async function fetchOpenings() {
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
    }
    fetchOpenings();
  }, []);

  const handleFileChange = info => {
    console.log("info", info )
    
      console.log(`${info.file.name} file uploaded successfully`)
      message.success(`${info.file.name} file uploaded successfully`);
      setApplicant(prev => ({ ...prev, resume: info?.fileList[0]?.originFileObj }));
     if (info.file.status === 'error') {
      message.error(`${info.file.name} file upload failed.`);
    }
  };

  const openApplyModal = (opening) => {
    setApplicant(prev => ({
      ...prev,
      openingId: opening.opening_id,
      jobDescription: opening.description
    }));
    setIsModalVisible(true);
    setModalContent('form');
  };

  const handleSubmit = async () => {
    
    if(modalContent === 'response') {
      setIsModalVisible(false)
     
    }
    else{
    setIsLoading(true);
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
        setIsLoading(false);
      } else {
        setIsLoading(false);
        throw new Error('Failed to submit application');
        
      }
    } catch (error) {
      setIsLoading(false);
      setResponseMessage(`Error submitting application: ${error.message}`);
      setModalContent('response');
    }
  }
  };

  const columns = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button type="primary" onClick={() => openApplyModal(record)}>
          Apply
        </Button>
      ),
    },
  ];

  return (
    <Layout className="layout" style={{ minHeight: '100vh', paddingTop:"50px" }}>
      <Content style={{ padding: '20px 50px' }}>
      <Spin spinning={isLoading} size="large">
        <div style={{ padding: 24, minHeight: 380 }}>
          <Title level={2}>User Dashboard</Title>
          <p>Explore open applications and submit your application.</p>
          <Table columns={columns} dataSource={openings} rowKey="opening_id" />

          <Modal
            title={modalContent === 'form' ? 'Apply for Position' : 'Application Response'}
            visible={isModalVisible}
            onOk={handleSubmit}
            onCancel={() => setIsModalVisible(false)}
            okText={modalContent === 'form' ?"Submit Application" :''}
            cancelText={modalContent === 'form' ?"Cancel" : "Close"}
          >
            <Spin spinning={isLoading} size="large">
            {modalContent === 'form' ? (
              <Form layout="vertical">
                <Form.Item label="Name" name="name" rules={[{ required: true, message: 'Please input your name!' }]}>
                  <Input onChange={e => setApplicant(prev => ({ ...prev, name: e.target.value }))} />
                </Form.Item>
                <Form.Item label="Email" name="email" rules={[{ required: true, message: 'Please input your email!' }]}>
                  <Input onChange={e => setApplicant(prev => ({ ...prev, email: e.target.value }))} />
                </Form.Item>
                <Form.Item label="Resume (PDF only)" name="resume">
                  <Dragger beforeUpload={() => false} onChange={handleFileChange}>
                    <p className="ant-upload-drag-icon">
                      <InboxOutlined />
                    </p>
                    <p className="ant-upload-text">Click or drag file to this area to upload</p>
                  </Dragger>
                </Form.Item>
                <Form.Item label="LinkedIn Profile URL" name="linkedin">
                  <Input onChange={e => setApplicant(prev => ({ ...prev, linkedIn: e.target.value }))} />
                </Form.Item>
              </Form>
            ) : (
              <Result
              status="success"
              title="Successfully Submitted Application!"
              subTitle={responseMessage}
            />
            
            )}
            </Spin>
          </Modal>
        </div>
        </Spin>
      </Content>
    </Layout>
  );
}

export default UserView;
