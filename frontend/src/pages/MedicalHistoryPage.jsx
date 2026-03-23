import React, { useState, useEffect } from 'react';
import { medicalRecordAPI } from '../services/api';
import { FileText, User, Calendar, Stethoscope, ClipboardList } from 'lucide-react';

export default function MedicalHistoryPage() {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadRecords();
    }, []);

    const loadRecords = async () => {
        try {
            const res = await medicalRecordAPI.getMy();
            setRecords(res.data.data);
        } catch (err) {
            console.error('Failed to load medical records:', err);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dt) => {
        const d = new Date(dt);
        return d.toLocaleDateString('en-US', {
            weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
        });
    };

    if (loading) {
        return <div className="loading"><div className="spinner" /> Loading medical records...</div>;
    }

    return (
        <div>
            <div className="page-header">
                <h1>Medical History</h1>
                <p>View your past visit summaries and medical records</p>
            </div>

            {records.length === 0 ? (
                <div className="empty-state">
                    <FileText size={48} />
                    <h3>No medical records yet</h3>
                    <p>Your medical records will appear here after your doctor completes your visit.</p>
                </div>
            ) : (
                <div>
                    {records.map(record => (
                        <div key={record.recordId} className="record-card">
                            <div className="record-card-header">
                                <h4>
                                    <Stethoscope size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                                    {record.serviceName}
                                </h4>
                                <span style={{ fontSize: 13, color: 'var(--gray-500)' }}>
                                    <Calendar size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                                    {formatDate(record.appointmentDate)}
                                </span>
                            </div>

                            <div style={{ display: 'flex', gap: 8, marginBottom: 16, fontSize: 14, color: 'var(--gray-600)' }}>
                                <User size={14} />
                                Dr. {record.doctorFirstName} {record.doctorLastName}
                                <span style={{ color: 'var(--primary)', fontWeight: 500 }}>
                                    ({record.specialty})
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
            )}
        </div>
    );
}
