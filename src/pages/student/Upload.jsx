
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePrint } from '../../contexts/PrintContext';
import { Upload as UploadIcon, Plus, Minus } from 'lucide-react';
import { toast } from "sonner";
import { useAuth } from '../../contexts/AuthContext';

const Upload = () => {
  const [file, setFile] = useState(null);
  const [printType, setPrintType] = useState('Normal Xerox');
  const [copies, setCopies] = useState(1);
  const [colorPrint, setColorPrint] = useState(false);
  const [doubleSided, setDoubleSided] = useState(false);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);
  const { currentUser } = useAuth();
  const { submitOrder, serverActive } = usePrint();
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    
    if (!selectedFile) return;
    
    // Check file type - only allow PDFs
    if (selectedFile.type !== 'application/pdf') {
      toast.error('Please upload PDF files only');
      return;
    }
    
    // Check file size (max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error('File size should be less than 10MB');
      return;
    }
    
    setFile(selectedFile);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    
    if (!serverActive) {
      toast.error("Server is offline. Document uploads are disabled.");
      return;
    }
    
    const droppedFile = e.dataTransfer.files[0];
    
    if (!droppedFile) return;
    
    // Check file type - only allow PDFs
    if (droppedFile.type !== 'application/pdf') {
      toast.error('Please upload PDF files only');
      return;
    }
    
    // Check file size (max 10MB)
    if (droppedFile.size > 10 * 1024 * 1024) {
      toast.error('File size should be less than 10MB');
      return;
    }
    
    setFile(droppedFile);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!serverActive) {
      toast.error("Server is offline. Document uploads are disabled.");
      return;
    }
    
    if (!file) {
      toast.error('Please upload a file');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const order = await submitOrder(
        file,
        printType,
        copies,
        colorPrint,
        doubleSided,
        message
      );
      
      if (order && order.id) {
        toast.success("Order submitted successfully!");
        navigate(`/student/payment/${order.id}`);
      } else {
        throw new Error("Failed to create order");
      }
    } catch (error) {
      console.error("Order submission error:", error);
      toast.error(error.message || "Failed to submit order");
    } finally {
      setIsSubmitting(false);
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Upload PDF Files</label>
            <div 
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              {file ? (
                <div className="flex flex-col items-center">
                  <div className="text-green-600 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-lg font-medium">{file.name}</p>
                  <p className="text-sm text-gray-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  <button 
                    type="button" 
                    className="mt-4 text-primary hover:text-indigo-700 text-sm font-medium"
                    onClick={() => setFile(null)}
                  >
                    Replace file
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <UploadIcon className="h-12 w-12 text-gray-400 mb-3" />
                  <p className="text-primary text-lg font-medium mb-1">Upload a file</p>
                  <p className="text-sm text-gray-500 mb-4">or drag and drop</p>
                  <p className="text-xs text-gray-500">PDF up to 10MB</p>
                  
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".pdf"
                    className="hidden"
                    disabled={!serverActive}
                  />
                  
                  <button
                    type="button"
                    onClick={() => fileInputRef.current.click()}
                    className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                    disabled={!serverActive}
                  >
                    Browse Files
                  </button>
                </div>
              )}
            </div>
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
            disabled={!file || !serverActive || isSubmitting}
            className="w-full bg-primary hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-md transition duration-150 disabled:opacity-50"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Print Order'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Upload;
