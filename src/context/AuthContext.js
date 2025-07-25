import React, { createContext, useState, useEffect } from 'react';
import { login as apiLogin, signup as apiSignup } from '../api/auth';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      setUser({ username: localStorage.getItem('username') });
    } else {
      setUser(null);
    }
  }, [token]);

  const login = async (username, password) => {
    const res = await apiLogin(username, password);
    setToken(res.data.token);
    setUser({ username: res.data.username });
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('username', res.data.username);
  };

  const signup = async (username, password) => {
    await apiSignup(username, password);
    // Optionally auto-login after signup
    await login(username, password);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('username');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}; 