import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { createSOP } from '../api/sop';

const SOPFormPage = () => {
  const { token } = useContext(AuthContext);
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('');
  const [steps, setSteps] = useState(['']);
  const [responsiblePerson, setResponsiblePerson] = useState('');
  const [date, setDate] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleStepChange = (idx, value) => {
    const newSteps = [...steps];
    newSteps[idx] = value;
    setSteps(newSteps);
  };

  const addStep = () => setSteps([...steps, '']);
  const removeStep = (idx) => setSteps(steps.filter((_, i) => i !== idx));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await createSOP({ title, department, steps, responsiblePerson, date }, token);
      navigate('/');
    } catch {
      setError('Failed to create SOP');
    }
  };

  return (
    <div className="sop-form-container">
      <h2>Create SOP</h2>
      <form onSubmit={handleSubmit}>
        <input type="text" placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} required />
        <input type="text" placeholder="Department" value={department} onChange={e => setDepartment(e.target.value)} required />
        <input type="text" placeholder="Responsible Person" value={responsiblePerson} onChange={e => setResponsiblePerson(e.target.value)} required />
        <input type="date" value={date} onChange={e => setDate(e.target.value)} required />
        <div>
          <label>Steps:</label>
          {steps.map((step, idx) => (
            <div key={idx}>
              <input type="text" value={step} onChange={e => handleStepChange(idx, e.target.value)} required />
              {steps.length > 1 && <button type="button" onClick={() => removeStep(idx)}>-</button>}
              {idx === steps.length - 1 && <button type="button" onClick={addStep}>+</button>}
            </div>
          ))}
        </div>
        <button type="submit">Create</button>
      </form>
      {error && <p style={{color:'red'}}>{error}</p>}
      <button onClick={() => navigate('/')}>Cancel</button>
    </div>
  );
};

export default SOPFormPage; 