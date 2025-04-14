
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { usePrint } from '../../contexts/PrintContext';
import { Power } from 'lucide-react';

const XeroxLayout = () => {
  const { currentUser } = useAuth();
  const { serverActive, toggleServer } = usePrint();
  
  // Protect route - only for xerox staff
  if (!currentUser || currentUser.role !== 'xerox') {
    return <Navigate to="/login" replace />;
  }

  const handleToggleServer = () => {
    toggleServer();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            <h1 className="ml-2 text-xl font-bold">Print Orders</h1>
          </div>
          
          <div className="flex items-center">
            <span className="mr-3">Welcome, {currentUser.name}</span>
            
            <button
              onClick={handleToggleServer}
              className={`flex items-center px-4 py-2 rounded-md transition-colors ${
                serverActive 
                  ? 'bg-red-100 hover:bg-red-200 text-red-700' 
                  : 'bg-green-100 hover:bg-green-200 text-green-700'
              }`}
            >
              <Power className="h-5 w-5 mr-1" />
              {serverActive ? 'Deactivate Server' : 'Activate Server'}
            </button>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
};

export default XeroxLayout;
