
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FileText, User, History, Map, Package, BarChart3, Users } from 'lucide-react';

const Sidebar = () => {
  const { currentUser, logout } = useAuth();

  // Navigation links based on user role
  const getNavLinks = () => {
    if (currentUser?.role === 'student') {
      return [
        { to: '/student/upload', text: 'Upload Document', icon: <FileText className="mr-2 h-5 w-5" /> },
        { to: '/student/track', text: 'Track Order', icon: <Map className="mr-2 h-5 w-5" /> },
        { to: '/student/history', text: 'History', icon: <History className="mr-2 h-5 w-5" /> },
        { to: '/student/profile', text: 'Profile', icon: <User className="mr-2 h-5 w-5" /> },
      ];
    } else if (currentUser?.role === 'xerox') {
      return [
        { to: '/xerox/orders', text: 'Print Orders', icon: <FileText className="mr-2 h-5 w-5" /> },
      ];
    } else if (currentUser?.role === 'admin') {
      return [
        { to: '/admin/staff', text: 'Staff Management', icon: <Users className="mr-2 h-5 w-5" /> },
        { to: '/admin/revenue', text: 'Revenue Analytics', icon: <BarChart3 className="mr-2 h-5 w-5" /> },
        { to: '/admin/inventory', text: 'Inventory Management', icon: <Package className="mr-2 h-5 w-5" /> },
      ];
    }
    return [];
  };

  return (
    <aside className="w-64 bg-white border-r h-full flex flex-col">
      <div className="p-5 border-b">
        <NavLink to="/" className="font-bold text-xl text-primary flex items-center">
          <Printer className="mr-2 h-6 w-6" />
          PrintHub
        </NavLink>
      </div>
      
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {getNavLinks().map((link, index) => (
            <li key={index}>
              <NavLink 
                to={link.to} 
                className={({ isActive }) => 
                  `flex items-center p-3 rounded-lg transition-colors hover:bg-gray-100 
                  ${isActive ? 'bg-gray-100 text-primary font-medium' : 'text-gray-700'}`
                }
              >
                {link.icon}
                {link.text}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="p-4 border-t">
        <button 
          onClick={logout}
          className="w-full p-3 text-left text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
