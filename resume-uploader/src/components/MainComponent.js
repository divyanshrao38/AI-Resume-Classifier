// src/components/MainComponent.js
import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import AdminView from './AdminView';
import UserView from './UserView';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../App.css';
import { useNavigate } from 'react-router-dom';

function MainComponent() {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    console.log('user in', user)
    window.location.href = '/login';
  }
  else{
  

   

  return user.type === 'Admin' ? <AdminView /> : <UserView />;
  }  
}


export default MainComponent;
