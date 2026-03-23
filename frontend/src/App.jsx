import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DoctorsPage from './pages/DoctorsPage';
import BookAppointmentPage from './pages/BookAppointmentPage';
import MyAppointmentsPage from './pages/MyAppointmentsPage';
import DoctorSchedulePage from './pages/DoctorSchedulePage';
import DoctorAppointmentsPage from './pages/DoctorAppointmentsPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import MedicalHistoryPage from './pages/MedicalHistoryPage';
import PatientHistoryPage from './pages/PatientHistoryPage';
import MessagesPage from './pages/MessagesPage';

function AppContent() {
  const location = useLocation();
  const isAuthPage = ['/login', '/register'].includes(location.pathname);

  if (isAuthPage) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Routes>
    );
  }

  return (
    <div className="app-layout">
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/doctors" element={<DoctorsPage />} />
          <Route path="/book" element={
            <ProtectedRoute roles={['PATIENT']}>
              <BookAppointmentPage />
            </ProtectedRoute>
          } />
          <Route path="/my-appointments" element={
            <ProtectedRoute roles={['PATIENT']}>
              <MyAppointmentsPage />
            </ProtectedRoute>
          } />
          <Route path="/medical-history" element={
            <ProtectedRoute roles={['PATIENT']}>
              <MedicalHistoryPage />
            </ProtectedRoute>
          } />
          <Route path="/doctor/schedule" element={
            <ProtectedRoute roles={['DOCTOR']}>
              <DoctorSchedulePage />
            </ProtectedRoute>
          } />
          <Route path="/doctor/appointments" element={
            <ProtectedRoute roles={['DOCTOR']}>
              <DoctorAppointmentsPage />
            </ProtectedRoute>
          } />
          <Route path="/doctor/patient-history" element={
            <ProtectedRoute roles={['DOCTOR']}>
              <PatientHistoryPage />
            </ProtectedRoute>
          } />
          <Route path="/messages" element={
            <ProtectedRoute roles={['PATIENT', 'DOCTOR']}>
              <MessagesPage />
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute roles={['ADMIN']}>
              <AdminDashboardPage />
            </ProtectedRoute>
          } />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}
