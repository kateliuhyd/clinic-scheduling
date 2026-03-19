package com.clinicconnect.service;

import com.clinicconnect.dto.BookingRequest;
import com.clinicconnect.model.Appointment;
import com.clinicconnect.model.AppointmentStatus;

import java.util.List;

public interface AppointmentService {

    /**
     * Book an appointment atomically:
     * 1. Lock the slot (SELECT ... FOR UPDATE)
     * 2. Verify slot is AVAILABLE
     * 3. Create appointment record
     * 4. Mark slot as BOOKED
     * 5. Send notification via mock service
     * All within a single transaction with SERIALIZABLE isolation.
     */
    Appointment bookAppointment(Long patientId, BookingRequest request);

    /**
     * Cancel an appointment:
     * 1. Update appointment status to CANCELED
     * 2. Set the slot back to AVAILABLE
     * 3. Send cancellation notification
     */
    Appointment cancelAppointment(Long appointmentId, Long userId);

    /**
     * Mark appointment as completed (doctor action).
     */
    Appointment completeAppointment(Long appointmentId, Long doctorUserId);

    List<Appointment> getPatientAppointments(Long patientId);

    List<Appointment> getPatientAppointmentsByStatus(Long patientId, AppointmentStatus status);

    List<Appointment> getDoctorAppointments(Long doctorId);

    List<Appointment> getDoctorAppointmentsByStatus(Long doctorId, AppointmentStatus status);

    List<Appointment> getAllAppointments();

    Appointment getAppointmentById(Long appointmentId);
}
