import React, { useState, useEffect } from 'react';
import { adminAPI, appointmentAPI } from '../services/api';
import { Users, Calendar, CheckCircle, XCircle, Clock, BarChart3 } from 'lucide-react';

export default function AdminDashboardPage() {
  const [dashboard, setDashboard] = useState(null);
  const [users, setUsers] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [dashRes, userRes, apptRes] = await Promise.all([
        adminAPI.getDashboard(),
        adminAPI.getUsers(),
        appointmentAPI.getAll()
      ]);
      setDashboard(dashRes.data.data);
      setUsers(userRes.data.data);
      setAppointments(apptRes.data.data);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (userId) => {
    try {
      await adminAPI.toggleUserActive(userId);
      loadData();
    } catch (err) {
      alert('Failed to update user status');
    }
  };

  const formatDateTime = (dt) => {
    const d = new Date(dt);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' +
      d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  if (loading) {
    return <div className="loading"><div className="spinner" /> Loading dashboard...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1>Admin Dashboard</h1>
        <p>System overview and user management</p>
      </div>

      {dashboard && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{dashboard.totalUsers}</div>
            <div className="stat-label"><Users size={14} style={{ marginRight: 4 }} />Total Users</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{dashboard.totalAppointments}</div>
            <div className="stat-label"><Calendar size={14} style={{ marginRight: 4 }} />Total Appointments</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--success)' }}>{dashboard.bookedAppointments}</div>
            <div className="stat-label"><Clock size={14} style={{ marginRight: 4 }} />Booked</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--primary)' }}>{dashboard.completedAppointments}</div>
            <div className="stat-label"><CheckCircle size={14} style={{ marginRight: 4 }} />Completed</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--error)' }}>{dashboard.canceledAppointments}</div>
            <div className="stat-label"><XCircle size={14} style={{ marginRight: 4 }} />Canceled</div>
          </div>
        </div>
      )}

      <div className="tabs">
        <button className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}>
          <BarChart3 size={14} style={{ marginRight: 4 }} /> Overview
        </button>
        <button className={`tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}>
          <Users size={14} style={{ marginRight: 4 }} /> Users
        </button>
        <button className={`tab ${activeTab === 'appointments' ? 'active' : ''}`}
          onClick={() => setActiveTab('appointments')}>
          <Calendar size={14} style={{ marginRight: 4 }} /> Appointments
        </button>
      </div>

      {activeTab === 'users' && (
        <div className="card">
          <div className="card-body">
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.userId}>
                      <td>{u.userId}</td>
                      <td>{u.firstName} {u.lastName}</td>
                      <td>{u.username}</td>
                      <td>{u.email}</td>
                      <td><span className={`role-tag role-${u.role}`}>{u.role}</span></td>
                      <td>
                        <span className={`status-badge ${u.active ? 'status-AVAILABLE' : 'status-CLOSED'}`}>
                          {u.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <button className="btn btn-secondary btn-sm"
                          onClick={() => handleToggleActive(u.userId)}>
                          {u.active ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'appointments' && (
        <div className="card">
          <div className="card-body">
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Patient</th>
                    <th>Doctor</th>
                    <th>Service</th>
                    <th>Date/Time</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map(a => (
                    <tr key={a.appointmentId}>
                      <td>#{a.appointmentId}</td>
                      <td>{a.patientFirstName} {a.patientLastName}</td>
                      <td>Dr. {a.doctorFirstName} {a.doctorLastName}</td>
                      <td>{a.serviceName}</td>
                      <td>{formatDateTime(a.slotStartTime)}</td>
                      <td><span className={`status-badge status-${a.status}`}>{a.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'overview' && (
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-body">
              <h3 style={{ marginBottom: 16 }}>User Breakdown</h3>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-value">{users.filter(u => u.role === 'PATIENT').length}</div>
                  <div className="stat-label">Patients</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{users.filter(u => u.role === 'DOCTOR').length}</div>
                  <div className="stat-label">Doctors</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{users.filter(u => u.role === 'ADMIN').length}</div>
                  <div className="stat-label">Admins</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value" style={{ color: 'var(--error)' }}>{users.filter(u => !u.active).length}</div>
                  <div className="stat-label">Deactivated</div>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <h3 style={{ marginBottom: 16 }}>Recent Appointments</h3>
              {appointments.length === 0 ? (
                <div className="empty-state">No appointments yet.</div>
              ) : (
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Patient</th>
                        <th>Doctor</th>
                        <th>Service</th>
                        <th>Date/Time</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {appointments.slice(0, 10).map(a => (
                        <tr key={a.appointmentId}>
                          <td>{a.patientFirstName} {a.patientLastName}</td>
                          <td>Dr. {a.doctorFirstName} {a.doctorLastName}</td>
                          <td>{a.serviceName}</td>
                          <td>{formatDateTime(a.slotStartTime)}</td>
                          <td><span className={`status-badge status-${a.status}`}>{a.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
