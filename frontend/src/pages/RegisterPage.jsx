import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { Heart } from 'lucide-react';

export default function RegisterPage() {
  const [form, setForm] = useState({
    username: '', email: '', password: '',
    firstName: '', lastName: '', phone: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authAPI.register(form);
      const { token, userId, username, role, firstName, lastName } = res.data.data;
      login({ userId, username, role, firstName, lastName }, token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="brand-header">
          <Heart size={28} style={{ marginRight: 8, verticalAlign: 'middle' }} />
          ClinicConnect
        </div>
        <h1>Create Account</h1>
        <p className="auth-subtitle">Join ClinicConnect to start booking appointments</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">First Name</label>
              <input className="form-input" type="text" placeholder="First name"
                     value={form.firstName}
                     onChange={e => setForm({ ...form, firstName: e.target.value })}
                     required />
            </div>
            <div className="form-group">
              <label className="form-label">Last Name</label>
              <input className="form-input" type="text" placeholder="Last name"
                     value={form.lastName}
                     onChange={e => setForm({ ...form, lastName: e.target.value })}
                     required />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Username</label>
            <input className="form-input" type="text" placeholder="Choose a username"
                   value={form.username}
                   onChange={e => setForm({ ...form, username: e.target.value })}
                   required />
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" placeholder="your@email.com"
                   value={form.email}
                   onChange={e => setForm({ ...form, email: e.target.value })}
                   required />
          </div>

          <div className="form-group">
            <label className="form-label">Phone (optional)</label>
            <input className="form-input" type="tel" placeholder="408-000-0000"
                   value={form.phone}
                   onChange={e => setForm({ ...form, phone: e.target.value })} />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" placeholder="Min 6 characters"
                   value={form.password}
                   onChange={e => setForm({ ...form, password: e.target.value })}
                   required minLength={6} />
          </div>

          <button className="btn btn-primary btn-block btn-lg" type="submit" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
