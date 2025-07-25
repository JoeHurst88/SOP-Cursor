import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { getSOPs, deleteSOP, exportSOPtoPDF } from '../api/sop';

const DashboardPage = () => {
  const { token, user, logout } = useContext(AuthContext);
  const [sops, setSOPs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchSOPs = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getSOPs(token);
      setSOPs(res.data);
    } catch (err) {
      setError('Failed to load SOPs');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSOPs();
    // eslint-disable-next-line
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this SOP?')) return;
    try {
      await deleteSOP(id, token);
      setSOPs(sops.filter(sop => sop._id !== id));
    } catch {
      alert('Delete failed');
    }
  };

  const handleExport = async (id, title) => {
    try {
      const res = await exportSOPtoPDF(id, token);
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${title.replace(/[^a-z0-9]/gi, '_')}_SOP.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      alert('Export failed');
    }
  };

  return (
    <div className="dashboard-container">
      <h2>Welcome, {user?.username}</h2>
      <button onClick={logout}>Logout</button>
      <h3>Your SOPs</h3>
      <button onClick={() => navigate('/create')}>Create New SOP</button>
      {loading ? <p>Loading...</p> : error ? <p style={{color:'red'}}>{error}</p> : (
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Department</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sops.map(sop => (
              <tr key={sop._id}>
                <td>{sop.title}</td>
                <td>{sop.department}</td>
                <td>{new Date(sop.date).toLocaleDateString()}</td>
                <td>
                  <button onClick={() => navigate(`/edit/${sop._id}`)}>Edit</button>
                  <button onClick={() => handleDelete(sop._id)}>Delete</button>
                  <button onClick={() => handleExport(sop._id, sop.title)}>Export PDF</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default DashboardPage; 