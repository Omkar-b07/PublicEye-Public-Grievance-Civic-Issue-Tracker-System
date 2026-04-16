import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './context/AuthContext';

import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import ReportIssue from './pages/ReportIssue';
import IssueDetail from './pages/IssueDetail';
import Admin from './pages/Admin';

import Department from './pages/Department';
import SeniorAuthority from './pages/SeniorAuthority';

const ProtectedRoute = ({ children, requireRole }) => {
  const { user, token } = useAuth();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // If a specific role is required, ensure the user has it.
  // Exception: Let admins see everything for testing purposes if desired, but for now strict roles.
  if (requireRole && user?.role !== requireRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0f172a', color: '#94a3b8', fontSize: '1.1rem' }}>
        Loading...
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        {/* Default: always go to login unless already authenticated */}
        <Route path="/" element={token ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} />
        <Route path="/login" element={token ? <Navigate to="/dashboard" replace /> : <Login />} />
        <Route path="/signup" element={token ? <Navigate to="/dashboard" replace /> : <Signup />} />

        <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="report" element={<ReportIssue />} />
          <Route path="issue/:id" element={<IssueDetail />} />
          <Route path="admin" element={<ProtectedRoute requireRole="admin"><Admin /></ProtectedRoute>} />
          <Route path="department" element={<ProtectedRoute requireRole="department"><Department /></ProtectedRoute>} />
          <Route path="senior-authority" element={<ProtectedRoute requireRole="senior_authority"><SeniorAuthority /></ProtectedRoute>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
