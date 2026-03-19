import React, { useState, useEffect } from 'react';
import { appointmentAPI } from '../services/api';
import { Calendar, Clock, User, Stethoscope, X, FileText } from 'lucide-react';

export default function MyAppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [canceling, setCanceling] = useState(null);

  useEffect(() => {
    loadAppointments();
  }, [filter]);

  const loadAppointments = async () => {
    setLoading(true);
    try {
      const res = await appointmentAPI.getMy(filter || undefined);
      setAppointments(res.data.data);
    } catch (err) {
      console.error('Failed to load appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    setCanceling(id);
    try {
      await appointmentAPI.cancel(id);
      loadAppointments();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel appointment');
    } finally {
      setCanceling(null);
    }
  };

  const formatDateTime = (dt) => {
    const d = new Date(dt);
    return d.toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
    }) + ' at ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  return (
    <div>
      <div className="page-header">
        <h1>My Appointments</h1>
        <p>View and manage your upcoming and past appointments</p>
      </div>

      <div className="tabs">
        {['', 'BOOKED', 'COMPLETED', 'CANCELED'].map(status => (
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
          <p>{filter ? `No ${filter.toLowerCase()} appointments.` : 'You haven\'t booked any appointments yet.'}</p>
        </div>
      ) : (
        <div className="appointment-list">
          {appointments.map(appt => (
            <div key={appt.appointmentId} className="appointment-card">
              <div className="appt-info">
                <h4>
                  <Stethoscope size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                  {appt.serviceName}
                  <span className={`status-badge status-${appt.status}`} style={{ marginLeft: 12 }}>
                    {appt.status}
                  </span>
                </h4>
                <div className="appt-details">
                  <span className="appt-detail-item">
                    <User size={14} /> Dr. {appt.doctorFirstName} {appt.doctorLastName}
                    {appt.specialty && ` (${appt.specialty})`}
                  </span>
                  <span className="appt-detail-item">
                    <Calendar size={14} /> {formatDateTime(appt.slotStartTime)}
                  </span>
                  <span className="appt-detail-item">
                    <Clock size={14} /> {appt.serviceDurationMinutes} min
                  </span>
                  {appt.notes && (
                    <span className="appt-detail-item">
                      <FileText size={14} /> {appt.notes}
                    </span>
                  )}
                </div>
              </div>
              <div className="appt-actions">
                {appt.status === 'BOOKED' && (
                  <button className="btn btn-danger btn-sm"
                          onClick={() => handleCancel(appt.appointmentId)}
                          disabled={canceling === appt.appointmentId}>
                    <X size={14} />
                    {canceling === appt.appointmentId ? 'Canceling...' : 'Cancel'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
