
import React from 'react';
import { usePrint } from '../../contexts/PrintContext';
import { Database, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

const InventoryManagement = () => {
  const { inventoryItems, loading } = usePrint();
  
  // Count items by category and status
  const inventorySummary = inventoryItems?.reduce((summary, item) => {
    // Count by category
    if (!summary.byCategory[item.category]) {
      summary.byCategory[item.category] = 0;
    }
    summary.byCategory[item.category]++;
    
    // Count by status
    if (!summary.byStatus[item.status]) {
      summary.byStatus[item.status] = 0;
    }
    summary.byStatus[item.status]++;
    
    // Count low stock items
    if (item.quantity <= 5) {
      summary.lowStock++;
    }
    
    return summary;
  }, { byCategory: {}, byStatus: {}, lowStock: 0 }) || { byCategory: {}, byStatus: {}, lowStock: 0 };

  return (
    <div>
      <h2 className="text-xl font-bold mb-6">Inventory Status</h2>
      
      {/* Inventory Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Items</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{inventoryItems?.length || 0}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">In Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{inventorySummary.byStatus['In Stock'] || 0}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Out of Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-600">{inventorySummary.byStatus['Out of Stock'] || 0}</p>
          </CardContent>
        </Card>
        
        <Card className={inventorySummary.lowStock > 0 ? "border-amber-300 bg-amber-50" : ""}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Low Stock Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              {inventorySummary.lowStock > 0 && (
                <AlertTriangle className="h-6 w-6 text-amber-500 mr-2" />
              )}
              <p className={`text-3xl font-bold ${inventorySummary.lowStock > 0 ? "text-amber-600" : ""}`}>
                {inventorySummary.lowStock}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Inventory List */}
      {loading ? (
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-gray-500">Loading inventory...</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {inventoryItems && inventoryItems.length > 0 ? (
                  inventoryItems.map((item) => (
                    <tr key={item.id} className={item.quantity <= 5 ? "bg-amber-50" : "hover:bg-gray-50"}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{item.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                        {item.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {item.quantity <= 5 && (
                            <AlertTriangle className="h-4 w-4 text-amber-500 mr-1" />
                          )}
                          <span className={item.quantity <= 5 ? "text-amber-700 font-medium" : "text-gray-500"}>
                            {item.quantity}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          item.status === 'In Stock' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                        {new Date(item.last_updated).toLocaleString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                      <div className="flex flex-col items-center py-6">
                        <Database className="h-12 w-12 text-gray-300 mb-2" />
                        <p className="text-lg font-medium text-gray-900">No inventory items found</p>
                        <p className="text-gray-500 mt-1">Inventory items will appear here when added by staff</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryManagement;
