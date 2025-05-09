
import React from 'react';
import { NavLink } from 'react-router-dom';
import { usePrint } from '../contexts/PrintContext';
import { useAuth } from '../contexts/AuthContext';
import { 
  Printer, 
  Package, 
  History, 
  Database, 
  ToggleLeft, 
  ToggleRight, 
  LogOut 
} from 'lucide-react';

const XeroxSidebar = () => {
  const { currentUser, logout } = useAuth();
  const { serverActive, toggleServer } = usePrint();
  
  const handleToggleServer = async () => {
    try {
      await toggleServer();
    } catch (error) {
      console.error('Error toggling server:', error);
    }
  };
  
  return (
    <aside className="w-64 bg-white border-r h-screen flex flex-col">
      <div className="p-5 border-b">
        <div className="flex items-center font-bold text-xl text-primary">
          <Printer className="mr-2 h-6 w-6" />
          PrintHub - Xerox
        </div>
        <p className="text-sm text-gray-500 mt-1">Welcome, {currentUser?.name || 'Staff'}</p>
      </div>
      
      <div className="p-4 mb-4 flex items-center justify-between border-b">
        <span className="text-sm font-medium">Server Status:</span>
        <button
          onClick={handleToggleServer}
          className="flex items-center"
        >
          {serverActive ? (
            <>
              <span className="text-green-600 font-medium mr-2">Online</span>
              <ToggleRight className="h-5 w-5 text-green-600" />
            </>
          ) : (
            <>
              <span className="text-red-600 font-medium mr-2">Offline</span>
              <ToggleLeft className="h-5 w-5 text-red-600" />
            </>
          )}
        </button>
      </div>
      
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          <li>
            <NavLink 
              to="/xerox/orders" 
              className={({ isActive }) => 
                `flex items-center p-3 rounded-lg transition-colors hover:bg-gray-100 
                ${isActive ? 'bg-gray-100 text-primary font-medium' : 'text-gray-700'}`
              }
            >
              <Printer className="mr-2 h-5 w-5" />
              Print Orders
            </NavLink>
          </li>
          
          <li>
            <NavLink 
              to="/xerox/completed" 
              className={({ isActive }) => 
                `flex items-center p-3 rounded-lg transition-colors hover:bg-gray-100 
                ${isActive ? 'bg-gray-100 text-primary font-medium' : 'text-gray-700'}`
              }
            >
              <Package className="mr-2 h-5 w-5" />
              Completed Orders
            </NavLink>
          </li>
          
          <li>
            <NavLink 
              to="/xerox/history" 
              className={({ isActive }) => 
                `flex items-center p-3 rounded-lg transition-colors hover:bg-gray-100 
                ${isActive ? 'bg-gray-100 text-primary font-medium' : 'text-gray-700'}`
              }
            >
              <History className="mr-2 h-5 w-5" />
              Order History
            </NavLink>
          </li>
          
          <li>
            <NavLink 
              to="/xerox/inventory" 
              className={({ isActive }) => 
                `flex items-center p-3 rounded-lg transition-colors hover:bg-gray-100 
                ${isActive ? 'bg-gray-100 text-primary font-medium' : 'text-gray-700'}`
              }
            >
              <Database className="mr-2 h-5 w-5" />
              Inventory
            </NavLink>
          </li>
        </ul>
      </nav>
      
      <div className="p-4 border-t">
        <button 
          onClick={logout}
          className="w-full p-3 text-left text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center"
        >
          <LogOut className="mr-2 h-5 w-5" />
          Logout
        </button>
      </div>
    </aside>
  );
};

export default XeroxSidebar;
