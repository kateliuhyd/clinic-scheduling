import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { doctorAPI, departmentAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { User, Calendar } from 'lucide-react';

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [docRes, deptRes] = await Promise.all([
        doctorAPI.getAll(),
        departmentAPI.getAll()
      ]);
      setDoctors(docRes.data.data);
      setDepartments(deptRes.data.data);
    } catch (err) {
      console.error('Failed to load doctors:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredDoctors = selectedDept
    ? doctors.filter(d => d.departmentId === parseInt(selectedDept))
    : doctors;

  if (loading) {
    return <div className="loading"><div className="spinner" /> Loading providers...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1>Find a Doctor</h1>
        <p>Browse our network of qualified healthcare providers</p>
      </div>

      <div className="filter-bar">
        <div className="form-group">
          <label className="form-label">Filter by Department</label>
          <select className="form-select" value={selectedDept}
                  onChange={e => setSelectedDept(e.target.value)}
                  style={{ minWidth: 220 }}>
            <option value="">All Departments</option>
            {departments.map(d => (
              <option key={d.departmentId} value={d.departmentId}>{d.name}</option>
            ))}
          </select>
        </div>
      </div>

      {filteredDoctors.length === 0 ? (
        <div className="empty-state">
          <User size={48} />
          <h3>No providers found</h3>
          <p>Try a different department filter.</p>
        </div>
      ) : (
        <div className="doctor-grid">
          {filteredDoctors.map(doc => (
            <div key={doc.doctorId} className="doctor-card">
              <div className="doctor-card-header">
                <div className="doctor-avatar">
                  {doc.firstName?.charAt(0)}{doc.lastName?.charAt(0)}
                </div>
                <div>
                  <h3>Dr. {doc.firstName} {doc.lastName}</h3>
                  <div className="specialty">{doc.specialty}</div>
                  <div className="department">{doc.departmentName}</div>
                </div>
              </div>
              {doc.bio && <p className="bio">{doc.bio}</p>}
              {isAuthenticated && (
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <Link to={`/book?doctorId=${doc.doctorId}`} className="btn btn-primary btn-sm" style={{ flex: 1 }}>
                    <Calendar size={14} /> Book Appointment
                  </Link>
                  <Link to={`/messages?userId=${doc.userId}`} className="btn btn-outline btn-sm">
                    Message
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
