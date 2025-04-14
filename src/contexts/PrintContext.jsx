
import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { toast } from "sonner";

const PrintContext = createContext();

export const usePrint = () => {
  return useContext(PrintContext);
};

export const PrintProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState([]);
  const [serverActive, setServerActive] = useState(true);
  const [staff, setStaff] = useState([
    { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Manager', status: 'active' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'Operator', status: 'active' },
  ]);
  const [inventory, setInventory] = useState([
    { id: 1, name: 'A4 Paper', category: 'Paper', quantity: 5000, status: 'In Stock' },
    { id: 2, name: 'Black Ink', category: 'Ink', quantity: 20, status: 'In Stock' },
  ]);
  const [revenue, setRevenue] = useState([
    { date: '2025-03-01', orders: 150, revenue: 3000, expenses: 1200, profit: 1800 },
    { date: '2025-03-02', orders: 165, revenue: 3300, expenses: 1300, profit: 2000 },
  ]);

  useEffect(() => {
    // Load saved data from localStorage
    const savedOrders = localStorage.getItem('printHubOrders');
    const savedServerActive = localStorage.getItem('printHubServerActive');
    
    if (savedOrders) {
      setOrders(JSON.parse(savedOrders));
    }
    
    if (savedServerActive !== null) {
      setServerActive(JSON.parse(savedServerActive));
    }
  }, []);

  // Save data to localStorage on change
  useEffect(() => {
    localStorage.setItem('printHubOrders', JSON.stringify(orders));
    localStorage.setItem('printHubServerActive', JSON.stringify(serverActive));
  }, [orders, serverActive]);

  const toggleServer = () => {
    const newStatus = !serverActive;
    setServerActive(newStatus);
    toast.success(`Server ${newStatus ? 'activated' : 'deactivated'} successfully`);
    return newStatus;
  };

  const submitOrder = (fileData, printType, copies, isColorPrint, isDoubleSided, message) => {
    if (!serverActive && currentUser?.role === 'student') {
      toast.error("Xerox server is currently offline. Please try again later.");
      return null;
    }

    const orderNumber = Math.floor(10000 + Math.random() * 90000);
    
    const newOrder = {
      id: Date.now(),
      orderNumber,
      studentEmail: currentUser?.email,
      studentName: currentUser?.name,
      fileName: fileData.name || 'document.pdf',
      fileUrl: URL.createObjectURL(fileData),
      fileSize: fileData.size,
      printType,
      copies: parseInt(copies),
      isColorPrint,
      isDoubleSided,
      message,
      status: 'Pending Payment',
      dateCreated: new Date().toISOString(),
      paid: false,
      progress: 0,
    };

    setOrders(prevOrders => [newOrder, ...prevOrders]);
    return newOrder;
  };

  const completePayment = (orderId) => {
    setOrders(prevOrders => 
      prevOrders.map(order => 
        order.id === orderId 
          ? { ...order, status: 'Paid - Waiting for Processing', paid: true } 
          : order
      )
    );
  };

  const updateOrderProgress = (orderId, progress) => {
    setOrders(prevOrders => 
      prevOrders.map(order => 
        order.id === orderId 
          ? { 
              ...order, 
              progress, 
              status: progress === 100 
                ? 'Ready for Pickup' 
                : `Processing (${progress}%)`
            } 
          : order
      )
    );
  };

  const addStaffMember = (name, email, role) => {
    const newStaff = {
      id: Date.now(),
      name,
      email,
      role,
      status: 'active'
    };
    setStaff(prev => [...prev, newStaff]);
    return newStaff;
  };

  const updateStaffMember = (id, updates) => {
    setStaff(prev => 
      prev.map(staff => 
        staff.id === id 
          ? { ...staff, ...updates } 
          : staff
      )
    );
  };

  const deleteStaffMember = (id) => {
    setStaff(prev => prev.filter(staff => staff.id !== id));
  };

  const addInventoryItem = (name, category, quantity) => {
    const newItem = {
      id: Date.now(),
      name,
      category,
      quantity: parseInt(quantity),
      status: parseInt(quantity) > 0 ? 'In Stock' : 'Out of Stock'
    };
    setInventory(prev => [...prev, newItem]);
    return newItem;
  };

  const updateInventoryItem = (id, updates) => {
    setInventory(prev => 
      prev.map(item => {
        if (item.id === id) {
          const updatedItem = { ...item, ...updates };
          if (updates.quantity !== undefined) {
            updatedItem.status = parseInt(updates.quantity) > 0 ? 'In Stock' : 'Out of Stock';
          }
          return updatedItem;
        }
        return item;
      })
    );
  };

  const deleteInventoryItem = (id) => {
    setInventory(prev => prev.filter(item => item.id !== id));
  };

  const value = {
    orders,
    serverActive,
    staff,
    inventory,
    revenue,
    toggleServer,
    submitOrder,
    completePayment,
    updateOrderProgress,
    addStaffMember,
    updateStaffMember,
    deleteStaffMember,
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem
  };

  return (
    <PrintContext.Provider value={value}>
      {children}
    </PrintContext.Provider>
  );
};
