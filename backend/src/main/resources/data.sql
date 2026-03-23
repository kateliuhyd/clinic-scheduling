-- ============================================
-- ClinicConnect - Seed Data
-- ============================================

-- Default admin account (password: admin123)
INSERT IGNORE INTO users (user_id, username, email, password_hash, first_name, last_name, phone, role)
VALUES (1, 'admin', 'admin@clinicconnect.com', '$2a$10$eHztNgjZVocdZ58cuqMQ/esJ2jkpXAFzgzmV23TfPdRg00LemWF9C', 'System', 'Admin', '408-000-0001', 'ADMIN');

-- Sample doctors (password: doctor123)
INSERT IGNORE INTO users (user_id, username, email, password_hash, first_name, last_name, phone, role)
VALUES (2, 'dr.smith', 'smith@clinicconnect.com', '$2a$10$CDN6K4tBclcHRYd9Swur7.WArE8S9MnujmOka9X/67GDniM3CjCwC', 'John', 'Smith', '408-000-0002', 'DOCTOR');

INSERT IGNORE INTO users (user_id, username, email, password_hash, first_name, last_name, phone, role)
VALUES (3, 'dr.johnson', 'johnson@clinicconnect.com', '$2a$10$CDN6K4tBclcHRYd9Swur7.WArE8S9MnujmOka9X/67GDniM3CjCwC', 'Sarah', 'Johnson', '408-000-0003', 'DOCTOR');

INSERT IGNORE INTO users (user_id, username, email, password_hash, first_name, last_name, phone, role)
VALUES (4, 'dr.chen', 'chen@clinicconnect.com', '$2a$10$CDN6K4tBclcHRYd9Swur7.WArE8S9MnujmOka9X/67GDniM3CjCwC', 'Michael', 'Chen', '408-000-0004', 'DOCTOR');

-- Sample patients (password: patient123)
INSERT IGNORE INTO users (user_id, username, email, password_hash, first_name, last_name, phone, role)
VALUES (5, 'patient1', 'patient1@email.com', '$2a$10$j2J5Z/4KxGj/08irSY0.1e3L3b0W83pEelldjqfAQn1sXirVmmvR2', 'Alice', 'Williams', '408-000-0005', 'PATIENT');

INSERT IGNORE INTO users (user_id, username, email, password_hash, first_name, last_name, phone, role)
VALUES (6, 'patient2', 'patient2@email.com', '$2a$10$j2J5Z/4KxGj/08irSY0.1e3L3b0W83pEelldjqfAQn1sXirVmmvR2', 'Bob', 'Brown', '408-000-0006', 'PATIENT');

-- Departments
INSERT IGNORE INTO departments (department_id, name, description)
VALUES (1, 'General Medicine', 'Primary care and general health services');

INSERT IGNORE INTO departments (department_id, name, description)
VALUES (2, 'Pediatrics', 'Healthcare for infants, children, and adolescents');

INSERT IGNORE INTO departments (department_id, name, description)
VALUES (3, 'Dermatology', 'Skin, hair, and nail conditions');

INSERT IGNORE INTO departments (department_id, name, description)
VALUES (4, 'Orthopedics', 'Bone, joint, and muscle care');

-- Doctor profiles
INSERT IGNORE INTO doctors (doctor_id, user_id, department_id, specialty, bio)
VALUES (1, 2, 1, 'Family Medicine', 'Dr. Smith has over 15 years of experience in family medicine and preventive care.');

INSERT IGNORE INTO doctors (doctor_id, user_id, department_id, specialty, bio)
VALUES (2, 3, 2, 'Pediatrics', 'Dr. Johnson specializes in pediatric care with a focus on childhood development.');

INSERT IGNORE INTO doctors (doctor_id, user_id, department_id, specialty, bio)
VALUES (3, 4, 3, 'Dermatology', 'Dr. Chen is a board-certified dermatologist specializing in skin health and cosmetic treatments.');

-- Services
INSERT IGNORE INTO services (service_id, name, description, duration_minutes, price)
VALUES (1, 'General Checkup', 'Routine physical examination and health assessment', 30, 150.00);

INSERT IGNORE INTO services (service_id, name, description, duration_minutes, price)
VALUES (2, 'Follow-up Visit', 'Follow-up consultation for ongoing treatment', 15, 75.00);

INSERT IGNORE INTO services (service_id, name, description, duration_minutes, price)
VALUES (3, 'Vaccination', 'Standard vaccination service', 15, 50.00);

INSERT IGNORE INTO services (service_id, name, description, duration_minutes, price)
VALUES (4, 'Skin Consultation', 'Dermatological examination and consultation', 30, 200.00);

INSERT IGNORE INTO services (service_id, name, description, duration_minutes, price)
VALUES (5, 'Pediatric Checkup', 'Well-child visit and developmental screening', 30, 175.00);

INSERT IGNORE INTO services (service_id, name, description, duration_minutes, price)
VALUES (6, 'Physical Therapy Consultation', 'Initial assessment for physical therapy needs', 45, 250.00);
