import React, { useState, useEffect } from 'react';
import { slotAPI } from '../services/api';
import { Calendar, Plus, X, Clock, Lock } from 'lucide-react';

export default function DoctorSchedulePage() {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );

  const [showSingleForm, setShowSingleForm] = useState(false);
  const [showBatchForm, setShowBatchForm] = useState(false);

  // Single slot form
  const [singleSlot, setSingleSlot] = useState({ startTime: '', endTime: '' });

  // Batch form
  const [batchForm, setBatchForm] = useState({
    startDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    startHour: 9,
    endHour: 17,
    slotDurationMinutes: 30
  });

  useEffect(() => {
    loadSchedule();
  }, [startDate, endDate]);

  const loadSchedule = async () => {
    setLoading(true);
    try {
      const res = await slotAPI.getMySchedule({ startDate, endDate });
      setSlots(res.data.data);
    } catch (err) {
      console.error('Failed to load schedule:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSingle = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await slotAPI.create(singleSlot);
      setSuccess('Slot created successfully');
      setShowSingleForm(false);
      setSingleSlot({ startTime: '', endTime: '' });
      loadSchedule();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create slot');
    }
  };

  const handleCreateBatch = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await slotAPI.batchCreate(batchForm);
      setSuccess(`Created ${res.data.data.length} slots successfully`);
      setShowBatchForm(false);
      loadSchedule();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create slots');
    }
  };

  const handleCloseSlot = async (slotId) => {
    try {
      await slotAPI.close(slotId);
      loadSchedule();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to close slot');
    }
  };

  const handleDeleteSlot = async (slotId) => {
    if (!window.confirm('Delete this slot?')) return;
    try {
      await slotAPI.delete(slotId);
      loadSchedule();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete slot');
    }
  };

  const formatTime = (dt) => new Date(dt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  const formatDate = (dt) => new Date(dt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  const today = new Date().toISOString().split('T')[0];

  // Filter out expired slots (past end time), then group by date
  const now = new Date();
  const activeSlots = slots.filter(slot => new Date(slot.endTime) > now);

  const groupedSlots = activeSlots.reduce((acc, slot) => {
    const date = new Date(slot.startTime).toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
    });
    if (!acc[date]) acc[date] = [];
    acc[date].push(slot);
    return acc;
  }, {});

  return (
    <div>
      <div className="page-header">
        <h1>Manage Schedule</h1>
        <p>Create availability slots and manage your schedule</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <button className="btn btn-primary" onClick={() => { setShowSingleForm(!showSingleForm); setShowBatchForm(false); }}>
          <Plus size={16} /> Add Single Slot
        </button>
        <button className="btn btn-outline" onClick={() => { setShowBatchForm(!showBatchForm); setShowSingleForm(false); }}>
          <Calendar size={16} /> Batch Generate
        </button>
      </div>

      {showSingleForm && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header"><h3>Create Single Slot</h3></div>
          <div className="card-body">
            <form onSubmit={handleCreateSingle}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Start Time</label>
                  <input className="form-input" type="datetime-local"
                    value={singleSlot.startTime}
                    min={new Date().toISOString().slice(0, 16)}
                    onChange={e => setSingleSlot({ ...singleSlot, startTime: e.target.value })}
                    required />
                </div>
                <div className="form-group">
                  <label className="form-label">End Time</label>
                  <input className="form-input" type="datetime-local"
                    value={singleSlot.endTime}
                    min={new Date().toISOString().slice(0, 16)}
                    onChange={e => setSingleSlot({ ...singleSlot, endTime: e.target.value })}
                    required />
                </div>
              </div>
              <button className="btn btn-primary" type="submit">Create Slot</button>
              <button className="btn btn-secondary" type="button" style={{ marginLeft: 8 }}
                onClick={() => setShowSingleForm(false)}>Cancel</button>
            </form>
          </div>
        </div>
      )}

      {showBatchForm && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header"><h3>Batch Generate Slots</h3></div>
          <div className="card-body">
            <form onSubmit={handleCreateBatch}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Start Date</label>
                  <input className="form-input" type="date"
                    value={batchForm.startDate}
                    min={today}
                    onChange={e => setBatchForm({ ...batchForm, startDate: e.target.value })}
                    required />
                </div>
                <div className="form-group">
                  <label className="form-label">End Date</label>
                  <input className="form-input" type="date"
                    value={batchForm.endDate}
                    min={today}
                    onChange={e => setBatchForm({ ...batchForm, endDate: e.target.value })}
                    required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Daily Start Hour</label>
                  <select className="form-select" value={batchForm.startHour}
                    onChange={e => setBatchForm({ ...batchForm, startHour: parseInt(e.target.value) })}>
                    {Array.from({ length: 14 }, (_, i) => i + 6).map(h => (
                      <option key={h} value={h}>{h}:00 ({(h % 12) || 12}:00 {h >= 12 ? 'PM' : 'AM'})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Daily End Hour</label>
                  <select className="form-select" value={batchForm.endHour}
                    onChange={e => setBatchForm({ ...batchForm, endHour: parseInt(e.target.value) })}>
                    {Array.from({ length: 14 }, (_, i) => i + 7).map(h => (
                      <option key={h} value={h}>{h}:00 ({(h % 12) || 12}:00 {h >= 12 ? 'PM' : 'AM'})</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-group" style={{ maxWidth: 300 }}>
                <label className="form-label">Slot Duration (minutes)</label>
                <select className="form-select" value={batchForm.slotDurationMinutes}
                  onChange={e => setBatchForm({ ...batchForm, slotDurationMinutes: parseInt(e.target.value) })}>
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>60 minutes</option>
                </select>
              </div>
              <button className="btn btn-primary" type="submit">Generate Slots</button>
              <button className="btn btn-secondary" type="button" style={{ marginLeft: 8 }}
                onClick={() => setShowBatchForm(false)}>Cancel</button>
            </form>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h3>My Schedule</h3>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <input className="form-input" type="date" value={startDate}
              min={today}
              onChange={e => setStartDate(e.target.value)} style={{ width: 'auto' }} />
            <span>to</span>
            <input className="form-input" type="date" value={endDate}
              min={today}
              onChange={e => setEndDate(e.target.value)} style={{ width: 'auto' }} />
          </div>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="loading"><div className="spinner" /> Loading schedule...</div>
          ) : activeSlots.length === 0 ? (
            <div className="empty-state">
              <Calendar size={48} />
              <h3>No slots in this range</h3>
              <p>Create availability slots to allow patients to book appointments.</p>
            </div>
          ) : (
            Object.entries(groupedSlots).map(([date, dateSlots]) => (
              <div key={date} style={{ marginBottom: 24 }}>
                <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--gray-700)', marginBottom: 12 }}>{date}</h4>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Time</th>
                        <th>Duration</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dateSlots.map(slot => (
                        <tr key={slot.slotId}>
                          <td>
                            <Clock size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                            {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                          </td>
                          <td>
                            {Math.round((new Date(slot.endTime) - new Date(slot.startTime)) / 60000)} min
                          </td>
                          <td>
                            <span className={`status-badge status-${slot.status} slot-status`}>
                              {slot.status}
                            </span>
                          </td>
                          <td>
                            {slot.status === 'AVAILABLE' && (
                              <>
                                <button className="btn btn-secondary btn-sm" style={{ marginRight: 8 }}
                                  onClick={() => handleCloseSlot(slot.slotId)}>
                                  <Lock size={12} /> Close
                                </button>
                                <button className="btn btn-danger btn-sm"
                                  onClick={() => handleDeleteSlot(slot.slotId)}>
                                  <X size={12} /> Delete
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
