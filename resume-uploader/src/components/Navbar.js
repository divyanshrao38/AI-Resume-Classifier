import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Layout, Menu, Button } from 'antd';
import { UserOutlined } from '@ant-design/icons';

const { Header } = Layout;
function CustomNavbar({ handleClick, isDarkMode}) {
  const { user, logout } = useAuth();

  return (
    <Header style={{ position: 'fixed', zIndex: 1, width: '100%', padding: 0 }}>
      <div className="logo" />
      <Menu  mode="horizontal" defaultSelectedKeys={['1']}>
        <Menu.Item key="1" href="#">
          AI Resume Classifier
        </Menu.Item>

        
        {user && (
          <Menu.Item key="2" href="/landing">
            Dashboard
          </Menu.Item>
        )}
        {!user ? (
          <Menu.Item key="3" href="/login">
            Login
          </Menu.Item>
        ) : (
          <>
            <Menu.Item key="3" disabled>
              Signed in as: {user.user}
            </Menu.Item>
            <Menu.Item key="4" style={{ marginLeft: 'auto' }}>
              <Button type="primary" icon={<UserOutlined />} onClick={logout}>
                Logout
              </Button>
            </Menu.Item>
          </>
        )}

        <Menu.Item key="5" >
          <Button onClick={handleClick}>
         Change Theme to {isDarkMode ? "Light" : "Dark"}
      </Button>
          </Menu.Item>
      </Menu>
    </Header>
  );
}

export default CustomNavbar;
