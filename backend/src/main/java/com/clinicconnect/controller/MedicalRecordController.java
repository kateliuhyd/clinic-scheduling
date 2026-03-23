package com.clinicconnect.controller;

import com.clinicconnect.dto.ApiResponse;
import com.clinicconnect.exception.BadRequestException;
import com.clinicconnect.exception.ResourceNotFoundException;
import com.clinicconnect.model.Appointment;
import com.clinicconnect.model.Doctor;
import com.clinicconnect.model.MedicalRecord;
import com.clinicconnect.model.AppointmentStatus;
import com.clinicconnect.repository.AppointmentRepository;
import com.clinicconnect.repository.DoctorRepository;
import com.clinicconnect.repository.MedicalRecordRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/medical-records")
public class MedicalRecordController {

    private static final Logger logger = LoggerFactory.getLogger(MedicalRecordController.class);
    private final MedicalRecordRepository medicalRecordRepository;
    private final AppointmentRepository appointmentRepository;
    private final DoctorRepository doctorRepository;

    public MedicalRecordController(MedicalRecordRepository medicalRecordRepository,
            AppointmentRepository appointmentRepository,
            DoctorRepository doctorRepository) {
        this.medicalRecordRepository = medicalRecordRepository;
        this.appointmentRepository = appointmentRepository;
        this.doctorRepository = doctorRepository;
    }

    /**
     * GET /api/medical-records/my — Patient views their own medical records.
     */
    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<MedicalRecord>>> getMyRecords(Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        List<MedicalRecord> records = medicalRecordRepository.findByPatientId(userId);
        return ResponseEntity.ok(ApiResponse.success(records));
    }

    /**
     * GET /api/medical-records/patient/{patientId} — Doctor views a patient's
     * records.
     */
    @GetMapping("/patient/{patientId}")
    public ResponseEntity<ApiResponse<List<MedicalRecord>>> getPatientRecords(
            @PathVariable Long patientId, Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        Doctor doctor = doctorRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor profile not found"));
        List<MedicalRecord> records = medicalRecordRepository.findByDoctorIdAndPatientId(
                doctor.getDoctorId(), patientId);
        return ResponseEntity.ok(ApiResponse.success(records));
    }

    /**
     * POST /api/medical-records — Doctor creates a medical record for a completed
     * appointment.
     */
    @PostMapping
    public ResponseEntity<ApiResponse<MedicalRecord>> createRecord(
            @RequestBody Map<String, Object> body, Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        Doctor doctor = doctorRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor profile not found"));

        Long appointmentId = Long.valueOf(body.get("appointmentId").toString());

        // Validate appointment exists and belongs to this doctor
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found"));

        if (!appointment.getDoctorId().equals(doctor.getDoctorId())) {
            throw new BadRequestException("This appointment does not belong to you");
        }

        if (appointment.getStatus() != AppointmentStatus.COMPLETED) {
            throw new BadRequestException("Can only add records for completed appointments");
        }

        // Check if record already exists
        if (medicalRecordRepository.findByAppointmentId(appointmentId).isPresent()) {
            throw new BadRequestException("A medical record already exists for this appointment");
        }

        MedicalRecord record = new MedicalRecord();
        record.setAppointmentId(appointmentId);
        record.setPatientId(appointment.getPatientId());
        record.setDoctorId(doctor.getDoctorId());
        record.setDiagnosis(body.getOrDefault("diagnosis", "").toString());
        record.setTreatment(body.getOrDefault("treatment", "").toString());
        record.setNotes(body.getOrDefault("notes", "").toString());

        record = medicalRecordRepository.insert(record);
        logger.info("Medical record {} created for appointment {}", record.getRecordId(), appointmentId);
        return ResponseEntity.ok(ApiResponse.success("Medical record created", record));
    }
}
