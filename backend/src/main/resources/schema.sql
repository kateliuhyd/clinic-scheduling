-- ============================================
-- ClinicConnect Database Schema
-- MySQL DDL - Handwritten SQL
-- ============================================

CREATE DATABASE IF NOT EXISTS clinic_connect;
USE clinic_connect;

-- -------------------------------------------
-- Table: users
-- Purpose: All user accounts (PATIENT, DOCTOR, ADMIN)
-- -------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    user_id      BIGINT       AUTO_INCREMENT PRIMARY KEY,
    username     VARCHAR(50)  NOT NULL UNIQUE,
    email        VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name   VARCHAR(50)  NOT NULL,
    last_name    VARCHAR(50)  NOT NULL,
    phone        VARCHAR(20),
    role         ENUM('PATIENT', 'DOCTOR', 'ADMIN') NOT NULL DEFAULT 'PATIENT',
    active       BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_users_role (role),
    INDEX idx_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------
-- Table: departments
-- Purpose: Clinic departments for organizing doctors
-- -------------------------------------------
CREATE TABLE IF NOT EXISTS departments (
    department_id BIGINT       AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(100) NOT NULL UNIQUE,
    description   TEXT,
    active        BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------
-- Table: doctors
-- Purpose: Doctor profiles linked to user accounts
-- One-to-one with users (where role = 'DOCTOR')
-- -------------------------------------------
CREATE TABLE IF NOT EXISTS doctors (
    doctor_id     BIGINT       AUTO_INCREMENT PRIMARY KEY,
    user_id       BIGINT       NOT NULL UNIQUE,
    department_id BIGINT,
    specialty     VARCHAR(100) NOT NULL,
    bio           TEXT,
    active        BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_doctor_user
        FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_doctor_department
        FOREIGN KEY (department_id) REFERENCES departments(department_id)
        ON DELETE SET NULL ON UPDATE CASCADE,

    INDEX idx_doctors_specialty (specialty),
    INDEX idx_doctors_department (department_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------
-- Table: services
-- Purpose: Clinic services with duration and pricing
-- -------------------------------------------
CREATE TABLE IF NOT EXISTS services (
    service_id       BIGINT        AUTO_INCREMENT PRIMARY KEY,
    name             VARCHAR(100)  NOT NULL,
    description      TEXT,
    duration_minutes INT           NOT NULL DEFAULT 30,
    price            DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    active           BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_services_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------
-- Table: availability_slots
-- Purpose: Provider time windows for booking
-- Status: AVAILABLE, BOOKED, CLOSED
-- Uses pessimistic locking for concurrent booking
-- -------------------------------------------
CREATE TABLE IF NOT EXISTS availability_slots (
    slot_id      BIGINT    AUTO_INCREMENT PRIMARY KEY,
    doctor_id    BIGINT    NOT NULL,
    start_time   DATETIME  NOT NULL,
    end_time     DATETIME  NOT NULL,
    status       ENUM('AVAILABLE', 'BOOKED', 'CLOSED') NOT NULL DEFAULT 'AVAILABLE',
    created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    version      INT       NOT NULL DEFAULT 0,

    CONSTRAINT fk_slot_doctor
        FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    CONSTRAINT chk_slot_time CHECK (end_time > start_time),

    INDEX idx_slots_doctor_status (doctor_id, status),
    INDEX idx_slots_start_time (start_time),
    INDEX idx_slots_doctor_time (doctor_id, start_time, end_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------
-- Table: appointments
-- Purpose: Booked appointments linking patient, doctor, service, slot
-- Status: BOOKED, CANCELED, COMPLETED
-- -------------------------------------------
CREATE TABLE IF NOT EXISTS appointments (
    appointment_id BIGINT    AUTO_INCREMENT PRIMARY KEY,
    patient_id     BIGINT    NOT NULL,
    doctor_id      BIGINT    NOT NULL,
    service_id     BIGINT    NOT NULL,
    slot_id        BIGINT    NOT NULL UNIQUE,
    status         ENUM('BOOKED', 'CANCELED', 'COMPLETED') NOT NULL DEFAULT 'BOOKED',
    notes          TEXT,
    created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_appt_patient
        FOREIGN KEY (patient_id) REFERENCES users(user_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_appt_doctor
        FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_appt_service
        FOREIGN KEY (service_id) REFERENCES services(service_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_appt_slot
        FOREIGN KEY (slot_id) REFERENCES availability_slots(slot_id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    INDEX idx_appt_patient (patient_id),
    INDEX idx_appt_doctor (doctor_id),
    INDEX idx_appt_status (status),
    INDEX idx_appt_patient_status (patient_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------
-- Table: notifications_log
-- Purpose: Log of notifications sent via mock service
-- -------------------------------------------
CREATE TABLE IF NOT EXISTS notifications_log (
    notification_id BIGINT       AUTO_INCREMENT PRIMARY KEY,
    appointment_id  BIGINT,
    recipient_id    BIGINT       NOT NULL,
    type            VARCHAR(50)  NOT NULL,
    message         TEXT         NOT NULL,
    status          VARCHAR(20)  NOT NULL DEFAULT 'SENT',
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_notif_appointment
        FOREIGN KEY (appointment_id) REFERENCES appointments(appointment_id)
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_notif_recipient
        FOREIGN KEY (recipient_id) REFERENCES users(user_id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------
-- Table: medical_records
-- Purpose: Medical records linked to completed appointments
-- -------------------------------------------
CREATE TABLE IF NOT EXISTS medical_records (
    record_id       BIGINT       AUTO_INCREMENT PRIMARY KEY,
    appointment_id  BIGINT       NOT NULL UNIQUE,
    patient_id      BIGINT       NOT NULL,
    doctor_id       BIGINT       NOT NULL,
    diagnosis       TEXT,
    treatment       TEXT,
    notes           TEXT,
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_record_appointment
        FOREIGN KEY (appointment_id) REFERENCES appointments(appointment_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_record_patient
        FOREIGN KEY (patient_id) REFERENCES users(user_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_record_doctor
        FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    INDEX idx_records_patient (patient_id),
    INDEX idx_records_doctor (doctor_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------
-- Table: messages
-- Purpose: Direct messages between patients and doctors
-- -------------------------------------------
CREATE TABLE IF NOT EXISTS messages (
    message_id   BIGINT    AUTO_INCREMENT PRIMARY KEY,
    sender_id    BIGINT    NOT NULL,
    receiver_id  BIGINT    NOT NULL,
    content      TEXT      NOT NULL,
    is_read      BOOLEAN   NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_msg_sender
        FOREIGN KEY (sender_id) REFERENCES users(user_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_msg_receiver
        FOREIGN KEY (receiver_id) REFERENCES users(user_id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    INDEX idx_messages_sender (sender_id),
    INDEX idx_messages_receiver (receiver_id),
    INDEX idx_messages_conversation (sender_id, receiver_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

