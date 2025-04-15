import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePrint } from '../../contexts/PrintContext';
import { toast } from "sonner";
import { MultipleFileUpload } from '../../components/MultipleFileUpload';
import { supabase } from "@/integrations/supabase/client";
import { Upload as UploadIcon, Plus, Minus } from 'lucide-react';

const Upload = () => {
  const [files, setFiles] = useState([]);
  const [printType, setPrintType] = useState('Normal Xerox');
  const [copies, setCopies] = useState(1);
  const [colorPrint, setColorPrint] = useState(false);
  const [doubleSided, setDoubleSided] = useState(false);
  const [message, setMessage] = useState('');
  const { submitOrder, serverActive } = usePrint();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!serverActive) {
      toast.error("Server is offline. Document uploads are disabled.");
      return;
    }
    
    if (files.length === 0) {
      toast.error('Please upload at least one file');
      return;
    }

    try {
      // Upload all files to Supabase storage
      const uploadedFiles = await Promise.all(
        files.map(async (file) => {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Math.random().toString(36).substring(7)}.${fileExt}`;
          const filePath = `${Date.now()}_${fileName}`;

          const { data, error } = await supabase.storage
            .from('documents')
            .upload(filePath, file);

          if (error) throw error;

          return {
            name: file.name,
            path: filePath,
            size: file.size
          };
        })
      );

      // Create orders for each file
      const orders = uploadedFiles.map(file => {
        return submitOrder(
          file,
          printType,
          copies,
          colorPrint,
          doubleSided,
          message
        );
      });

      // Navigate to payment page for the first order
      // (you might want to handle multiple orders differently)
      if (orders[0]) {
        navigate(`/student/payment/${orders[0].id}`);
      }
    } catch (error) {
      toast.error('Error uploading files');
      console.error('Upload error:', error);
    }
  };

  const incrementCopies = () => {
    setCopies(prev => Math.min(prev + 1, 100));
  };

  const decrementCopies = () => {
    setCopies(prev => Math.max(prev - 1, 1));
  };
  
  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Submit Print Order</h2>
      
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload PDF Files
            </label>
            <MultipleFileUpload onFilesChange={setFiles} />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Print Type</label>
              <select
                value={printType}
                onChange={(e) => setPrintType(e.target.value)}
                className="w-full p-3 border rounded-md focus:ring-primary focus:border-primary"
              >
                <option value="Normal Xerox">Normal Xerox</option>
                <option value="Glossy Print">Glossy Print</option>
                <option value="Matte Print">Matte Print</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Number of Copies</label>
              <div className="flex items-center">
                <button 
                  type="button"
                  onClick={decrementCopies}
                  className="p-2 border rounded-l-md bg-gray-100 hover:bg-gray-200"
                >
                  <Minus className="h-5 w-5" />
                </button>
                <input
                  type="number"
                  value={copies}
                  onChange={(e) => setCopies(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
                  min="1"
                  max="100"
                  className="w-full p-3 border-y focus:ring-primary focus:border-primary text-center"
                />
                <button 
                  type="button"
                  onClick={incrementCopies}
                  className="p-2 border rounded-r-md bg-gray-100 hover:bg-gray-200"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-x-8 gap-y-4 mb-6">
            <div className="flex items-center">
              <input
                id="colorPrint"
                type="checkbox"
                checked={colorPrint}
                onChange={(e) => setColorPrint(e.target.checked)}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <label htmlFor="colorPrint" className="ml-2 block text-sm text-gray-700">
                Color Print
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                id="doubleSided"
                type="checkbox"
                checked={doubleSided}
                onChange={(e) => setDoubleSided(e.target.checked)}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <label htmlFor="doubleSided" className="ml-2 block text-sm text-gray-700">
                Double Sided
              </label>
            </div>
          </div>
          
          <div className="mb-6">
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
              Additional Message
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows="4"
              className="w-full p-3 border rounded-md focus:ring-primary focus:border-primary"
              placeholder="Any special instructions..."
            ></textarea>
          </div>
          
          <button
            type="submit"
            disabled={!files || !serverActive}
            className="w-full bg-primary hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-md transition duration-150 disabled:opacity-50"
          >
            Submit Print Order
          </button>
        </form>
      </div>
    </div>
  );
};

export default Upload;
