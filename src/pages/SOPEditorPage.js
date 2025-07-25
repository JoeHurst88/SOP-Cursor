import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { getSOP, updateSOP } from '../api/sop';

const SOPEditorPage = () => {
  const { token } = useContext(AuthContext);
  const { id } = useParams();
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('');
  const [steps, setSteps] = useState(['']);
  const [responsiblePerson, setResponsiblePerson] = useState('');
  const [date, setDate] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSOP = async () => {
      try {
        const res = await getSOP(id, token);
        setTitle(res.data.title);
        setDepartment(res.data.department);
        setSteps(res.data.steps);
        setResponsiblePerson(res.data.responsiblePerson);
        setDate(res.data.date.split('T')[0]);
      } catch {
        setError('Failed to load SOP');
      }
      setLoading(false);
    };
    fetchSOP();
    // eslint-disable-next-line
  }, [id]);

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
      await updateSOP(id, { title, department, steps, responsiblePerson, date }, token);
      navigate('/');
    } catch {
      setError('Failed to update SOP');
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="sop-form-container">
      <h2>Edit SOP</h2>
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
        <button type="submit">Update</button>
      </form>
      {error && <p style={{color:'red'}}>{error}</p>}
      <button onClick={() => navigate('/')}>Cancel</button>
    </div>
  );
};

export default SOPEditorPage; 