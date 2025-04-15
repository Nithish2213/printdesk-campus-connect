
import React, { useState } from 'react';
import { usePrint } from '../../contexts/PrintContext';
import OrderCard from '../../components/OrderCard';
import DocumentViewer from '../../components/DocumentViewer';
import { Eye } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";

const History = () => {
  const { orders } = usePrint();
  const [selectedDocument, setSelectedDocument] = useState(null);
  
  // Get all orders for the current user
  const userOrders = [...orders].sort((a, b) => new Date(b.dateCreated) - new Date(a.dateCreated));

  const viewDocument = async (order) => {
    try {
      const { data: { publicUrl }, error } = supabase.storage
        .from('documents')
        .getPublicUrl(order.fileUrl);

      if (error) throw error;

      setSelectedDocument({
        url: publicUrl,
        name: order.fileName
      });
    } catch (error) {
      toast.error('Error viewing document');
      console.error('View error:', error);
    }
  };

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
            <div key={order.id} className="relative">
              <OrderCard order={order} showProgress={order.paid} />
              <button
                onClick={() => viewDocument(order)}
                className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-sm hover:bg-gray-50"
              >
                <Eye className="h-5 w-5 text-gray-600" />
              </button>
            </div>
          ))}
        </div>
      )}

      {selectedDocument && (
        <DocumentViewer
          fileUrl={selectedDocument.url}
          fileName={selectedDocument.name}
          onClose={() => setSelectedDocument(null)}
        />
      )}
    </div>
  );
};

export default History;
