import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CreateSOP from './pages/CreateSOP';
import ViewSOPs from './pages/ViewSOPs';
import EditSOP from './pages/EditSOP';
import PDFCustomizer from './pages/PDFCustomizer';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/create-sop"
              element={
                <ProtectedRoute>
                  <CreateSOP />
                </ProtectedRoute>
              }
            />
            <Route
              path="/view-sops"
              element={
                <ProtectedRoute>
                  <ViewSOPs />
                </ProtectedRoute>
              }
            />
            <Route
              path="/edit-sop/:id"
              element={
                <ProtectedRoute>
                  <EditSOP />
                </ProtectedRoute>
              }
            />

            <Route
              path="/pdf-customizer/:id"
              element={
                <ProtectedRoute>
                  <PDFCustomizer />
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  );
}

export default App;
