
import React from 'react';
import { usePrint } from '../../contexts/PrintContext';
import OrderCard from '../../components/OrderCard';

const Orders = () => {
  const { orders } = usePrint();
  
  // Get paid orders sorted by date (newest first)
  const paidOrders = orders
    .filter(order => order.paid)
    .sort((a, b) => new Date(b.dateCreated) - new Date(a.dateCreated));

  return (
    <div>
      {paidOrders.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
          <div className="flex justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-lg font-medium mt-4">No print orders yet</h3>
          <p className="text-gray-500 mt-2">There are no orders to process at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {paidOrders.map((order) => (
            <OrderCard 
              key={order.id} 
              order={order} 
              showProgress={true} 
              showActions={true}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;
