import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider }            from './context/AuthContext';
import { SocketProvider }          from './context/SocketContext';
import ProtectedRoute              from './components/layout/ProtectedRoute';
import AppLayout                   from './components/layout/AppLayout';
import LoginPage                   from './pages/LoginPage';
import DashboardPage               from './pages/DashboardPage';
import PatientsPage                from './pages/PatientsPage';
import PatientDetailPage           from './pages/PatientDetailPage';
import UsersPage                   from './pages/UsersPage';
import CalendarPage                from './pages/CalendarPage';
import QueuePage                   from './pages/QueuePage';
import AuditLogPage                from './pages/AuditLogPage';
import PrintConsultationPage       from './pages/PrintConsultationPage';

export default function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route element={<ProtectedRoute />}>
              {/* ── Print routes (no sidebar) ── */}
              <Route path="/print/consultation/:id" element={<PrintConsultationPage />} />

              {/* ── Main app ── */}
              <Route element={<AppLayout />}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard"    element={<DashboardPage />} />
                <Route path="/patients"     element={<PatientsPage />} />
                <Route path="/patients/:id" element={<PatientDetailPage />} />
                <Route path="/users"        element={<UsersPage />} />
                <Route path="/calendar"     element={<CalendarPage />} />
                <Route path="/queue"        element={<QueuePage />} />
                <Route path="/audit-logs"   element={<AuditLogPage />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
