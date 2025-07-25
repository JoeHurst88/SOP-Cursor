import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

const CreateSOP = () => {
  const navigate = useNavigate();
  useAuth(); // Initialize auth context
  const [showPreview, setShowPreview] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    department: '',
    responsiblePerson: '',
    objective: '',
    responsibility: '',
    references: [''],
    procedure: '',
    steps: [''],
    effectiveDate: new Date(),
    revisionDate: new Date(),
    revisionNumber: '1.0',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDateChange = (date, field) => {
    setFormData(prev => ({
      ...prev,
      [field]: date
    }));
  };

  const handleStepChange = (index, value) => {
    const newSteps = [...formData.steps];
    newSteps[index] = value;
    setFormData(prev => ({
      ...prev,
      steps: newSteps
    }));
  };

  const handleReferenceChange = (index, value) => {
    const newReferences = [...formData.references];
    newReferences[index] = value;
    setFormData(prev => ({
      ...prev,
      references: newReferences
    }));
  };

  const addStep = () => {
    setFormData(prev => ({
      ...prev,
      steps: [...prev.steps, '']
    }));
  };

  const addReference = () => {
    setFormData(prev => ({
      ...prev,
      references: [...prev.references, '']
    }));
  };

  const removeStep = (index) => {
    if (formData.steps.length > 1) {
      const newSteps = formData.steps.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        steps: newSteps
      }));
    }
  };

  const removeReference = (index) => {
    if (formData.references.length > 1) {
      const newReferences = formData.references.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        references: newReferences
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Convert dates to ISO strings for API
      const submitData = {
        ...formData,
        effectiveDate: formData.effectiveDate.toISOString(),
        revisionDate: formData.revisionDate.toISOString()
      };

      const response = await fetch('http://localhost:5001/api/sops', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(submitData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create SOP');
      }

      navigate('/view-sops');
    } catch (error) {
      console.error('Error creating SOP:', error);
      // You might want to show this error to the user in the UI
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Create New SOP</h2>
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
            >
              Back to Dashboard
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Department</label>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Responsible Person</label>
                <input
                  type="text"
                  name="responsiblePerson"
                  value={formData.responsiblePerson}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              {/* Objective */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Objective</label>
                <textarea
                  name="objective"
                  value={formData.objective}
                  onChange={handleInputChange}
                  required
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Describe the purpose and goals of this SOP..."
                />
              </div>

              {/* Responsibility */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Responsibility</label>
                <textarea
                  name="responsibility"
                  value={formData.responsibility}
                  onChange={handleInputChange}
                  required
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Detail who is responsible for implementing and maintaining this SOP..."
                />
              </div>

              {/* References */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">References</label>
                {formData.references.map((reference, index) => (
                  <div key={index} className="flex gap-2 mt-2">
                    <input
                      type="text"
                      value={reference}
                      onChange={(e) => handleReferenceChange(index, e.target.value)}
                      placeholder={`Reference ${index + 1}`}
                      required
                      className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => removeReference(index)}
                      className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addReference}
                  className="mt-2 bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                >
                  Add Reference
                </button>
              </div>

              {/* Procedure Overview */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Procedure Overview</label>
                <textarea
                  name="procedure"
                  value={formData.procedure}
                  onChange={handleInputChange}
                  required
                  rows={4}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Provide a general overview of the procedure..."
                />
              </div>

              {/* Detailed Steps */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Detailed Steps</label>
                {formData.steps.map((step, index) => (
                  <div key={index} className="flex gap-2 mt-2">
                    <input
                      type="text"
                      value={step}
                      onChange={(e) => handleStepChange(index, e.target.value)}
                      placeholder={`Step ${index + 1}`}
                      required
                      className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => removeStep(index)}
                      className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addStep}
                  className="mt-2 bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                >
                  Add Step
                </button>
              </div>

              {/* Revision Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Revision Number</label>
                <input
                  type="text"
                  name="revisionNumber"
                  value={formData.revisionNumber}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="e.g., 1.0, 2.1"
                />
              </div>

              {/* Dates Section */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Effective Date
                  </label>
                  <DatePicker
                    selected={formData.effectiveDate}
                    onChange={(date) => handleDateChange(date, 'effectiveDate')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    dateFormat="MMMM d, yyyy"
                    minDate={new Date()}
                    placeholderText="Select effective date"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Revision Date
                  </label>
                  <DatePicker
                    selected={formData.revisionDate}
                    onChange={(date) => handleDateChange(date, 'revisionDate')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    dateFormat="MMMM d, yyyy"
                    minDate={formData.effectiveDate}
                    placeholderText="Select revision date"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowPreview(true)}
                className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
              >
                Preview PDF
              </button>
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded"
              >
                Create SOP
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* PDF Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">PDF Preview</h3>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="p-8 bg-white pdf-preview-content" style={{
                fontFamily: 'Arial, Helvetica, sans-serif',
                lineHeight: '1.6',
                color: '#333'
              }}>
                {/* Document Header */}
                <div className="text-center mb-8 pb-5 border-b-2 border-blue-600">
                  <h1 className="text-3xl font-bold text-blue-700 mb-2 uppercase tracking-wide">
                    {formData.title || 'SOP Title'}
                  </h1>
                  <p className="text-gray-600 text-lg">Standard Operating Procedure</p>
                </div>

                {/* Metadata Section */}
                <div className="grid grid-cols-2 gap-5 mb-8 p-5 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex flex-col">
                    <span className="font-bold text-xs text-gray-600 uppercase tracking-wider mb-1">Department</span>
                    <span className="text-sm text-gray-900 p-2 bg-white rounded border border-gray-300">
                      {formData.department || 'Department Name'}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-xs text-gray-600 uppercase tracking-wider mb-1">Responsible Person</span>
                    <span className="text-sm text-gray-900 p-2 bg-white rounded border border-gray-300">
                      {formData.responsiblePerson || 'Responsible Person'}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-xs text-gray-600 uppercase tracking-wider mb-1">Document Date</span>
                    <span className="text-sm text-gray-900 p-2 bg-white rounded border border-gray-300">
                      {formData.effectiveDate ? formData.effectiveDate.toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      }) : 'Select Date'}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-xs text-gray-600 uppercase tracking-wider mb-1">Revision Number</span>
                    <span className="text-sm text-gray-900 p-2 bg-white rounded border border-gray-300">
                      {formData.revisionNumber || '1.0'}
                    </span>
                  </div>
                </div>

                {/* Procedure Overview */}
                {formData.procedure && (
                  <>
                    <h2 className="text-xl font-bold text-blue-700 mb-4 pb-2 border-b border-gray-300 uppercase tracking-wide">
                      Procedure Overview
                    </h2>
                    <div className="bg-gray-50 p-5 rounded-lg border-l-4 border-green-500 mb-6 text-sm leading-relaxed text-gray-700">
                      {formData.procedure}
                    </div>
                  </>
                )}

                {/* Detailed Steps */}
                <h2 className="text-xl font-bold text-blue-700 mb-4 pb-2 border-b border-gray-300 uppercase tracking-wide">
                  Detailed Steps
                </h2>
                <div className="mb-8">
                  {formData.steps.filter(step => step.trim()).map((step, index) => (
                    <div key={index} className="flex mb-4 p-3 bg-gray-50 rounded border-l-4 border-blue-600">
                      <span className="font-bold text-blue-700 min-w-[30px] text-sm">{index + 1}.</span>
                      <span className="flex-1 text-sm leading-relaxed text-gray-700">{step}</span>
                    </div>
                  ))}
                </div>

                {/* References */}
                {formData.references.some(ref => ref.trim()) && (
                  <>
                    <h2 className="text-xl font-bold text-blue-700 mb-4 pb-2 border-b border-gray-300 uppercase tracking-wide">
                      References
                    </h2>
                    <div className="mb-8 p-5 bg-blue-50 rounded-lg border border-blue-200">
                      {formData.references.filter(ref => ref.trim()).map((ref, index) => (
                        <div key={index} className="text-xs text-gray-600 mb-2 pl-4 relative">
                          <span className="absolute left-0 text-blue-600 font-bold">•</span>
                          {ref}
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* Approval Section */}
                <div className="mt-10">
                  <h2 className="text-xl font-bold text-blue-700 mb-4 pb-2 border-b border-gray-300 uppercase tracking-wide">
                    Approvals
                  </h2>
                  <div className="grid grid-cols-3 gap-5 mt-5">
                    {['Prepared By', 'Reviewed By', 'Approved By'].map((title, index) => (
                      <div key={index} className="border border-gray-300 p-4 text-center bg-gray-50">
                        <div className="text-xs font-bold text-gray-600 uppercase mb-5">{title}</div>
                        <div className="border-b border-gray-900 h-8 mb-2"></div>
                        <div className="text-xs text-gray-500">Signature & Date</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
              <button
                onClick={() => setShowPreview(false)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Close Preview
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Create SOP
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateSOP; 