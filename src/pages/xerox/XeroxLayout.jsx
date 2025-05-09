
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import XeroxSidebar from '../../components/XeroxSidebar';

const XeroxLayout = () => {
  const auth = useAuth();
  
  // Safely handle possible undefined auth context
  if (!auth) {
    return <Navigate to="/login" replace />;
  }
  
  const { currentUser } = auth;
  
  // Protect route - only for xerox staff
  if (!currentUser || currentUser.role !== 'xerox') {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      <XeroxSidebar />
      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  );
};

export default XeroxLayout;
