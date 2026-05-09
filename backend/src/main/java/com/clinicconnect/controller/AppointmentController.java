package com.clinicconnect.controller;

import com.clinicconnect.dto.ApiResponse;
import com.clinicconnect.dto.BookingRequest;
import com.clinicconnect.model.Appointment;
import com.clinicconnect.model.AppointmentStatus;
import com.clinicconnect.model.Doctor;
import com.clinicconnect.exception.ResourceNotFoundException;
import com.clinicconnect.repository.DoctorRepository;
import com.clinicconnect.service.AppointmentService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/appointments")
public class AppointmentController {

    private static final Logger logger = LoggerFactory.getLogger(AppointmentController.class);
    private final AppointmentService appointmentService;
    private final DoctorRepository doctorRepository;

    public AppointmentController(AppointmentService appointmentService, DoctorRepository doctorRepository) {
        this.appointmentService = appointmentService;
        this.doctorRepository = doctorRepository;
    }

    /**
     * POST /api/appointments
     * Book an appointment (Patient).
     * Uses pessimistic locking to prevent double-booking.
     */
    @PostMapping
    public ResponseEntity<ApiResponse<Appointment>> bookAppointment(
            @Valid @RequestBody BookingRequest request,
            Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        logger.info("Booking request from user {}: slot={}, service={}", userId, request.getSlotId(),
                request.getServiceId());
        Appointment appointment = appointmentService.bookAppointment(userId, request);
        return ResponseEntity.ok(ApiResponse.success("Appointment booked successfully", appointment));
    }

    /**
     * POST /api/appointments/{id}/cancel
     * Cancel an appointment.
     */
    @PostMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<Appointment>> cancelAppointment(
            @PathVariable Long id,
            Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        logger.info("Cancel request for appointment {} by user {}", id, userId);
        Appointment appointment = appointmentService.cancelAppointment(id, userId);
        return ResponseEntity.ok(ApiResponse.success("Appointment canceled successfully", appointment));
    }

    /**
     * PUT /api/appointments/{id}/complete
     * Mark appointment as completed (Doctor).
     */
    @PutMapping("/{id}/complete")
    public ResponseEntity<ApiResponse<Appointment>> completeAppointment(
            @PathVariable Long id,
            Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        Appointment appointment = appointmentService.completeAppointment(id, userId);
        return ResponseEntity.ok(ApiResponse.success("Appointment completed", appointment));
    }

    /**
     * GET /api/appointments/my
     * Get current patient's appointments.
     */
    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<Appointment>>> getMyAppointments(
            @RequestParam(required = false) String status,
            Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        List<Appointment> appointments;
        if (status != null && !status.isEmpty()) {
            appointments = appointmentService.getPatientAppointmentsByStatus(
                    userId, AppointmentStatus.valueOf(status.toUpperCase()));
        } else {
            appointments = appointmentService.getPatientAppointments(userId);
        }
        return ResponseEntity.ok(ApiResponse.success(appointments));
    }

    /**
     * GET /api/appointments/my-doctor
     * Get current doctor's appointments — resolves doctorId from the JWT userId.
     */
    @GetMapping("/my-doctor")
    public ResponseEntity<ApiResponse<List<Appointment>>> getMyDoctorAppointments(
            @RequestParam(required = false) String status,
            Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        Doctor doctor = doctorRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor profile not found for user: " + userId));

        List<Appointment> appointments;
        if (status != null && !status.isEmpty()) {
            appointments = appointmentService.getDoctorAppointmentsByStatus(
                    doctor.getDoctorId(), AppointmentStatus.valueOf(status.toUpperCase()));
        } else {
            appointments = appointmentService.getDoctorAppointments(doctor.getDoctorId());
        }
        return ResponseEntity.ok(ApiResponse.success(appointments));
    }

    /**
     * GET /api/appointments/doctor/{doctorId}
     * Get appointments for a specific doctor.
     */
    @GetMapping("/doctor/{doctorId}")
    public ResponseEntity<ApiResponse<List<Appointment>>> getDoctorAppointments(
            @PathVariable Long doctorId,
            @RequestParam(required = false) String status) {
        List<Appointment> appointments;
        if (status != null && !status.isEmpty()) {
            appointments = appointmentService.getDoctorAppointmentsByStatus(
                    doctorId, AppointmentStatus.valueOf(status.toUpperCase()));
        } else {
            appointments = appointmentService.getDoctorAppointments(doctorId);
        }
        return ResponseEntity.ok(ApiResponse.success(appointments));
    }

    /**
     * GET /api/appointments/{id}
     * Get appointment details by ID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Appointment>> getAppointment(@PathVariable Long id) {
        Appointment appointment = appointmentService.getAppointmentById(id);
        return ResponseEntity.ok(ApiResponse.success(appointment));
    }

    /**
     * GET /api/appointments
     * Get all appointments (Admin).
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<Appointment>>> getAllAppointments() {
        return ResponseEntity.ok(ApiResponse.success(appointmentService.getAllAppointments()));
    }
}
