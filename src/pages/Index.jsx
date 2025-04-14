
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Index = () => {
  const { currentUser } = useAuth();
  
  if (currentUser) {
    // Redirect based on user role
    if (currentUser.role === 'student') {
      return <Navigate to="/student/upload" replace />;
    } else if (currentUser.role === 'xerox') {
      return <Navigate to="/xerox/orders" replace />;
    } else if (currentUser.role === 'admin') {
      return <Navigate to="/admin/staff" replace />;
    }
  }
  
  // Not logged in, redirect to login page
  return <Navigate to="/login" replace />;
};

export default Index;
