
import React from 'react';
import { Download } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DocumentViewerProps {
  fileUrl: string;
  fileName: string;
  onClose: () => void;
}

const DocumentViewer = ({ fileUrl, fileName, onClose }: DocumentViewerProps) => {
  const handleDownload = async () => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(fileUrl);

      if (error) throw error;

      const blob = new Blob([data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Document downloaded successfully');
    } catch (error) {
      toast.error('Error downloading document');
      console.error('Download error:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-4 w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">{fileName}</h3>
          <div className="flex gap-2">
            <button
              onClick={handleDownload}
              className="flex items-center px-3 py-2 text-sm bg-primary text-white rounded-md hover:bg-primary/90"
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </button>
            <button
              onClick={onClose}
              className="px-3 py-2 text-sm bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Close
            </button>
          </div>
        </div>
        <div className="flex-1 min-h-0">
          <iframe
            src={`${fileUrl}#toolbar=0`}
            className="w-full h-full rounded border"
            title={fileName}
          />
        </div>
      </div>
    </div>
  );
};

export default DocumentViewer;
