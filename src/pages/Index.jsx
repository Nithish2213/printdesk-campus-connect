
import React, { useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

const Index = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  // If user is authenticated, redirect based on role
  if (currentUser) {
    console.log("Redirecting user based on role:", currentUser.role);
    
    // Redirect based on user role
    switch (currentUser.role) {
      case 'student':
        return <Navigate to="/student/upload" replace />;
      case 'xerox':
        return <Navigate to="/xerox/orders" replace />;
      case 'admin':
        return <Navigate to="/admin/staff" replace />;
      default:
        toast.error("Unknown user role. Please contact support.");
        return <Navigate to="/login" replace />;
    }
  }
  
  // Not logged in, redirect to login page
  return <Navigate to="/login" replace />;
};

export default Index;
