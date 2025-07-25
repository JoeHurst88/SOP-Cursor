import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api/sops';

const authHeader = (token) => ({ headers: { Authorization: `Bearer ${token}` } });

export const getSOPs = (token) => axios.get(API_URL, authHeader(token));
export const getSOP = (id, token) => axios.get(`${API_URL}/${id}`, authHeader(token));
export const createSOP = (data, token) => axios.post(API_URL, data, authHeader(token));
export const updateSOP = (id, data, token) => axios.put(`${API_URL}/${id}`, data, authHeader(token));
export const deleteSOP = (id, token) => axios.delete(`${API_URL}/${id}`, authHeader(token));
export const exportSOPtoPDF = (id, token) => axios.get(`${API_URL}/${id}/export`, { ...authHeader(token), responseType: 'blob' }); 