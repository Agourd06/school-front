import React, { useState } from 'react';
import { Eye, Download } from 'lucide-react';
import { getFileUrl } from '../../utils/apiConfig';

interface PdfActionsProps {
  pdfPath?: string | null;
  fileName?: string;
  className?: string;
}

/**
 * Reusable component for displaying PDF download/view actions in tables
 * Use this component in any table row where PDF files need to be displayed
 */
const PdfActions: React.FC<PdfActionsProps> = ({ pdfPath, fileName = 'document', className = '' }) => {
  const [isDownloading, setIsDownloading] = useState(false);

  if (!pdfPath) {
    return (
      <span className={`text-xs text-gray-400 ${className}`}>No PDF</span>
    );
  }

  const fullUrl = getFileUrl(pdfPath);

  const handleView = () => {
    window.open(fullUrl, '_blank');
  };

  const handleDownload = async () => {
    if (isDownloading) return;
    
    setIsDownloading(true);
    try {
      // Fetch the file as a blob to force download
      const token = localStorage.getItem('token');
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(fullUrl, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error('Failed to download PDF');
      }

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${fileName}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the blob URL
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      // Fallback: try opening in new tab if download fails
      window.open(fullUrl, '_blank');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        type="button"
        onClick={handleView}
        className="inline-flex items-center justify-center rounded-md border border-blue-200 p-1.5 text-blue-600 hover:bg-blue-50 transition-colors"
        title="View PDF"
      >
        <Eye className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={handleDownload}
        disabled={isDownloading}
        className="inline-flex items-center justify-center rounded-md border border-gray-200 p-1.5 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        title="Download PDF"
      >
        <Download className="h-4 w-4" />
      </button>
    </div>
  );
};

export default PdfActions;

