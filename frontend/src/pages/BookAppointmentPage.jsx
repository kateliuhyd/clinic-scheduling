import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { doctorAPI, serviceAPI, slotAPI, appointmentAPI } from '../services/api';
import { Calendar, Clock, CheckCircle } from 'lucide-react';

export default function BookAppointmentPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [doctors, setDoctors] = useState([]);
  const [services, setServices] = useState([]);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState('');

  const [selectedDoctor, setSelectedDoctor] = useState(searchParams.get('doctorId') || '');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedService, setSelectedService] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (startDate && endDate) {
      loadSlots();
    }
  }, [selectedDoctor, startDate, endDate]);

  const loadInitialData = async () => {
    try {
      const [docRes, svcRes] = await Promise.all([
        doctorAPI.getAll(),
        serviceAPI.getAll()
      ]);
      setDoctors(docRes.data.data);
      setServices(svcRes.data.data);
    } catch (err) {
      console.error('Failed to load data:', err);
    }
  };

  const loadSlots = async () => {
    setLoading(true);
    setSelectedSlot(null);
    try {
      const params = { startDate, endDate };
      if (selectedDoctor) params.doctorId = selectedDoctor;
      const res = await slotAPI.getAvailable(params);
      setSlots(res.data.data);
    } catch (err) {
      console.error('Failed to load slots:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBook = async () => {
    if (!selectedSlot || !selectedService) {
      setError('Please select a time slot and a service.');
      return;
    }
    setError('');
    setBooking(true);
    try {
      const res = await appointmentAPI.book({
        slotId: selectedSlot.slotId,
        serviceId: parseInt(selectedService),
        notes
      });
      setSuccess(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Booking failed. The slot may no longer be available.');
    } finally {
      setBooking(false);
    }
  };

  const formatTime = (dt) => {
    const d = new Date(dt);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const formatDate = (dt) => {
    const d = new Date(dt);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  // Group slots by date
  const groupedSlots = slots.reduce((acc, slot) => {
    const date = new Date(slot.startTime).toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
    });
    if (!acc[date]) acc[date] = [];
    acc[date].push(slot);
    return acc;
  }, {});

  if (success) {
    return (
      <div>
        <div className="card" style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
          <div className="card-body" style={{ padding: 48 }}>
            <CheckCircle size={64} color="var(--success)" style={{ marginBottom: 16 }} />
            <h2 style={{ marginBottom: 8 }}>Appointment Confirmed</h2>
            <p style={{ color: 'var(--gray-600)', marginBottom: 24 }}>
              Your appointment has been successfully booked.
            </p>
            <div className="card" style={{ textAlign: 'left', marginBottom: 24 }}>
              <div className="card-body">
                <p><strong>Appointment ID:</strong> #{success.appointmentId}</p>
                <p><strong>Doctor:</strong> Dr. {success.doctorFirstName} {success.doctorLastName}</p>
                <p><strong>Service:</strong> {success.serviceName}</p>
                <p><strong>Date:</strong> {formatDate(success.slotStartTime)}</p>
                <p><strong>Time:</strong> {formatTime(success.slotStartTime)} - {formatTime(success.slotEndTime)}</p>
                <p><strong>Status:</strong> <span className="status-badge status-BOOKED">{success.status}</span></p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button className="btn btn-primary" onClick={() => navigate('/my-appointments')}>
                View My Appointments
              </button>
              <button className="btn btn-secondary" onClick={() => { setSuccess(null); setSelectedSlot(null); setNotes(''); loadSlots(); }}>
                Book Another
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>Book an Appointment</h1>
        <p>Select a provider, choose a time, and book your visit</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <h3>Search Available Times</h3>
        </div>
        <div className="card-body">
          <div className="filter-bar">
            <div className="form-group">
              <label className="form-label">Doctor</label>
              <select className="form-select" value={selectedDoctor}
                      onChange={e => setSelectedDoctor(e.target.value)}
                      style={{ minWidth: 220 }}>
                <option value="">All Doctors</option>
                {doctors.map(d => (
                  <option key={d.doctorId} value={d.doctorId}>
                    Dr. {d.firstName} {d.lastName} - {d.specialty}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">From</label>
              <input className="form-input" type="date" value={startDate}
                     onChange={e => setStartDate(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">To</label>
              <input className="form-input" type="date" value={endDate}
                     onChange={e => setEndDate(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">&nbsp;</label>
              <button className="btn btn-primary" onClick={loadSlots}>
                <Calendar size={16} /> Search
              </button>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24 }}>
        <div className="card">
          <div className="card-header">
            <h3>Available Time Slots</h3>
            <span style={{ fontSize: 14, color: 'var(--gray-500)' }}>{slots.length} available</span>
          </div>
          <div className="card-body">
            {loading ? (
              <div className="loading"><div className="spinner" /> Loading slots...</div>
            ) : slots.length === 0 ? (
              <div className="empty-state">
                <Calendar size={48} />
                <h3>No available slots</h3>
                <p>Try adjusting your date range or selecting a different doctor.</p>
              </div>
            ) : (
              Object.entries(groupedSlots).map(([date, dateSlots]) => (
                <div key={date} style={{ marginBottom: 24 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--gray-700)', marginBottom: 12 }}>{date}</h4>
                  <div className="slots-grid">
                    {dateSlots.map(slot => (
                      <div
                        key={slot.slotId}
                        className={`slot-card ${selectedSlot?.slotId === slot.slotId ? 'selected' : ''}`}
                        onClick={() => setSelectedSlot(slot)}
                      >
                        <div className="slot-time">
                          <Clock size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                          {formatTime(slot.startTime)}
                        </div>
                        <div className="slot-date">
                          to {formatTime(slot.endTime)}
                        </div>
                        {slot.doctorFirstName && (
                          <div className="slot-doctor">
                            Dr. {slot.doctorFirstName} {slot.doctorLastName}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card" style={{ alignSelf: 'flex-start', position: 'sticky', top: 88 }}>
          <div className="card-header">
            <h3>Booking Details</h3>
          </div>
          <div className="card-body">
            {selectedSlot ? (
              <>
                <div style={{ marginBottom: 16, padding: 16, background: 'var(--primary-bg)', borderRadius: 8 }}>
                  <p style={{ fontWeight: 600, color: 'var(--primary)' }}>
                    {formatDate(selectedSlot.startTime)}
                  </p>
                  <p style={{ fontSize: 18, fontWeight: 700 }}>
                    {formatTime(selectedSlot.startTime)} - {formatTime(selectedSlot.endTime)}
                  </p>
                  {selectedSlot.doctorFirstName && (
                    <p style={{ fontSize: 14, color: 'var(--gray-600)' }}>
                      Dr. {selectedSlot.doctorFirstName} {selectedSlot.doctorLastName}
                    </p>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Service</label>
                  <select className="form-select" value={selectedService}
                          onChange={e => setSelectedService(e.target.value)} required>
                    <option value="">Select a service</option>
                    {services.map(s => (
                      <option key={s.serviceId} value={s.serviceId}>
                        {s.name} ({s.durationMinutes} min) - ${s.price}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Notes (optional)</label>
                  <textarea className="form-textarea" placeholder="Any special requests or symptoms..."
                            value={notes} onChange={e => setNotes(e.target.value)} />
                </div>

                <button className="btn btn-primary btn-block btn-lg" onClick={handleBook}
                        disabled={booking || !selectedService}>
                  {booking ? 'Booking...' : 'Confirm Booking'}
                </button>
              </>
            ) : (
              <div className="empty-state" style={{ padding: 24 }}>
                <Calendar size={32} />
                <h3>Select a Time Slot</h3>
                <p>Click on an available time to get started</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
