import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { LayoutProvider } from './contexts/LayoutContext';
import { ThemeProvider } from './contexts/ThemeContext/ThemeContext';

// Layouts
import ProtectedRoute from './components/Auth/ProtectedRoute';

// Pages
import Login from './pages/Auth/Login';
import Dashboard from './pages/Dashboard';
import ReportsPage from './pages/Reports';
import ClientList from './pages/Clients/ClientList';
import ClientForm from './pages/Clients/ClientForm';
import Settings from './pages/Settings';
import UserManagement from './pages/Admin';

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Router>
          <Routes>
            {/* Public Route */}
            <Route path="/login" element={<Login />} />

            {/* Private Routes */}
            <Route
              element={
                <LayoutProvider>
                  <ProtectedRoute />
                </LayoutProvider>
              }
            >
              <Route path="/" element={<Dashboard />} />
              <Route path="/new-report" element={<ReportsPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/clients" element={<ClientList />} />
              <Route path="/client-form" element={<ClientForm />} />
              <Route path="/settings" element={<Settings />} />
            </Route>

            {/* Admin Routes */}
            <Route
              element={
                <LayoutProvider>
                  <ProtectedRoute role="admin" />
                </LayoutProvider>
              }
            >
              <Route path="/admin" element={<UserManagement />} />
            </Route>
          </Routes>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
