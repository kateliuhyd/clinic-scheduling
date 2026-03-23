import React, { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { appointmentAPI, slotAPI, messageAPI } from '../services/api';
import {
  Calendar, UserCheck, Shield, Clock, Search, Bell,
  Stethoscope, ClipboardList, FileText, MessageSquare,
  Users, BarChart3, Settings, Activity, AlertCircle
} from 'lucide-react';

// ─── Patient Dashboard ───────────────────────────────────────────
function PatientDashboard({ user }) {
  const [stats, setStats] = useState({ booked: 0, completed: 0, unreadMsgs: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [bookedRes, completedRes, convosRes] = await Promise.all([
        appointmentAPI.getMy('BOOKED'),
        appointmentAPI.getMy('COMPLETED'),
        messageAPI.getConversations()
      ]);
      const unread = (convosRes.data.data || []).reduce((sum, c) => sum + (c.unread_count || 0), 0);
      setStats({
        booked: bookedRes.data.data.length,
        completed: completedRes.data.data.length,
        unreadMsgs: unread
      });
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Welcome back, {user.firstName}!</h1>
        <p>Manage your healthcare appointments and records</p>
      </div>

      {/* Live Stats Bar */}
      <div className="stats-grid" style={{ marginBottom: 28 }}>
        <div className="stat-card">
          <div className="stat-value">{loading ? '—' : stats.booked}</div>
          <div className="stat-label">Upcoming Appointments</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{loading ? '—' : stats.completed}</div>
          <div className="stat-label">Completed Visits</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{loading ? '—' : stats.unreadMsgs}</div>
          <div className="stat-label">Unread Messages</div>
        </div>
      </div>

      <div className="dashboard-grid">
        <Link to="/book" className="dashboard-card dashboard-card-primary">
          <div className="dashboard-card-icon">
            <Search size={28} />
          </div>
          <h3>Book an Appointment</h3>
          <p>Search for doctors by specialty and book a visit.</p>
          <span className="dashboard-card-action">Find a Doctor →</span>
        </Link>

        <Link to="/my-appointments" className="dashboard-card dashboard-card-success">
          <div className="dashboard-card-icon">
            <Calendar size={28} />
          </div>
          <h3>My Appointments</h3>
          <p>View, manage, or cancel your upcoming appointments.</p>
          {stats.booked > 0 && (
            <div style={{ fontSize: 13, color: 'var(--success)', fontWeight: 600, marginBottom: 4 }}>
              {stats.booked} upcoming
            </div>
          )}
          <span className="dashboard-card-action">View Appointments →</span>
        </Link>

        <Link to="/medical-history" className="dashboard-card dashboard-card-purple">
          <div className="dashboard-card-icon">
            <FileText size={28} />
          </div>
          <h3>Medical History</h3>
          <p>Access your visit summaries and medical records.</p>
          <span className="dashboard-card-action">View Records →</span>
        </Link>

        <Link to="/messages" className="dashboard-card dashboard-card-info">
          <div className="dashboard-card-icon">
            <MessageSquare size={28} />
          </div>
          <h3>Messages</h3>
          <p>Send and receive messages with your doctors.</p>
          {stats.unreadMsgs > 0 && (
            <div style={{ fontSize: 13, color: 'var(--info)', fontWeight: 600, marginBottom: 4 }}>
              {stats.unreadMsgs} unread
            </div>
          )}
          <span className="dashboard-card-action">Open Messages →</span>
        </Link>

        <Link to="/doctors" className="dashboard-card dashboard-card-secondary">
          <div className="dashboard-card-icon">
            <Stethoscope size={28} />
          </div>
          <h3>Find a Doctor</h3>
          <p>Browse our network of qualified healthcare providers.</p>
          <span className="dashboard-card-action">Browse Providers →</span>
        </Link>
      </div>
    </div>
  );
}

// ─── Doctor Dashboard ────────────────────────────────────────────
function DoctorDashboard({ user }) {
  const [stats, setStats] = useState({ booked: 0, completed: 0, todayAppts: 0, unreadMsgs: 0 });
  const [loading, setLoading] = useState(true);
  const [upcomingAppts, setUpcomingAppts] = useState([]);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [bookedRes, completedRes, convosRes] = await Promise.all([
        appointmentAPI.getMyDoctor('BOOKED'),
        appointmentAPI.getMyDoctor('COMPLETED'),
        messageAPI.getConversations()
      ]);
      const booked = bookedRes.data.data;
      const unread = (convosRes.data.data || []).reduce((sum, c) => sum + (c.unread_count || 0), 0);

      // Find today's appointments
      const today = new Date().toDateString();
      const todayAppts = booked.filter(a => new Date(a.slotStartTime).toDateString() === today);

      // Upcoming (future booked) sorted by time
      const now = new Date();
      const upcoming = booked
        .filter(a => new Date(a.slotStartTime) >= now)
        .sort((a, b) => new Date(a.slotStartTime) - new Date(b.slotStartTime))
        .slice(0, 5);

      setUpcomingAppts(upcoming);
      setStats({
        booked: booked.length,
        completed: completedRes.data.data.length,
        todayAppts: todayAppts.length,
        unreadMsgs: unread
      });
    } catch (err) {
      console.error('Failed to load doctor stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dt) => {
    const d = new Date(dt);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' at ' +
      d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  return (
    <div>
      <div className="page-header">
        <h1>Doctor's Portal</h1>
        <p>Welcome back, Dr. {user.lastName}</p>
      </div>

      {/* Live Stats Bar */}
      <div className="stats-grid" style={{ marginBottom: 28 }}>
        <div className="stat-card">
          <div className="stat-value">{loading ? '—' : stats.todayAppts}</div>
          <div className="stat-label">Today's Appointments</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{loading ? '—' : stats.booked}</div>
          <div className="stat-label">Pending Appointments</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{loading ? '—' : stats.completed}</div>
          <div className="stat-label">Completed Visits</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{loading ? '—' : stats.unreadMsgs}</div>
          <div className="stat-label">Unread Messages</div>
        </div>
      </div>

      {/* Upcoming appointments preview */}
      {upcomingAppts.length > 0 && (
        <div className="card" style={{ marginBottom: 28 }}>
          <div className="card-header">
            <h3><AlertCircle size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} />Upcoming Patient Appointments</h3>
            <Link to="/doctor/appointments" className="btn btn-outline btn-sm">View All</Link>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Service</th>
                  <th>Date & Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {upcomingAppts.map(appt => (
                  <tr key={appt.appointmentId}>
                    <td>{appt.patientFirstName} {appt.patientLastName}</td>
                    <td>{appt.serviceName}</td>
                    <td>{formatDateTime(appt.slotStartTime)}</td>
                    <td><span className={`status-badge status-${appt.status}`}>{appt.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="dashboard-grid">
        <Link to="/doctor/schedule" className="dashboard-card dashboard-card-primary">
          <div className="dashboard-card-icon">
            <Calendar size={28} />
          </div>
          <h3>My Schedule</h3>
          <p>View your daily and weekly appointment schedule and manage availability.</p>
          <span className="dashboard-card-action">View Schedule →</span>
        </Link>

        <Link to="/doctor/appointments" className="dashboard-card dashboard-card-warning">
          <div className="dashboard-card-icon">
            <ClipboardList size={28} />
          </div>
          <h3>Patient Appointments</h3>
          <p>View and manage appointment bookings from patients.</p>
          {stats.booked > 0 && (
            <div style={{ fontSize: 13, color: 'var(--warning)', fontWeight: 600, marginBottom: 4 }}>
              {stats.booked} pending
            </div>
          )}
          <span className="dashboard-card-action">View Appointments →</span>
        </Link>

        <Link to="/doctor/patient-history" className="dashboard-card dashboard-card-info">
          <div className="dashboard-card-icon">
            <Activity size={28} />
          </div>
          <h3>Patient History</h3>
          <p>Access patient medical records and add new records.</p>
          <span className="dashboard-card-action">View History →</span>
        </Link>

        <Link to="/messages" className="dashboard-card dashboard-card-success">
          <div className="dashboard-card-icon">
            <MessageSquare size={28} />
          </div>
          <h3>Messages</h3>
          <p>Communicate with your patients securely.</p>
          {stats.unreadMsgs > 0 && (
            <div style={{ fontSize: 13, color: 'var(--success)', fontWeight: 600, marginBottom: 4 }}>
              {stats.unreadMsgs} unread
            </div>
          )}
          <span className="dashboard-card-action">Open Messages →</span>
        </Link>
      </div>
    </div>
  );
}

// ─── Public Landing Page ─────────────────────────────────────────
function LandingPage() {
  return (
    <div>
      <section className="hero">
        <h1>Your Health, Your Schedule</h1>
        <p>
          Book appointments with trusted providers at ClinicConnect.
          Easy online scheduling for all your healthcare needs.
        </p>
        <div className="hero-actions">
          <Link to="/register" className="btn btn-primary">Get Started</Link>
          <Link to="/login" className="btn btn-outline">Sign In</Link>
        </div>
      </section>

      <section className="features-grid">
        <div className="feature-card">
          <div className="feature-icon"><Search size={24} /></div>
          <h3>Find Your Provider</h3>
          <p>Browse our network of qualified healthcare providers by specialty, department, or availability.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon"><Calendar size={24} /></div>
          <h3>Easy Scheduling</h3>
          <p>View real-time availability and book appointments online in just a few clicks.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon"><Clock size={24} /></div>
          <h3>Manage Appointments</h3>
          <p>View, cancel, or reschedule your appointments anytime from your personal dashboard.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon"><Shield size={24} /></div>
          <h3>Secure Booking</h3>
          <p>Our system ensures no double-bookings through enterprise-grade transaction management.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon"><UserCheck size={24} /></div>
          <h3>Provider Tools</h3>
          <p>Doctors can easily manage their availability, view schedules, and track appointments.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon"><Bell size={24} /></div>
          <h3>Notifications</h3>
          <p>Receive confirmations and reminders for your upcoming appointments automatically.</p>
        </div>
      </section>
    </div>
  );
}

// ─── Main HomePage Component ─────────────────────────────────────
export default function HomePage() {
  const { isAuthenticated, isPatient, isDoctor, isAdmin, user } = useAuth();

  if (!isAuthenticated) {
    return <LandingPage />;
  }

  if (isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  if (isDoctor) {
    return <DoctorDashboard user={user} />;
  }

  if (isPatient) {
    return <PatientDashboard user={user} />;
  }

  return <LandingPage />;
}
