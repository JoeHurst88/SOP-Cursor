import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

// Professional configuration constants
const PDF_CONFIG_DEFAULTS = {
  sections: {
    title: { 
      enabled: true, 
      fontSize: 24, 
      fontWeight: 'bold', 
      alignment: 'center', 
      spacing: 1.5, 
      color: '#1a202c',
      order: 0
    },
    documentInfo: { 
      enabled: true, 
      fontSize: 12, 
      fontWeight: 'normal', 
      alignment: 'left', 
      spacing: 1.2, 
      color: '#2d3748',
      order: 1
    },
    objective: { 
      enabled: true, 
      fontSize: 12, 
      fontWeight: 'normal', 
      alignment: 'justify', 
      spacing: 1.4, 
      color: '#2d3748',
      order: 2
    },
    responsibility: { 
      enabled: true, 
      fontSize: 12, 
      fontWeight: 'normal', 
      alignment: 'justify', 
      spacing: 1.4, 
      color: '#2d3748',
      order: 3
    },
    references: { 
      enabled: true, 
      fontSize: 11, 
      fontWeight: 'normal', 
      alignment: 'left', 
      spacing: 1.2, 
      color: '#4a5568',
      order: 4
    },
    procedure: { 
      enabled: true, 
      fontSize: 12, 
      fontWeight: 'normal', 
      alignment: 'justify', 
      spacing: 1.4, 
      color: '#2d3748',
      order: 5
    },
    steps: { 
      enabled: true, 
      fontSize: 12, 
      fontWeight: 'normal', 
      alignment: 'left', 
      spacing: 1.3, 
      color: '#2d3748',
      order: 6
    },
    footer: { 
      enabled: true, 
      fontSize: 10, 
      fontWeight: 'normal', 
      alignment: 'center', 
      spacing: 1.0, 
      color: '#718096',
      order: 7
    }
  },
  layout: {
    pageSize: 'A4',
    orientation: 'portrait',
    margins: { top: 72, bottom: 72, left: 54, right: 54 }, // Points (1 inch = 72 points)
    lineHeight: 1.5,
    paragraphSpacing: 12
  },
  branding: {
    companyName: '',
    companyLogo: null,
    logoPosition: 'top-left', // top-left, top-center, top-right, none
    logoSize: 'medium', // small, medium, large
    watermark: {
      enabled: false,
      text: 'CONFIDENTIAL',
      opacity: 0.1,
      rotation: 45
    }
  },
  headerFooter: {
    header: {
      enabled: true,
      showLogo: true,
      showCompanyName: true,
      showDate: true,
      content: 'Standard Operating Procedure'
    },
    footer: {
      enabled: true,
      showPageNumbers: true,
      showCompanyName: true,
      showDate: true,
      showRevision: true
    }
  },
  advanced: {
    colorScheme: 'professional', // professional, minimal, modern
    fontFamily: 'Helvetica',
    hyphenation: false,
    widowOrphanControl: true
  }
};

const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32];
const FONT_WEIGHTS = ['normal', 'bold'];
const ALIGNMENTS = ['left', 'center', 'right', 'justify'];
const PAGE_SIZES = ['A4', 'Letter', 'Legal'];
const ORIENTATIONS = ['portrait', 'landscape'];

const PDFCustomizer = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  // Core state
  const [sop, setSOP] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [config, setConfig] = useState(PDF_CONFIG_DEFAULTS);
  const [contentReady, setContentReady] = useState(false);
  
  // UI state
  const [activeTab, setActiveTab] = useState('sections');
  const [previewMode, setPreviewMode] = useState('desktop');
  const [isDirty, setIsDirty] = useState(false);
  
  // Operation states
  const [operations, setOperations] = useState({
    saving: false,
    generating: false,
    uploading: false
  });
  
  const [feedback, setFeedback] = useState({
    type: null, // 'success', 'error', 'warning', 'info'
    message: '',
    timeout: null
  });

  // Memoized computed values
  const sectionOrder = useMemo(() => {
    return Object.entries(config.sections)
      .sort(([, a], [, b]) => a.order - b.order)
      .map(([key]) => key);
  }, [config.sections]);

  const enabledSections = useMemo(() => {
    return Object.entries(config.sections)
      .filter(([, section]) => section.enabled)
      .sort(([, a], [, b]) => a.order - b.order)
      .map(([key]) => key);
  }, [config.sections]);

  // Professional error handling and feedback
  const showFeedback = useCallback((type, message, duration = 5000) => {
    if (feedback.timeout) {
      clearTimeout(feedback.timeout);
    }
    
    const timeout = setTimeout(() => {
      setFeedback({ type: null, message: '', timeout: null });
    }, duration);
    
    setFeedback({ type, message, timeout });
  }, [feedback.timeout]);

  // Initialize and fetch SOP data
  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true);
        setError(null);
        setContentReady(false);
        
        const response = await fetch(`http://localhost:5001/api/sops/${id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const sopData = await response.json();
        setSOP(sopData);
        
        // Merge saved configuration with defaults
        if (sopData.pdfConfig && typeof sopData.pdfConfig === 'object') {
          setConfig(prevConfig => ({
            ...prevConfig,
            ...sopData.pdfConfig,
            sections: {
              ...prevConfig.sections,
              ...sopData.pdfConfig.sections
            },
            layout: {
              ...prevConfig.layout,
              ...sopData.pdfConfig.layout
            },
            branding: {
              ...prevConfig.branding,
              ...sopData.pdfConfig.branding
            },
            headerFooter: {
              ...prevConfig.headerFooter,
              ...sopData.pdfConfig.headerFooter
            }
          }));
        }
        
        // Add a small delay to prevent visual glitching and allow smooth transitions
        setTimeout(() => {
          setContentReady(true);
        }, 200);
        
      } catch (err) {
        console.error('Failed to load SOP:', err);
        setError(err.message);
        showFeedback('error', `Failed to load document: ${err.message}`);
      } finally {
        setTimeout(() => {
          setLoading(false);
        }, 100);
      }
    };

    if (id) {
      initializeData();
    }
  }, [id, showFeedback]);

  // Professional configuration update handlers
  const updateSectionConfig = useCallback((sectionKey, property, value) => {
    setConfig(prevConfig => ({
      ...prevConfig,
      sections: {
        ...prevConfig.sections,
        [sectionKey]: {
          ...prevConfig.sections[sectionKey],
          [property]: value
        }
      }
    }));
    setIsDirty(true);
  }, []);

  const updateLayoutConfig = useCallback((property, value) => {
    setConfig(prevConfig => ({
      ...prevConfig,
      layout: {
        ...prevConfig.layout,
        [property]: value
      }
    }));
    setIsDirty(true);
  }, []);

  const updateBrandingConfig = useCallback((property, value) => {
    setConfig(prevConfig => ({
      ...prevConfig,
      branding: {
        ...prevConfig.branding,
        [property]: value
      }
    }));
    setIsDirty(true);
  }, []);

  const updateHeaderFooterConfig = useCallback((section, property, value) => {
    setConfig(prevConfig => ({
      ...prevConfig,
      headerFooter: {
        ...prevConfig.headerFooter,
        [section]: {
          ...prevConfig.headerFooter[section],
          [property]: value
        }
      }
    }));
    setIsDirty(true);
  }, []);

  // Reorder sections
  const reorderSection = useCallback((sectionKey, direction) => {
    const currentOrder = config.sections[sectionKey].order;
    const sections = Object.entries(config.sections);
    const targetSection = sections.find(([, section]) => 
      direction === 'up' ? section.order === currentOrder - 1 : section.order === currentOrder + 1
    );
    
    if (targetSection) {
      const [targetKey, targetConfig] = targetSection;
      setConfig(prevConfig => ({
        ...prevConfig,
        sections: {
          ...prevConfig.sections,
          [sectionKey]: { ...prevConfig.sections[sectionKey], order: targetConfig.order },
          [targetKey]: { ...targetConfig, order: currentOrder }
        }
      }));
      setIsDirty(true);
    }
  }, [config.sections]);

  // Professional save operation
  const saveConfiguration = useCallback(async () => {
    try {
      setOperations(prev => ({ ...prev, saving: true }));
      
      const response = await fetch(`http://localhost:5001/api/sops/${id}/pdf-config`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ config })
      });

      if (!response.ok) {
        throw new Error(`Failed to save: ${response.statusText}`);
      }

      setIsDirty(false);
      showFeedback('success', 'Configuration saved successfully');
    } catch (err) {
      console.error('Save failed:', err);
      showFeedback('error', `Save failed: ${err.message}`);
    } finally {
      setOperations(prev => ({ ...prev, saving: false }));
    }
  }, [id, config, showFeedback]);

  // Professional PDF generation
  const generatePDF = useCallback(async () => {
    try {
      setOperations(prev => ({ ...prev, generating: true }));
      
      const response = await fetch(`http://localhost:5001/api/sops/${id}/pdf/custom`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ config })
      });

      if (!response.ok) {
        throw new Error(`PDF generation failed: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${sop?.title?.replace(/[^a-z0-9]/gi, '_') || 'SOP'}_Custom.pdf`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      showFeedback('success', 'PDF generated successfully');
    } catch (err) {
      console.error('PDF generation failed:', err);
      showFeedback('error', `PDF generation failed: ${err.message}`);
    } finally {
      setOperations(prev => ({ ...prev, generating: false }));
    }
  }, [id, config, sop?.title, showFeedback]);

  // Handle logo upload
  const handleLogoUpload = useCallback(async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!validTypes.includes(file.type)) {
      showFeedback('error', 'Invalid file type. Please upload JPG, PNG, or GIF images only.');
      return;
    }

    if (file.size > maxSize) {
      showFeedback('error', 'File too large. Please upload images under 5MB.');
      return;
    }

    try {
      setOperations(prev => ({ ...prev, uploading: true }));
      
      const formData = new FormData();
      formData.append('logo', file);

      const response = await fetch('http://localhost:5001/api/sops/upload-logo', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      updateBrandingConfig('companyLogo', result.logoUrl);
      showFeedback('success', 'Logo uploaded successfully');
    } catch (err) {
      console.error('Logo upload failed:', err);
      showFeedback('error', `Logo upload failed: ${err.message}`);
    } finally {
      setOperations(prev => ({ ...prev, uploading: false }));
    }
  }, [updateBrandingConfig, showFeedback]);

  // Update advanced config helper
  const updateAdvancedConfig = useCallback((property, value) => {
    setConfig(prevConfig => ({
      ...prevConfig,
      advanced: {
        ...prevConfig.advanced,
        [property]: value
      }
    }));
    setIsDirty(true);
  }, []);

  // Section metadata
  const SECTION_META = {
    title: { 
      name: 'Document Title', 
      icon: '📋', 
      description: 'Main document title and heading'
    },
    documentInfo: { 
      name: 'Document Information', 
      icon: '📄', 
      description: 'Basic document metadata and details'
    },
    objective: { 
      name: 'Objective', 
      icon: '🎯', 
      description: 'Document purpose and objectives'
    },
    responsibility: { 
      name: 'Responsibility', 
      icon: '👤', 
      description: 'Roles and responsibilities section'
    },
    references: { 
      name: 'References', 
      icon: '📚', 
      description: 'Citations and references'
    },
    procedure: { 
      name: 'Procedure', 
      icon: '⚙️', 
      description: 'General procedure overview'
    },
    steps: { 
      name: 'Detailed Steps', 
      icon: '📝', 
      description: 'Step-by-step instructions'
    },
    footer: { 
      name: 'Footer', 
      icon: '🔗', 
      description: 'Document footer and disclaimers'
    }
  };

  // Preview section renderer
  const previewSection = useCallback((sectionKey, index) => {
    const section = config.sections[sectionKey];
    if (!section.enabled) return null;

    const fontSize = `${Math.max(section.fontSize * 0.6, 8)}px`;
    const fontWeight = section.fontWeight;
    const marginBottom = `${section.spacing * 8}px`;
    const color = section.color || '#333333';
    const textAlign = section.alignment || 'left';

    const sectionStyle = {
      fontSize,
      fontWeight,
      marginBottom,
      color,
      textAlign,
      lineHeight: 1.4
    };

    switch (sectionKey) {
      case 'title':
        return (
          <div key={`${sectionKey}-${index}`} style={sectionStyle}>
            <div className="font-bold text-lg mb-2" style={{ fontSize: `${section.fontSize * 0.8}px` }}>
              Standard Operating Procedure
            </div>
            <div className="mb-2">{sop?.title || 'SOP Title Will Appear Here'}</div>
          </div>
        );

      case 'documentInfo':
        return (
          <div key={`${sectionKey}-${index}`} style={sectionStyle}>
            <div className="font-bold underline mb-2">Document Information</div>
            <div className="space-y-1 text-xs">
              <div>Department: {sop?.department || 'Department Name'}</div>
              <div>Responsible Person: {sop?.responsiblePerson || 'Person Name'}</div>
              <div>Revision Number: {sop?.revisionNumber || '1.0'}</div>
              <div>Effective Date: {sop?.effectiveDate ? new Date(sop.effectiveDate).toLocaleDateString() : 'MM/DD/YYYY'}</div>
              <div>Revision Date: {sop?.revisionDate ? new Date(sop.revisionDate).toLocaleDateString() : 'MM/DD/YYYY'}</div>
            </div>
          </div>
        );

      case 'objective':
        return (
          <div key={`${sectionKey}-${index}`} style={sectionStyle}>
            <div className="font-bold underline mb-2">Objective</div>
            <div className="text-xs leading-relaxed">
              {sop?.objective || 'This section will contain the objective and purpose of the standard operating procedure. It explains what the document aims to achieve and its intended outcomes.'}
            </div>
          </div>
        );

      case 'responsibility':
        return (
          <div key={`${sectionKey}-${index}`} style={sectionStyle}>
            <div className="font-bold underline mb-2">Responsibility</div>
            <div className="text-xs leading-relaxed">
              {sop?.responsibility || 'This section outlines the roles and responsibilities of personnel involved in executing this standard operating procedure.'}
            </div>
          </div>
        );

      case 'references':
        return (sop?.references && sop.references.length > 0) ? (
          <div key={`${sectionKey}-${index}`} style={sectionStyle}>
            <div className="font-bold underline mb-2">References</div>
            <div className="text-xs space-y-1">
              {sop.references.map((ref, idx) => (
                <div key={idx}>{idx + 1}. {ref}</div>
              ))}
            </div>
          </div>
        ) : null;

      case 'procedure':
        return (
          <div key={`${sectionKey}-${index}`} style={sectionStyle}>
            <div className="font-bold underline mb-2">Procedure Overview</div>
            <div className="text-xs leading-relaxed">
              {sop?.procedure || 'This section provides a general overview of the procedures that will be detailed in the following steps section.'}
            </div>
          </div>
        );

      case 'steps':
        return (
          <div key={`${sectionKey}-${index}`} style={sectionStyle}>
            <div className="font-bold underline mb-2">Detailed Steps</div>
            <div className="text-xs space-y-1">
              {sop?.steps?.length > 0 ? (
                sop.steps.map((step, idx) => (
                  <div key={idx} className="flex">
                    <span className="font-semibold mr-2">{idx + 1}.</span>
                    <span className="flex-1">{step}</span>
                  </div>
                ))
              ) : (
                <>
                  <div className="flex"><span className="font-semibold mr-2">1.</span><span className="flex-1">Step one will appear here</span></div>
                  <div className="flex"><span className="font-semibold mr-2">2.</span><span className="flex-1">Step two will appear here</span></div>
                  <div className="flex"><span className="font-semibold mr-2">3.</span><span className="flex-1">Additional steps will follow</span></div>
                </>
              )}
            </div>
          </div>
        );

      case 'footer':
        return (
          <div key={`${sectionKey}-${index}`} style={{ ...sectionStyle, borderTop: '1px solid #e2e8f0', paddingTop: '8px' }}>
            <div className="text-xs text-center text-gray-500">
              This document was generated automatically by the SOP Generator system.
              {config.branding.companyName && (
                <div className="mt-1">© {new Date().getFullYear()} {config.branding.companyName}. All rights reserved.</div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  }, [config, sop]);

  // Auto-save when leaving page
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        const message = 'You have unsaved changes. Are you sure you want to leave?';
        e.returnValue = message;
        return message;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4 animate-pulse">
          <div className="flex items-center space-x-4">
            <div className="animate-spin rounded-full h-10 w-10 border-b-3 border-indigo-600"></div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Loading Document</h3>
              <p className="text-sm text-gray-600">Preparing your PDF customization workspace...</p>
            </div>
          </div>
          <div className="mt-6 space-y-3">
            <div className="h-2 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-2 bg-gray-200 rounded animate-pulse w-3/4"></div>
            <div className="h-2 bg-gray-200 rounded animate-pulse w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-red-50 to-red-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4 border border-red-200">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Document</h3>
            <p className="text-sm text-gray-600 mb-4">{error}</p>
            <div className="space-y-2">
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Retry
              </button>
              <button
                onClick={() => navigate('/view-sops')}
                className="w-full bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Back to SOPs
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main render
  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 transition-all duration-500 ${
      contentReady ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'
    }`}>
      {/* Professional Header */}
      <div className={`bg-white shadow-xl border-b border-gray-100 no-print transition-all duration-500 ${
        contentReady ? 'opacity-100' : 'opacity-75'
      }`}>
        <div className="max-w-7xl mx-auto py-6 px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/view-sops')}
                className="p-3 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
                title="Back to SOPs"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>

              <div>
                <h1 className="text-3xl font-bold text-gray-900">PDF Layout Designer</h1>
                <p className="text-gray-600 mt-1">Customize your SOP document layout and styling</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {isDirty && (
                <div className="flex items-center space-x-2 text-amber-600 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium">Unsaved changes</span>
                </div>
              )}

              <div className="text-right">
                <div className="text-sm font-semibold text-gray-900">{sop?.title}</div>
                <div className="text-xs text-gray-500">
                  <div>Last modified: {new Date().toLocaleDateString()}</div>
                  <div>{enabledSections.length} sections enabled</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <div className="flex space-x-4">
              <button
                onClick={saveConfiguration}
                disabled={operations.saving}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2 transform hover:scale-105"
              >
                {operations.saving ? (
                  <>
                    <svg className="animate-spin w-4 h-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293zM9 4a1 1 0 012 0v2H9V4z"/>
                    </svg>
                    <span>Save Configuration</span>
                  </>
                )}
              </button>

              <button
                onClick={generatePDF}
                disabled={operations.generating}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-3 transform hover:scale-105"
              >
                {operations.generating ? (
                  <>
                    <svg className="animate-spin w-5 h-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Export Custom PDF</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-8 px-6 lg:px-8 relative">
        {/* Content Loading Overlay */}
        {!contentReady && (
          <div className="absolute inset-0 bg-white bg-opacity-60 backdrop-blur-sm z-10 flex items-center justify-center rounded-2xl">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-3"></div>
              <p className="text-sm text-gray-600 font-medium">Initializing workspace...</p>
            </div>
          </div>
        )}
        {/* Feedback Message */}
        {feedback.message && (
          <div className={`mb-6 p-4 rounded-xl border ${feedback.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-700' 
            : feedback.type === 'error'
            ? 'bg-red-50 border-red-200 text-red-700'
            : feedback.type === 'warning'
            ? 'bg-yellow-50 border-yellow-200 text-yellow-700'
            : 'bg-blue-50 border-blue-200 text-blue-700'
          }`}>
            <div className="flex items-center space-x-2">
              {feedback.type === 'success' ? (
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : feedback.type === 'error' ? (
                <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              )}
              <span className="font-medium">{feedback.message}</span>
            </div>
          </div>
        )}

        {sop && (
          <div className={`grid grid-cols-1 xl:grid-cols-4 gap-8 no-print transition-all duration-700 ${
            contentReady ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-2'
          }`}>
            {/* Enhanced Configuration Panel */}
            <div className="xl:col-span-3 configuration-panel">
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
              {/* Enhanced Tab Navigation */}
              <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 px-8 py-6 border-b border-gray-200">
                <nav className="flex space-x-0" aria-label="Tabs">
                  {[
                    { key: 'sections', name: 'Sections', icon: '📋', desc: 'Manage sections and their order' },
                    { key: 'layout', name: 'Layout', icon: '📏', desc: 'Configure page size and margins' },
                    { key: 'branding', name: 'Branding', icon: '🏢', desc: 'Add company branding and headers' },
                    { key: 'headerFooter', name: 'Headers & Footers', icon: '📑', desc: 'Configure headers and footers' },
                    { key: 'advanced', name: 'Advanced', icon: '🔧', desc: 'Customize advanced settings' }
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`flex-1 px-6 py-4 text-center font-medium text-sm transition-all duration-200 border-b-4 ${
                        activeTab === tab.key
                          ? 'border-indigo-500 text-indigo-700 bg-white shadow-lg rounded-t-xl -mb-px'
                          : 'border-transparent text-gray-600 hover:text-gray-800 hover:bg-white/50 rounded-t-lg'
                      }`}
                    >
                      <div className="flex flex-col items-center space-y-2">
                        <span className="text-2xl">{tab.icon}</span>
                        <span className="font-bold">{tab.name}</span>
                        <span className="text-xs opacity-80 hidden sm:block">{tab.desc}</span>
                      </div>
                    </button>
                  ))}
                </nav>
              </div>

              <div className="p-8">
                {/* Sections Tab */}
                {activeTab === 'sections' && (
                  <div className="space-y-8">
                    <div className="text-center">
                      <h3 className="text-2xl font-bold text-gray-900 mb-3">Sections</h3>
                      <p className="text-gray-600 max-w-2xl mx-auto">Manage document sections, their order, and individual styling. Toggle visibility and customize typography for each section.</p>
                    </div>
                    
                    <div className="grid gap-4">
                      {sectionOrder.map((sectionKey, index) => {
                        const section = config.sections[sectionKey];
                        const meta = SECTION_META[sectionKey];
                        const isEnabled = section.enabled;
                        
                        return (
                          <div key={sectionKey} className={`relative rounded-2xl border-2 transition-all duration-200 ${
                            isEnabled 
                              ? 'border-indigo-200 bg-gradient-to-r from-indigo-50 to-blue-50' 
                              : 'border-gray-200 bg-gray-50 opacity-60'
                          }`}>
                            <div className="p-6">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4 flex-1">
                                  <span className="text-3xl">{meta.icon}</span>
                                  <div className="flex-1">
                                    <h4 className="font-bold text-lg text-gray-900">{meta.name}</h4>
                                    <p className="text-sm text-gray-600">{meta.description}</p>
                                  </div>
                                </div>

                                <div className="flex items-center space-x-4">
                                  {/* Section Controls */}
                                  <div className="bg-white rounded-xl p-1 shadow-md">
                                    <button
                                      onClick={() => reorderSection(sectionKey, 'up')}
                                      disabled={index === 0}
                                      className="p-3 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors"
                                      title="Move section up"
                                    >
                                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                      </svg>
                                    </button>
                                    <button
                                      onClick={() => reorderSection(sectionKey, 'down')}
                                      disabled={index === sectionOrder.length - 1}
                                      className="p-3 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors"
                                      title="Move section down"
                                    >
                                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                      </svg>
                                    </button>
                                  </div>

                                  {/* Visibility Toggle */}
                                  <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={isEnabled}
                                      onChange={(e) => updateSectionConfig(sectionKey, 'enabled', e.target.checked)}
                                      className="sr-only peer"
                                    />
                                    <div className="w-14 h-8 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-indigo-600"></div>
                                  </label>
                                </div>
                              </div>

                              {/* Section Settings */}
                              {isEnabled && (
                                <div className="mt-6 pt-6 border-t border-indigo-200">
                                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div>
                                      <label className="block text-sm font-semibold text-gray-700 mb-2">Font Size</label>
                                      <select
                                        value={section.fontSize}
                                        onChange={(e) => updateSectionConfig(sectionKey, 'fontSize', parseInt(e.target.value))}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-sm"
                                      >
                                        {FONT_SIZES.map(size => (
                                          <option key={size} value={size}>{size}px</option>
                                        ))}
                                      </select>
                                    </div>

                                    <div>
                                      <label className="block text-sm font-semibold text-gray-700 mb-2">Weight</label>
                                      <select
                                        value={section.fontWeight}
                                        onChange={(e) => updateSectionConfig(sectionKey, 'fontWeight', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-sm"
                                      >
                                        {FONT_WEIGHTS.map(weight => (
                                          <option key={weight} value={weight}>{weight === 'normal' ? 'Regular' : 'Bold'}</option>
                                        ))}
                                      </select>
                                    </div>

                                    <div>
                                      <label className="block text-sm font-semibold text-gray-700 mb-2">Alignment</label>
                                      <select
                                        value={section.alignment}
                                        onChange={(e) => updateSectionConfig(sectionKey, 'alignment', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-sm"
                                      >
                                        {ALIGNMENTS.map(align => (
                                          <option key={align} value={align}>{align.charAt(0).toUpperCase() + align.slice(1)}</option>
                                        ))}
                                      </select>
                                    </div>

                                    <div>
                                      <label className="block text-sm font-semibold text-gray-700 mb-2">Color</label>
                                      <input
                                        type="color"
                                        value={section.color}
                                        onChange={(e) => updateSectionConfig(sectionKey, 'color', e.target.value)}
                                        className="w-full h-10 border border-gray-200 rounded-lg cursor-pointer"
                                      />
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Layout Tab */}
                {activeTab === 'layout' && (
                  <div className="space-y-8">
                    <div className="text-center">
                      <h3 className="text-2xl font-bold text-gray-900 mb-3">Layout</h3>
                      <p className="text-gray-600 max-w-2xl mx-auto">Configure page size, orientation, and margins for optimal document formatting.</p>
                    </div>
                    
                    <div className="grid gap-8">
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-200">
                        <h4 className="font-bold text-xl text-gray-900 mb-6 flex items-center space-x-3">
                          <span>📏</span>
                          <span>Page Settings</span>
                        </h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-3">Page Size</label>
                            <select
                              value={config.layout.pageSize}
                              onChange={(e) => updateLayoutConfig('pageSize', e.target.value)}
                              className="w-full px-4 py-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-lg"
                            >
                              {PAGE_SIZES.map(size => (
                                <option key={size} value={size}>{size}</option>
                              ))}
                            </select>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-3">Orientation</label>
                            <div className="grid grid-cols-2 gap-3">
                              {ORIENTATIONS.map((orientation) => (
                                <button
                                  key={orientation}
                                  onClick={() => updateLayoutConfig('orientation', orientation)}
                                  className={`py-4 px-4 rounded-xl border-2 font-medium transition-all duration-200 ${
                                    config.layout.orientation === orientation
                                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                                  }`}
                                >
                                  <div className="capitalize">{orientation}</div>
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-8 border border-purple-200">
                        <h4 className="font-bold text-xl text-gray-900 mb-6 flex items-center space-x-3">
                          <span>📐</span>
                          <span>Margins & Spacing</span>
                        </h4>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                          {Object.entries(config.layout.margins).map(([side, value]) => (
                            <div key={side}>
                              <label className="block text-sm font-semibold text-gray-700 mb-3 capitalize">{side} Margin</label>
                              <div className="relative">
                                <input
                                  type="number"
                                  min="18"
                                  max="200"
                                  value={value}
                                  onChange={(e) => updateLayoutConfig('margins', { ...config.layout.margins, [side]: parseInt(e.target.value) })}
                                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                                />
                                <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">pt</span>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="mt-6 flex space-x-3">
                          {[
                            { name: 'Narrow', values: { top: 36, bottom: 36, left: 36, right: 36 } },
                            { name: 'Normal', values: { top: 54, bottom: 54, left: 54, right: 54 } },
                            { name: 'Wide', values: { top: 72, bottom: 72, left: 72, right: 72 } }
                          ].map((preset) => (
                            <button
                              key={preset.name}
                              onClick={() => updateLayoutConfig('margins', preset.values)}
                              className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors"
                            >
                              {preset.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Branding Tab */}
                {activeTab === 'branding' && (
                  <div className="space-y-8">
                    <div className="text-center">
                      <h3 className="text-2xl font-bold text-gray-900 mb-3">Branding</h3>
                      <p className="text-gray-600 max-w-2xl mx-auto">Add your company branding and professional elements to your documents.</p>
                    </div>
                    
                    <div className="grid gap-8">
                      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-8 border border-emerald-200">
                        <h4 className="font-bold text-xl text-gray-900 mb-6 flex items-center space-x-3">
                          <span>🏢</span>
                          <span>Company Information</span>
                        </h4>
                        
                        <div className="space-y-6">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-3">Company Name</label>
                            <input
                              type="text"
                              value={config.branding.companyName || ''}
                              onChange={(e) => updateBrandingConfig('companyName', e.target.value)}
                              placeholder="Enter your company name"
                              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-3">Company Logo</label>
                            <div className="flex items-center space-x-4">
                              {config.branding.companyLogo ? (
                                <div className="flex items-center space-x-4">
                                  <img 
                                    src={`http://localhost:5001${config.branding.companyLogo}`}
                                    alt="Company Logo"
                                    className="w-16 h-16 object-contain border border-gray-200 rounded-lg"
                                  />
                                  <div>
                                    <p className="text-sm text-green-600 font-medium">✓ Logo uploaded</p>
                                    <button
                                      onClick={() => updateBrandingConfig('companyLogo', null)}
                                      className="text-sm text-red-600 hover:text-red-800 font-medium"
                                    >
                                      Remove logo
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex-1">
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleLogoUpload}
                                    disabled={operations.uploading}
                                    className="hidden"
                                    id="logo-upload"
                                  />
                                  <label
                                    htmlFor="logo-upload"
                                    className={`flex items-center justify-center w-full px-6 py-4 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-indigo-400 transition-colors ${operations.uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                  >
                                    {operations.uploading ? (
                                      <div className="flex items-center space-x-2">
                                        <svg className="animate-spin w-5 h-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <span className="text-sm text-gray-600">Uploading...</span>
                                      </div>
                                    ) : (
                                      <div className="text-center">
                                        <svg className="w-8 h-8 text-gray-400 mb-2 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 48 48">
                                          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                        <p className="text-sm text-gray-600">
                                          <span className="font-medium text-indigo-600">Click to upload</span> or drag and drop
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 5MB</p>
                                      </div>
                                    )}
                                  </label>
                                </div>
                              )}
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-3">Logo Position</label>
                            <select
                              value={config.branding.logoPosition || 'top-left'}
                              onChange={(e) => updateBrandingConfig('logoPosition', e.target.value)}
                              disabled={!config.branding.companyLogo}
                              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <option value="top-left">Top Left</option>
                              <option value="top-center">Top Center</option>
                              <option value="top-right">Top Right</option>
                              <option value="none">No Logo</option>
                            </select>
                            {!config.branding.companyLogo && (
                              <p className="text-xs text-gray-500 mt-1">Upload a logo to enable positioning</p>
                            )}
                          </div>

                          <div className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={config.branding.watermark?.enabled || false}
                              onChange={(e) => updateBrandingConfig('watermark', { ...config.branding.watermark, enabled: e.target.checked })}
                              className="w-5 h-5 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500 focus:ring-2"
                            />
                            <label className="text-lg font-semibold text-gray-700">Add watermark to pages</label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Headers & Footers Tab */}
                {activeTab === 'headerFooter' && (
                  <div className="space-y-8">
                    <div className="text-center">
                      <h3 className="text-2xl font-bold text-gray-900 mb-3">Headers & Footers</h3>
                      <p className="text-gray-600 max-w-2xl mx-auto">Customize headers and footers for your document.</p>
                    </div>
                    
                    <div className="grid gap-8">
                      <div className="bg-gradient-to-r from-teal-50 to-teal-100 rounded-2xl p-8 border border-teal-200">
                        <h4 className="font-bold text-xl text-gray-900 mb-6 flex items-center space-x-3">
                          <span>📑</span>
                          <span>Header Content</span>
                        </h4>
                        
                        <div className="space-y-6">
                          <div className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={config.headerFooter.header.enabled || true}
                              onChange={(e) => updateHeaderFooterConfig('header', 'enabled', e.target.checked)}
                              className="w-5 h-5 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500 focus:ring-2"
                            />
                            <label className="text-lg font-semibold text-gray-700">Enable header</label>
                          </div>
                          
                          {config.headerFooter.header.enabled && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-8">
                              <div className="flex items-center space-x-3">
                                <input
                                  type="checkbox"
                                  checked={config.headerFooter.header.showLogo || true}
                                  onChange={(e) => updateHeaderFooterConfig('header', 'showLogo', e.target.checked)}
                                  className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500"
                                />
                                <label className="text-sm font-medium text-gray-700">Show company logo</label>
                              </div>
                              
                              <div className="flex items-center space-x-3">
                                <input
                                  type="checkbox"
                                  checked={config.headerFooter.header.showCompanyName || true}
                                  onChange={(e) => updateHeaderFooterConfig('header', 'showCompanyName', e.target.checked)}
                                  className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500"
                                />
                                <label className="text-sm font-medium text-gray-700">Show company name</label>
                              </div>
                              
                              <div className="flex items-center space-x-3">
                                <input
                                  type="checkbox"
                                  checked={config.headerFooter.header.showDate || true}
                                  onChange={(e) => updateHeaderFooterConfig('header', 'showDate', e.target.checked)}
                                  className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500"
                                />
                                <label className="text-sm font-medium text-gray-700">Show generation date</label>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="bg-gradient-to-r from-pink-50 to-pink-100 rounded-2xl p-8 border border-pink-200">
                        <h4 className="font-bold text-xl text-gray-900 mb-6 flex items-center space-x-3">
                          <span>📑</span>
                          <span>Footer Content</span>
                        </h4>
                        
                        <div className="space-y-6">
                          <div className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={config.headerFooter.footer.enabled || true}
                              onChange={(e) => updateHeaderFooterConfig('footer', 'enabled', e.target.checked)}
                              className="w-5 h-5 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500 focus:ring-2"
                            />
                            <label className="text-lg font-semibold text-gray-700">Enable footer</label>
                          </div>
                          
                          {config.headerFooter.footer.enabled && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-8">
                              <div className="flex items-center space-x-3">
                                <input
                                  type="checkbox"
                                  checked={config.headerFooter.footer.showPageNumbers || true}
                                  onChange={(e) => updateHeaderFooterConfig('footer', 'showPageNumbers', e.target.checked)}
                                  className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500"
                                />
                                <label className="text-sm font-medium text-gray-700">Show page numbers</label>
                              </div>
                              
                              <div className="flex items-center space-x-3">
                                <input
                                  type="checkbox"
                                  checked={config.headerFooter.footer.showCompanyName || true}
                                  onChange={(e) => updateHeaderFooterConfig('footer', 'showCompanyName', e.target.checked)}
                                  className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500"
                                />
                                <label className="text-sm font-medium text-gray-700">Show company name</label>
                              </div>
                              
                              <div className="flex items-center space-x-3">
                                <input
                                  type="checkbox"
                                  checked={config.headerFooter.footer.showDate || true}
                                  onChange={(e) => updateHeaderFooterConfig('footer', 'showDate', e.target.checked)}
                                  className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500"
                                />
                                <label className="text-sm font-medium text-gray-700">Show generation date</label>
                              </div>
                              
                              <div className="flex items-center space-x-3">
                                <input
                                  type="checkbox"
                                  checked={config.headerFooter.footer.showRevision || true}
                                  onChange={(e) => updateHeaderFooterConfig('footer', 'showRevision', e.target.checked)}
                                  className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500"
                                />
                                <label className="text-sm font-medium text-gray-700">Show revision number</label>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Advanced Tab */}
                {activeTab === 'advanced' && (
                  <div className="space-y-8">
                    <div className="text-center">
                      <h3 className="text-2xl font-bold text-gray-900 mb-3">Advanced Settings</h3>
                      <p className="text-gray-600 max-w-2xl mx-auto">Fine-tune advanced document settings for professional output.</p>
                    </div>
                    
                    <div className="grid gap-8">
                      <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-2xl p-8 border border-yellow-200">
                        <h4 className="font-bold text-xl text-gray-900 mb-6 flex items-center space-x-3">
                          <span>🎨</span>
                          <span>Color Scheme</span>
                        </h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {[
                            { key: 'professional', name: 'Professional', desc: 'Traditional business colors' },
                            { key: 'minimal', name: 'Minimal', desc: 'Clean and simple design' },
                            { key: 'modern', name: 'Modern', desc: 'Contemporary styling' }
                          ].map((scheme) => (
                            <button
                              key={scheme.key}
                              onClick={() => updateAdvancedConfig('colorScheme', scheme.key)}
                              className={`p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                                config.advanced.colorScheme === scheme.key
                                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                              }`}
                            >
                              <div className="font-semibold">{scheme.name}</div>
                              <div className="text-sm opacity-80">{scheme.desc}</div>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-200">
                        <h4 className="font-bold text-xl text-gray-900 mb-6 flex items-center space-x-3">
                          <span>🖋️</span>
                          <span>Typography</span>
                        </h4>
                        
                        <div className="space-y-6">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-3">Font Family</label>
                            <select
                              value={config.advanced.fontFamily}
                              onChange={(e) => updateAdvancedConfig('fontFamily', e.target.value)}
                              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                            >
                              <option value="Helvetica">Helvetica</option>
                              <option value="Arial">Arial</option>
                              <option value="Times">Times Roman</option>
                            </select>
                          </div>

                          <div className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={config.advanced.hyphenation}
                              onChange={(e) => updateAdvancedConfig('hyphenation', e.target.checked)}
                              className="w-5 h-5 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500 focus:ring-2"
                            />
                            <label className="text-lg font-semibold text-gray-700">Enable hyphenation</label>
                          </div>
                          
                          <div className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={config.advanced.widowOrphanControl}
                              onChange={(e) => updateAdvancedConfig('widowOrphanControl', e.target.checked)}
                              className="w-5 h-5 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500 focus:ring-2"
                            />
                            <label className="text-lg font-semibold text-gray-700">Enable widow/orphan control</label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Enhanced Live Preview Panel */}
          <div className="xl:col-span-1 preview-panel">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden sticky top-8 border border-gray-100">
              {/* Preview Header */}
              <div className="bg-gradient-to-r from-gray-50 to-slate-100 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-lg text-gray-900">Live Preview</h3>
                  <div className="flex space-x-2">
                    {['desktop', 'tablet', 'mobile'].map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setPreviewMode(mode)}
                        className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                          previewMode === mode
                            ? 'bg-indigo-100 text-indigo-700'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {mode.charAt(0).toUpperCase() + mode.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Preview Content */}
              <div className="p-6">
                {/* Document Preview */}
                <div 
                  className={`bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden transition-all duration-300 ${
                    previewMode === 'mobile' ? 'max-w-xs mx-auto' :
                    previewMode === 'tablet' ? 'max-w-sm mx-auto' : 'w-full'
                  }`}
                  style={{
                    paddingTop: `${config.layout.margins.top / 3}px`,
                    paddingBottom: `${config.layout.margins.bottom / 3}px`,
                    paddingLeft: `${config.layout.margins.left / 3}px`,
                    paddingRight: `${config.layout.margins.right / 3}px`
                  }}
                >
                  <div className="space-y-4 text-xs leading-relaxed">
                    {/* Company Logo Preview */}
                    {config.branding.companyLogo && config.branding.logoPosition !== 'none' && (
                      <div className={`flex ${
                        config.branding.logoPosition === 'top-center' ? 'justify-center' :
                        config.branding.logoPosition === 'top-right' ? 'justify-end' : 'justify-start'
                      } mb-2`}>
                        <img 
                          src={`http://localhost:5001${config.branding.companyLogo}`}
                          alt="Logo"
                          className="w-8 h-8 object-contain"
                        />
                      </div>
                    )}

                    {/* Company Name Preview */}
                    {config.branding.companyName && (
                      <div className="text-center font-bold text-gray-800 mb-2">
                        {config.branding.companyName}
                      </div>
                    )}

                    {/* Watermark Preview */}
                    {config.branding.watermark?.enabled && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div 
                          className="text-gray-200 text-2xl font-bold transform rotate-45 opacity-20"
                          style={{ fontSize: '24px' }}
                        >
                          {config.branding.watermark.text || config.branding.companyName || 'CONFIDENTIAL'}
                        </div>
                      </div>
                    )}

                    {/* Main Content */}
                    {sectionOrder.map((sectionKey, index) => 
                      previewSection(sectionKey, index)
                    )}

                    {/* Footer elements preview */}
                    {config.headerFooter.footer.enabled && (
                      <div className="mt-4 pt-2 border-t border-gray-200 text-xs text-gray-500">
                        <div className="flex justify-between items-center">
                          {config.branding.companyName && (
                            <span>{config.branding.companyName}</span>
                          )}
                          <div className="flex items-center space-x-4">
                            {config.headerFooter.footer.showDate && (
                              <span>Generated: {new Date().toLocaleDateString()}</span>
                            )}
                            {config.headerFooter.footer.showPageNumbers && (
                              <span>Page 1 of 2</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Preview Stats */}
                <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                  <h4 className="font-semibold text-sm text-gray-700 mb-3">Document Stats</h4>
                  <div className="space-y-2 text-xs text-gray-600">
                    <div className="flex justify-between">
                      <span>Page Size:</span>
                      <span className="font-semibold">{config.layout.pageSize.toUpperCase()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Orientation:</span>
                      <span className="font-semibold capitalize">{config.layout.orientation}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Active Sections:</span>
                      <span className="font-semibold">{enabledSections.length} of {sectionOrder.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Est. Pages:</span>
                      <span className="font-semibold">2-3 pages</span>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="mt-6 space-y-3">
                  <button
                    onClick={() => window.print()}
                    className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors text-sm"
                  >
                    🖨️ Print Preview
                  </button>
                  <button
                    onClick={generatePDF}
                    disabled={operations.generating}
                    className="flex-1 py-3 px-4 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-xl font-medium transition-all text-sm disabled:opacity-50"
                  >
                    📄 Generate PDF
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  );
};

export default PDFCustomizer; 