import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute  from './components/layout/ProtectedRoute';
import AppLayout       from './components/layout/AppLayout';
import LoginPage       from './pages/LoginPage';
import DashboardPage   from './pages/DashboardPage';
import PatientsPage    from './pages/PatientsPage';
import PatientDetailPage from './pages/PatientDetailPage';
import UsersPage       from './pages/UsersPage';

export default function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard"         element={<DashboardPage />} />
              <Route path="/patients"          element={<PatientsPage />} />
              <Route path="/patients/:id"      element={<PatientDetailPage />} />
              <Route path="/users"             element={<UsersPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
