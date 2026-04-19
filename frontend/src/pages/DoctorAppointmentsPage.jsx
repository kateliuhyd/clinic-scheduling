import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { appointmentAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Calendar, User, Clock, CheckCircle, X, Stethoscope } from 'lucide-react';

export default function DoctorAppointmentsPage() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('BOOKED');
  const [actionLoading, setActionLoading] = useState(null);

  // We need the doctor_id. For simplicity, we'll fetch doctor appointments
  // using the user info. The backend resolves this via user_id.
  useEffect(() => {
    loadAppointments();
  }, [filter]);

  const loadAppointments = async () => {
    setLoading(true);
    try {
      const res = await appointmentAPI.getMyDoctor(filter || undefined);
      setAppointments(res.data.data);
    } catch (err) {
      console.error('Failed to load doctor appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (id) => {
    setActionLoading(id);
    try {
      await appointmentAPI.complete(id);
      loadAppointments();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to complete appointment');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this appointment?')) return;
    setActionLoading(id);
    try {
      await appointmentAPI.cancel(id);
      loadAppointments();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel appointment');
    } finally {
      setActionLoading(null);
    }
  };

  const formatDateTime = (dt) => {
    const d = new Date(dt);
    return d.toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric'
    }) + ' at ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  return (
    <div>
      <div className="page-header">
        <h1>Patient Appointments</h1>
        <p>Manage appointments with your patients</p>
      </div>

      <div className="tabs">
        {['BOOKED', 'COMPLETED', 'CANCELED', ''].map(status => (
          <button key={status} className={`tab ${filter === status ? 'active' : ''}`}
            onClick={() => setFilter(status)}>
            {status || 'All'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading"><div className="spinner" /> Loading appointments...</div>
      ) : appointments.length === 0 ? (
        <div className="empty-state">
          <Calendar size={48} />
          <h3>No appointments found</h3>
          <p>{filter ? `No ${filter.toLowerCase()} appointments.` : 'No appointments yet.'}</p>
        </div>
      ) : (
        <div className="appointment-list">
          {appointments.map(appt => (
            <div key={appt.appointmentId} className="appointment-card">
              <div className="appt-info">
                <h4>
                  <User size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                  {appt.patientFirstName} {appt.patientLastName}
                  <span className={`status-badge status-${appt.status}`} style={{ marginLeft: 12 }}>
                    {appt.status}
                  </span>
                </h4>
                <div className="appt-details">
                  <span className="appt-detail-item">
                    <Stethoscope size={14} /> {appt.serviceName}
                  </span>
                  <span className="appt-detail-item">
                    <Calendar size={14} /> {formatDateTime(appt.slotStartTime)}
                  </span>
                  <span className="appt-detail-item">
                    <Clock size={14} /> {appt.serviceDurationMinutes} min
                  </span>
                </div>
              </div>
              <div className="appt-actions" style={{ display: 'flex', gap: 8 }}>
                <Link to={`/messages?userId=${appt.patientId}`} className="btn btn-outline btn-sm">
                  Message Patient
                </Link>
                {appt.status === 'BOOKED' && (
                  <>
                    <button className="btn btn-success btn-sm"
                      onClick={() => handleComplete(appt.appointmentId)}
                      disabled={actionLoading === appt.appointmentId}>
                      <CheckCircle size={14} /> Complete
                    </button>
                    <button className="btn btn-danger btn-sm"
                      onClick={() => handleCancel(appt.appointmentId)}
                      disabled={actionLoading === appt.appointmentId}>
                      <X size={14} /> Cancel
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
