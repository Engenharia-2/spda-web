import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout/Layout';
import Dashboard from './components/Dashboard/Dashboard';
import ReportForm from './components/Report/ReportForm';
import ReportList from './components/Report/ReportList';
import ClientList from './components/Clients/ClientList';
import ClientForm from './components/Clients/ClientForm';
import Settings from './components/Settings/Settings';
import AdminRoute from './components/Auth/AdminRoute';
import UserManagement from './components/Admin/UserManagement';
import Login from './components/Auth/Login';

const PrivateRoute = ({ children }) => {
  const { currentUser } = useAuth();
  return currentUser ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={
            <PrivateRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/new-report" element={
            <PrivateRoute>
              <Layout>
                <ReportForm />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/reports" element={
            <PrivateRoute>
              <Layout>
                <ReportList />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/clients" element={
            <PrivateRoute>
              <Layout>
                <ClientList />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/client-form" element={
            <PrivateRoute>
              <Layout>
                <ClientForm />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/settings" element={
            <PrivateRoute>
              <Layout>
                <Settings />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/admin" element={
            <AdminRoute>
              <Layout>
                <UserManagement />
              </Layout>
            </AdminRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
