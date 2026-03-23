import React, { useState, useEffect } from 'react';
import { appointmentAPI, medicalRecordAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Search, User, Calendar, FileText, Plus, X } from 'lucide-react';

export default function PatientHistoryPage() {
    const { user } = useAuth();
    const [appointments, setAppointments] = useState([]);
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchPatientId, setSearchPatientId] = useState('');
    const [searchedPatient, setSearchedPatient] = useState(null);
    const [showRecordForm, setShowRecordForm] = useState(null);
    const [recordForm, setRecordForm] = useState({ diagnosis: '', treatment: '', notes: '' });
    const [saving, setSaving] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');

    const loadPatientHistory = async (patientId) => {
        setLoading(true);
        setSuccessMsg('');
        try {
            const [apptRes, recordRes] = await Promise.all([
                appointmentAPI.getMyDoctor(),
                medicalRecordAPI.getByPatient(patientId)
            ]);
            // Filter appointments to only show those for this specific patient
            const patientAppts = apptRes.data.data.filter(a => a.patientId === parseInt(patientId));
            setAppointments(patientAppts);
            setRecords(recordRes.data.data);
            if (patientAppts.length > 0) {
                setSearchedPatient({
                    id: patientId,
                    name: `${patientAppts[0].patientFirstName} ${patientAppts[0].patientLastName}`
                });
            } else {
                setSearchedPatient({ id: patientId, name: `Patient #${patientId}` });
            }
        } catch (err) {
            console.error('Failed to load patient history:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchPatientId.trim()) {
            loadPatientHistory(searchPatientId.trim());
        }
    };

    const handleCreateRecord = async (appointmentId) => {
        setSaving(true);
        try {
            await medicalRecordAPI.create({
                appointmentId,
                ...recordForm
            });
            setShowRecordForm(null);
            setRecordForm({ diagnosis: '', treatment: '', notes: '' });
            setSuccessMsg('Medical record created successfully!');
            loadPatientHistory(searchPatientId);
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to create record');
        } finally {
            setSaving(false);
        }
    };

    const formatDate = (dt) => {
        const d = new Date(dt);
        return d.toLocaleDateString('en-US', {
            weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
        });
    };

    const hasRecord = (appointmentId) => {
        return records.some(r => r.appointmentId === appointmentId);
    };

    return (
        <div>
            <div className="page-header">
                <h1>Patient History</h1>
                <p>Search for a patient and view their appointment history and medical records</p>
            </div>

            {successMsg && <div className="alert alert-success">{successMsg}</div>}

            <div className="card" style={{ marginBottom: 24 }}>
                <div className="card-header">
                    <h3>Search Patient</h3>
                </div>
                <div className="card-body">
                    <form onSubmit={handleSearch} style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
                        <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                            <label className="form-label">Patient User ID</label>
                            <input
                                className="form-input"
                                type="text"
                                placeholder="Enter patient user ID (e.g., 5)"
                                value={searchPatientId}
                                onChange={e => setSearchPatientId(e.target.value)}
                            />
                        </div>
                        <button className="btn btn-primary" type="submit">
                            <Search size={16} /> Search
                        </button>
                    </form>
                </div>
            </div>

            {loading && (
                <div className="loading"><div className="spinner" /> Loading patient history...</div>
            )}

            {!loading && searchedPatient && (
                <>
                    <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 20 }}>
                        <User size={20} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                        {searchedPatient.name}
                    </h2>

                    {/* Appointments Section */}
                    <div className="card" style={{ marginBottom: 24 }}>
                        <div className="card-header">
                            <h3>Appointment History</h3>
                            <span style={{ fontSize: 14, color: 'var(--gray-500)' }}>{appointments.length} appointments</span>
                        </div>
                        <div className="card-body">
                            {appointments.length === 0 ? (
                                <div className="empty-state" style={{ padding: 24 }}>
                                    <Calendar size={32} />
                                    <h3>No appointments found</h3>
                                    <p>This patient has no appointments with you.</p>
                                </div>
                            ) : (
                                <div className="table-container">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Date</th>
                                                <th>Service</th>
                                                <th>Status</th>
                                                <th>Notes</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {appointments.map(appt => (
                                                <tr key={appt.appointmentId}>
                                                    <td>{formatDate(appt.slotStartTime)}</td>
                                                    <td>{appt.serviceName}</td>
                                                    <td>
                                                        <span className={`status-badge status-${appt.status}`}>{appt.status}</span>
                                                    </td>
                                                    <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        {appt.notes || '—'}
                                                    </td>
                                                    <td>
                                                        {appt.status === 'COMPLETED' && !hasRecord(appt.appointmentId) && (
                                                            <button
                                                                className="btn btn-primary btn-sm"
                                                                onClick={() => {
                                                                    setShowRecordForm(appt.appointmentId);
                                                                    setRecordForm({ diagnosis: '', treatment: '', notes: '' });
                                                                }}
                                                            >
                                                                <Plus size={14} /> Add Record
                                                            </button>
                                                        )}
                                                        {hasRecord(appt.appointmentId) && (
                                                            <span style={{ fontSize: 13, color: 'var(--success)' }}>
                                                                <FileText size={14} style={{ verticalAlign: 'middle' }} /> Record exists
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Add Record Form */}
                    {showRecordForm && (
                        <div className="card" style={{ marginBottom: 24 }}>
                            <div className="card-header">
                                <h3>Add Medical Record</h3>
                                <button className="btn btn-secondary btn-sm" onClick={() => setShowRecordForm(null)}>
                                    <X size={14} /> Cancel
                                </button>
                            </div>
                            <div className="card-body">
                                <div className="form-group">
                                    <label className="form-label">Diagnosis</label>
                                    <textarea
                                        className="form-textarea"
                                        placeholder="Enter diagnosis..."
                                        value={recordForm.diagnosis}
                                        onChange={e => setRecordForm({ ...recordForm, diagnosis: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Treatment</label>
                                    <textarea
                                        className="form-textarea"
                                        placeholder="Enter treatment plan..."
                                        value={recordForm.treatment}
                                        onChange={e => setRecordForm({ ...recordForm, treatment: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Additional Notes</label>
                                    <textarea
                                        className="form-textarea"
                                        placeholder="Any additional notes..."
                                        value={recordForm.notes}
                                        onChange={e => setRecordForm({ ...recordForm, notes: e.target.value })}
                                    />
                                </div>
                                <button
                                    className="btn btn-primary"
                                    onClick={() => handleCreateRecord(showRecordForm)}
                                    disabled={saving}
                                >
                                    {saving ? 'Saving...' : 'Save Medical Record'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Medical Records Section */}
                    {records.length > 0 && (
                        <div className="card">
                            <div className="card-header">
                                <h3>Medical Records</h3>
                            </div>
                            <div className="card-body">
                                {records.map(record => (
                                    <div key={record.recordId} className="record-card">
                                        <div className="record-card-header">
                                            <h4>{record.serviceName}</h4>
                                            <span style={{ fontSize: 13, color: 'var(--gray-500)' }}>
                                                {formatDate(record.appointmentDate)}
                                            </span>
                                        </div>
                                        {record.diagnosis && (
                                            <div className="record-field">
                                                <div className="record-field-label">Diagnosis</div>
                                                <div className="record-field-value">{record.diagnosis}</div>
                                            </div>
                                        )}
                                        {record.treatment && (
                                            <div className="record-field">
                                                <div className="record-field-label">Treatment</div>
                                                <div className="record-field-value">{record.treatment}</div>
                                            </div>
                                        )}
                                        {record.notes && (
                                            <div className="record-field">
                                                <div className="record-field-label">Notes</div>
                                                <div className="record-field-value">{record.notes}</div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
