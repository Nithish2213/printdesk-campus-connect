
import React from 'react';
import { usePrint } from '../../contexts/PrintContext';
import OrderCard from '../../components/OrderCard';

const History = () => {
  const { orders } = usePrint();
  
  // Get all orders for the current user
  const userOrders = [...orders].sort((a, b) => new Date(b.dateCreated) - new Date(a.dateCreated));

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Order History</h2>
      
      {userOrders.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
          <div className="flex justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <h3 className="text-lg font-medium mt-4">No orders yet</h3>
          <p className="text-gray-500 mt-2">You haven't placed any orders yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {userOrders.map((order) => (
            <OrderCard key={order.id} order={order} showProgress={order.paid} />
          ))}
        </div>
      )}
    </div>
  );
};

export default History;
