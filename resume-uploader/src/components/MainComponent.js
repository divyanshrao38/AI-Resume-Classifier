// src/components/MainComponent.js
import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import AdminView from './AdminView';
import UserView from './UserView';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../App.css';

function MainComponent() {
  const { user } = useAuth();
    console.log('user', user)   
  if (!user) {
    return <p>Please login to view this page.</p>;
  }

  return user.type === 'Admin' ? <AdminView /> : <UserView />;
}

export default MainComponent;
