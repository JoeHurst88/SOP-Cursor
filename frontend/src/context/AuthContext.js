import React, { createContext, useState, useContext } from 'react';
import { loginUser } from '../api/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const login = async (credentials) => {
    try {
      setLoading(true);
      setError(null);
      const response = await loginUser(credentials);
      console.log('Login successful:', response);
      
      if (!response.token) {
        throw new Error('No token received from server');
      }

      setUser({
        username: credentials.username,
        ...response.user
      });
      localStorage.setItem('token', response.token);
      return response;
    } catch (err) {
      console.error('Login error in context:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 