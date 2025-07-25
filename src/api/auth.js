import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/auth';

export const signup = (username, password) =>
  axios.post(`${API_URL}/signup`, { username, password });

export const login = (username, password) =>
  axios.post(`${API_URL}/login`, { username, password }); 