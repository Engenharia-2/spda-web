import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import Layout from '../../Layout/Layout/index';
import './styles.css';

const ProtectedRoute = ({ role }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="layout-loading-container">
        Carregando...
      </div>
    );
  }

  // 1. Check if user is logged in
  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  // 2. If a specific role is required, check for it
  if (role && currentUser.role !== role) {
    // User is logged in but does not have the required role, redirect to home
    return <Navigate to="/" />;
  }

  // 3. If all checks pass, render the main layout
  return <Layout />;
};

export default ProtectedRoute;
