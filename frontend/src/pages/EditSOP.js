import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

const EditSOP = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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

  const fetchSOP = useCallback(async () => {
    try {
      const response = await fetch(`http://localhost:5001/api/sops/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch SOP');
      }

      const sop = await response.json();
      setFormData({
        title: sop.title || '',
        department: sop.department || '',
        responsiblePerson: sop.responsiblePerson || '',
        objective: sop.objective || '',
        responsibility: sop.responsibility || '',
        references: sop.references && sop.references.length > 0 ? sop.references : [''],
        procedure: sop.procedure || '',
        steps: sop.steps && sop.steps.length > 0 ? sop.steps : [''],
        effectiveDate: sop.effectiveDate ? new Date(sop.effectiveDate) : new Date(),
        revisionDate: sop.revisionDate ? new Date(sop.revisionDate) : new Date(),
        revisionNumber: sop.revisionNumber || '1.0',
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchSOP();
  }, [fetchSOP]);

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

      const response = await fetch(`http://localhost:5001/api/sops/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(submitData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update SOP');
      }

      navigate('/view-sops');
    } catch (error) {
      console.error('Error updating SOP:', error);
      setError(error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
        <div className="relative py-3 sm:max-w-xl sm:mx-auto">
          <div className="text-center">
            Loading SOP...
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
    <div className="min-h-screen bg-gray-100 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Edit SOP</h2>
            <button
              onClick={() => navigate('/view-sops')}
              className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
            >
              Back to SOPs
            </button>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

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
                      className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => removeReference(index)}
                      disabled={formData.references.length === 1}
                      className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
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
                      disabled={formData.steps.length === 1}
                      className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
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

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate('/view-sops')}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded"
              >
                Update SOP
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditSOP; 