import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Calendar, UserCheck, Shield, Clock, Search, Bell } from 'lucide-react';

export default function HomePage() {
  const { isAuthenticated } = useAuth();

  return (
    <div>
      <section className="hero">
        <h1>Your Health, Your Schedule</h1>
        <p>
          Book appointments with trusted providers at ClinicConnect. 
          Easy online scheduling for all your healthcare needs.
        </p>
        <div className="hero-actions">
          {isAuthenticated ? (
            <>
              <Link to="/book" className="btn btn-primary">Book an Appointment</Link>
              <Link to="/doctors" className="btn btn-outline">Browse Providers</Link>
            </>
          ) : (
            <>
              <Link to="/register" className="btn btn-primary">Get Started</Link>
              <Link to="/login" className="btn btn-outline">Sign In</Link>
            </>
          )}
        </div>
      </section>

      <section className="features-grid">
        <div className="feature-card">
          <div className="feature-icon">
            <Search size={24} />
          </div>
          <h3>Find Your Provider</h3>
          <p>Browse our network of qualified healthcare providers by specialty, department, or availability.</p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">
            <Calendar size={24} />
          </div>
          <h3>Easy Scheduling</h3>
          <p>View real-time availability and book appointments online in just a few clicks.</p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">
            <Clock size={24} />
          </div>
          <h3>Manage Appointments</h3>
          <p>View, cancel, or reschedule your appointments anytime from your personal dashboard.</p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">
            <Shield size={24} />
          </div>
          <h3>Secure Booking</h3>
          <p>Our system ensures no double-bookings through enterprise-grade transaction management.</p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">
            <UserCheck size={24} />
          </div>
          <h3>Provider Tools</h3>
          <p>Doctors can easily manage their availability, view schedules, and track appointments.</p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">
            <Bell size={24} />
          </div>
          <h3>Notifications</h3>
          <p>Receive confirmations and reminders for your upcoming appointments automatically.</p>
        </div>
      </section>
    </div>
  );
}
