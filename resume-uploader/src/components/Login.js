import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Radio, Dropdown, Menu, Alert, Layout, Typography } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';

const { Header, Content } = Layout;
const { Title } = Typography;

function LoginOrRegister() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('Role'); // Admin or Candidate
    const [errorMessage, setErrorMessage] = useState('');
    const [isRegistering, setIsRegistering] = useState(false); // Toggle between login and register
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleSubmit = async () => {
        setErrorMessage('');
        const path = isRegistering ? '/register' : '/login';
    
        try {
            await login(email, password, role, path);
            setIsRegistering(false);
            navigate(isRegistering ? '/login' : '/Landing'); // Redirect users accordingly
        } catch (error) {
            console.error('Error:', error);
            setErrorMessage(error.message);
        }
    };

    const menu = (
        <Menu onClick={e => setRole(e.key)}>
            <Menu.Item key="Admin">Admin</Menu.Item>
            <Menu.Item key="Candidate">Candidate</Menu.Item>
        </Menu>
    );

    return (
        <Layout className="layout" style={{ minHeight: '90vh' }}>
            <Content style={{ padding: '50px 20px' }}>
                <div style={{ maxWidth: 300, margin: '0 auto' }}>
                    <Title level={2}>{isRegistering ? 'Register' : 'Login'}</Title>
                    <Radio.Group value={isRegistering} onChange={e => setIsRegistering(e.target.value)} style={{ marginBottom: 20 }}>
                        <Radio.Button value={false}>Login</Radio.Button>
                        <Radio.Button value={true}>Register</Radio.Button>
                    </Radio.Group>
                    <Form onFinish={handleSubmit} layout="vertical">
                        <Form.Item label="Email address" name="email">
                            <Input
                                type="email"
                                placeholder="Enter email"
                                onChange={e => setEmail(e.target.value)}
                            />
                        </Form.Item>

                        <Form.Item label="Password" name="password">
                            <Input.Password
                                placeholder="Password"
                                onChange={e => setPassword(e.target.value)}
                            />
                        </Form.Item>

                        {isRegistering && (
                            <Form.Item label="Role">
                                <Dropdown overlay={menu}>
                                    <Button>
                                        {role} <DownOutlined />
                                    </Button>
                                </Dropdown>
                            </Form.Item>
                        )}

                        <Form.Item>
                            <Button type="primary" htmlType="submit" block>
                                {isRegistering ? 'Register' : 'Login'}
                            </Button>
                        </Form.Item>

                        {errorMessage && (
                            <Alert message={errorMessage} type="error" showIcon />
                        )}
                    </Form>
                </div>
            </Content>
        </Layout>
    );
}

export default LoginOrRegister;
