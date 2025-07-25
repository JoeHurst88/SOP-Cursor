import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ViewSOPs = () => {
  const [sops, setSOPs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exportingPDF, setExportingPDF] = useState({});
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    fetchSOPs();
  }, []);

  const fetchSOPs = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/sops', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch SOPs');
      }

      const data = await response.json();
      setSOPs(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = async (sopId, sopTitle) => {
    try {
      setExportingPDF(prev => ({ ...prev, [sopId]: true }));
      
      const response = await fetch(`http://localhost:5001/api/sops/${sopId}/pdf`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to export PDF');
      }

      // Create blob from response
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `SOP-${sopTitle.replace(/[^a-z0-9]/gi, '_')}.pdf`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
    } catch (err) {
      alert('Failed to export PDF: ' + err.message);
    } finally {
      setExportingPDF(prev => ({ ...prev, [sopId]: false }));
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
        <div className="relative py-3 sm:max-w-xl sm:mx-auto">
          <div className="text-center">
            Loading SOPs...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
        <div className="relative py-3 sm:max-w-xl sm:mx-auto">
          <div className="text-center text-red-600">
            Error: {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold">SOP Generator</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Standard Operating Procedures</h2>
            <button
              onClick={() => navigate('/create-sop')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-5 rounded-lg transition-colors duration-200 shadow-sm"
            >
              Create New SOP
            </button>
          </div>

          {sops.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No SOPs found</h3>
              <p className="text-gray-500 mb-4">Get started by creating your first Standard Operating Procedure</p>
              <button
                onClick={() => navigate('/create-sop')}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
              >
                Create Your First SOP
              </button>
            </div>
          ) : (
            <div className="grid gap-6 mb-8 md:grid-cols-2 lg:grid-cols-3">
              {sops.map((sop) => (
                <div key={sop._id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200 overflow-hidden">
                  <div className="p-6">
                    <div className="flex justify-between items-start">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{sop.title}</h3>
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        {sop.department}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-4">{sop.objective}</p>
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-500 mb-4">
                      <div>
                        <span className="font-medium">Responsible Person:</span>
                        <p>{sop.responsiblePerson}</p>
                      </div>
                      <div>
                        <span className="font-medium">Revision Number:</span>
                        <p>{sop.revisionNumber || '1.0'}</p>
                      </div>
                      <div>
                        <span className="font-medium">Effective Date:</span>
                        <p>{formatDate(sop.effectiveDate)}</p>
                      </div>
                      <div>
                        <span className="font-medium">Revision Date:</span>
                        <p>{formatDate(sop.revisionDate)}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => navigate(`/edit-sop/${sop._id}`)}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-3 rounded-lg text-sm transition-colors duration-200"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => exportToPDF(sop._id, sop.title)}
                        disabled={exportingPDF[sop._id]}
                        className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-3 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                      >
                        {exportingPDF[sop._id] ? 'Generating...' : 'Export PDF'}
                      </button>
                      <button
                        onClick={() => navigate(`/pdf-customizer/${sop._id}`)}
                        className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-3 rounded-lg text-sm transition-colors duration-200"
                      >
                        Customize PDF
                      </button>
                      {(user?.id === sop.createdBy || user?.role === 'admin') && (
                        <button
                          onClick={() => navigate(`/edit-sop/${sop._id}`)}
                          className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-3 rounded-lg text-sm transition-colors duration-200"
                        >
                          Edit
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ViewSOPs; 