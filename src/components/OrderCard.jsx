
import React from 'react';
import { usePrint } from '../contexts/PrintContext';

const OrderCard = ({ order, showProgress = false, showActions = false }) => {
  const { updateOrderProgress } = usePrint();

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const handleProgressUpdate = (progress) => {
    updateOrderProgress(order.id, progress);
  };

  return (
    <div className="border rounded-lg p-4 mb-4 bg-white shadow-sm">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-medium">{order.fileName}</h3>
          <p className="text-sm text-gray-500">Order #{order.orderNumber}</p>
        </div>
        <span className={`px-2 py-1 text-xs rounded-full ${
          order.status.includes('Ready') ? 'bg-green-100 text-green-800' :
          order.status.includes('Processing') ? 'bg-blue-100 text-blue-800' :
          order.status.includes('Paid') ? 'bg-purple-100 text-purple-800' :
          'bg-yellow-100 text-yellow-800'
        }`}>
          {order.status}
        </span>
      </div>
      
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-3 text-sm">
        <div>
          <span className="text-gray-500">Copies:</span> {order.copies}
        </div>
        <div>
          <span className="text-gray-500">Print Type:</span> {order.printType}
        </div>
        <div>
          <span className="text-gray-500">Color:</span> {order.isColorPrint ? 'Yes' : 'No'}
        </div>
        <div>
          <span className="text-gray-500">Double Sided:</span> {order.isDoubleSided ? 'Yes' : 'No'}
        </div>
        <div className="col-span-2">
          <span className="text-gray-500">Date:</span> {formatDate(order.dateCreated)}
        </div>
        {order.message && (
          <div className="col-span-2 mt-2">
            <p className="text-gray-500 text-xs">Note: {order.message}</p>
          </div>
        )}
      </div>
      
      {showProgress && order.paid && (
        <div className="mt-4">
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium">Progress</span>
            <span className="text-sm text-gray-500">{order.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-primary h-2.5 rounded-full" 
              style={{ width: `${order.progress}%` }}
            ></div>
          </div>
          
          {showActions && (
            <div className="flex justify-between mt-4">
              <button 
                onClick={() => handleProgressUpdate(25)}
                className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm"
              >
                Start
              </button>
              <button 
                onClick={() => handleProgressUpdate(50)}
                className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm"
              >
                50%
              </button>
              <button 
                onClick={() => handleProgressUpdate(75)}
                className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm"
              >
                75%
              </button>
              <button 
                onClick={() => handleProgressUpdate(100)}
                className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm"
              >
                Complete
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OrderCard;
