
import React from 'react';
import { usePrint } from '../contexts/PrintContext';
import { File, CheckCircle, Clock, DollarSign } from 'lucide-react';

const OrderCard = ({ order, showProgress = false }) => {
  // Format file size to readable format
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  // Format date to readable format
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleString('en-US', options);
  };

  // Get status color
  const getStatusColor = (status) => {
    if (status.includes('Paid') || status.includes('Ready')) return 'text-green-600';
    if (status.includes('Pending')) return 'text-yellow-600';
    if (status.includes('Processing')) return 'text-blue-600';
    return 'text-gray-600';
  };

  // Get status icon
  const getStatusIcon = (status) => {
    if (status.includes('Paid') || status.includes('Ready')) return <CheckCircle className="h-5 w-5" />;
    if (status.includes('Pending')) return <DollarSign className="h-5 w-5" />;
    if (status.includes('Processing')) return <Clock className="h-5 w-5" />;
    return <File className="h-5 w-5" />;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      <div className="p-4 md:p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center">
            <div className="bg-gray-100 p-3 rounded-full mr-4">
              <File className="h-6 w-6 text-primary" />
            </div>
            
            <div>
              <h3 className="text-lg font-medium">{order.fileName}</h3>
              <p className="text-sm text-gray-500">
                {formatFileSize(order.fileSize)} • {formatDate(order.dateCreated)}
              </p>
            </div>
          </div>
          
          {order.orderNumber && (
            <div className="bg-gray-100 px-3 py-2 rounded-md">
              <span className="text-xs font-medium">ORDER #{order.orderNumber}</span>
            </div>
          )}
        </div>
        
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-1">Print Details</h4>
            <ul className="text-sm space-y-1">
              <li><span className="text-gray-600">Type:</span> {order.printType}</li>
              <li><span className="text-gray-600">Copies:</span> {order.copies}</li>
              <li><span className="text-gray-600">Color:</span> {order.isColorPrint ? 'Yes' : 'No'}</li>
              <li><span className="text-gray-600">Double-sided:</span> {order.isDoubleSided ? 'Yes' : 'No'}</li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-1">Status</h4>
            <div className={`flex items-center gap-1 ${getStatusColor(order.status)}`}>
              {getStatusIcon(order.status)}
              <span className="font-medium">{order.status}</span>
            </div>
            
            {showProgress && order.progress < 100 && order.progress > 0 && (
              <div className="mt-2">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary" 
                    style={{ width: `${order.progress}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {order.progress}% complete
                </div>
              </div>
            )}
          </div>
        </div>
        
        {order.message && (
          <div className="mt-4 p-3 bg-gray-50 rounded-md text-sm">
            <h4 className="font-medium mb-1">Message:</h4>
            <p className="text-gray-600">{order.message}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderCard;
