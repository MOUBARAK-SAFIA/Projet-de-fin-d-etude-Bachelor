import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

// Pages
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import CreateDiploma from './pages/CreateDiploma';
import DiplomaList from './pages/DiplomaList';
import DiplomaDetail from './pages/DiplomaDetail';
import VerifyDiploma from './pages/VerifyDiploma';
import Verifier from './pages/Verifier';
import VerifierDashboard from './pages/VerifierDashboard';
import Users from './pages/Users';
import Settings from './pages/Settings';

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/login" element={<Home />} />
        <Route path="/register" element={<Home />} />
        <Route path="/verify/:id" element={<VerifyDiploma />} />

        <Route
          path="/verifier"
          element={
            <ProtectedRoute>
              <Layout>
                <VerifierDashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/verifier/verify"
          element={
            <ProtectedRoute>
              <Layout>
                <Verifier />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/diplomas"
          element={
            <ProtectedRoute>
              <Layout>
                <DiplomaList />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/diplomas/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <DiplomaDetail />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/create"
          element={
            <ProtectedRoute>
              <Layout>
                <CreateDiploma />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/users"
          element={
            <ProtectedRoute>
              <Layout>
                <Users />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Layout>
                <Settings />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
