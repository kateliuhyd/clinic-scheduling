import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Heart, LogOut, MessageSquare } from 'lucide-react';

export default function Navbar() {
  const { user, isAuthenticated, isPatient, isDoctor, isAdmin, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path ? 'nav-link active' : 'nav-link';

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          <Heart size={24} />
          ClinicConnect
        </Link>

        <div className="navbar-nav">
          <Link to="/" className={isActive('/')}>Home</Link>
          <Link to="/doctors" className={isActive('/doctors')}>Find a Doctor</Link>

          {isAuthenticated && isPatient && (
            <>
              <Link to="/book" className={isActive('/book')}>Book Appointment</Link>
              <Link to="/my-appointments" className={isActive('/my-appointments')}>My Appointments</Link>
              <Link to="/medical-history" className={isActive('/medical-history')}>Medical History</Link>
              <Link to="/messages" className={isActive('/messages')}>
                <MessageSquare size={14} style={{ marginRight: 4 }} />Messages
              </Link>
            </>
          )}

          {isAuthenticated && isDoctor && (
            <>
              <Link to="/doctor/schedule" className={isActive('/doctor/schedule')}>My Schedule</Link>
              <Link to="/doctor/appointments" className={isActive('/doctor/appointments')}>Appointments</Link>
              <Link to="/doctor/patient-history" className={isActive('/doctor/patient-history')}>Patient History</Link>
              <Link to="/messages" className={isActive('/messages')}>
                <MessageSquare size={14} style={{ marginRight: 4 }} />Messages
              </Link>
            </>
          )}

          {isAuthenticated && isAdmin && (
            <Link to="/admin" className={isActive('/admin')}>Dashboard</Link>
          )}
        </div>

        <div className="navbar-actions">
          {isAuthenticated ? (
            <>
              <div className="user-badge">
                <span>{user.firstName} {user.lastName}</span>
                <span className={`role-tag role-${user.role}`}>{user.role}</span>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-secondary btn-sm">Sign In</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Sign Up</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
