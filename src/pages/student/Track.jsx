
import React from 'react';
import { usePrint } from '../../contexts/PrintContext';
import OrderCard from '../../components/OrderCard';

const Track = () => {
  const { orders } = usePrint();
  
  // Get only paid orders for current user
  const userPaidOrders = orders.filter(order => 
    order.paid && order.status !== 'Completed'
  );

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Track Orders</h2>
      
      {userPaidOrders.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
          <div className="flex justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium mt-4">No active orders</h3>
          <p className="text-gray-500 mt-2">You don't have any orders being processed at the moment.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {userPaidOrders.map((order) => (
            <OrderCard key={order.id} order={order} showProgress={true} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Track;
