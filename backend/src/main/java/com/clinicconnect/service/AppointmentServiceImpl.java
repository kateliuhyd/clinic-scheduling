package com.clinicconnect.service;

import com.clinicconnect.dto.BookingRequest;
import com.clinicconnect.exception.BadRequestException;
import com.clinicconnect.exception.ConflictException;
import com.clinicconnect.exception.ResourceNotFoundException;
import com.clinicconnect.model.Appointment;
import com.clinicconnect.model.AvailabilitySlot;
import com.clinicconnect.model.Doctor;
import com.clinicconnect.model.AppointmentStatus;
import com.clinicconnect.model.SlotStatus;
import com.clinicconnect.repository.AppointmentRepository;
import com.clinicconnect.repository.DoctorRepository;
import com.clinicconnect.repository.ServiceRepository;
import com.clinicconnect.repository.SlotRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.List;

@Service
public class AppointmentServiceImpl implements AppointmentService {

    private static final Logger logger = LoggerFactory.getLogger(AppointmentServiceImpl.class);

    private final AppointmentRepository appointmentRepository;
    private final SlotRepository slotRepository;
    private final DoctorRepository doctorRepository;
    private final ServiceRepository serviceRepository;
    private final NotificationClient notificationClient;

    public AppointmentServiceImpl(AppointmentRepository appointmentRepository,
            SlotRepository slotRepository,
            DoctorRepository doctorRepository,
            ServiceRepository serviceRepository,
            NotificationClient notificationClient) {
        this.appointmentRepository = appointmentRepository;
        this.slotRepository = slotRepository;
        this.doctorRepository = doctorRepository;
        this.serviceRepository = serviceRepository;
        this.notificationClient = notificationClient;
    }

    /**
     * Book appointment with pessimistic locking to prevent double-booking.
     *
     * Transaction isolation: SERIALIZABLE
     * Concurrency strategy: Pessimistic locking via SELECT ... FOR UPDATE
     *
     * ACID guarantees:
     * - Atomicity: Both appointment creation and slot status update succeed or both
     * fail
     * - Consistency: Slot can only be booked if status is AVAILABLE (constraint
     * enforced in transaction)
     * - Isolation: SERIALIZABLE prevents lost updates and dirty reads between
     * concurrent bookings
     * - Durability: InnoDB ensures committed transactions survive crashes
     */
    @Override
    @Transactional(isolation = Isolation.SERIALIZABLE)
    public Appointment bookAppointment(Long patientId, BookingRequest request) {
        logger.info("Booking appointment: patient={}, slot={}, service={}",
                patientId, request.getSlotId(), request.getServiceId());

        // Step 1: Acquire pessimistic lock on the slot (SELECT ... FOR UPDATE)
        AvailabilitySlot slot = slotRepository.findByIdForUpdate(request.getSlotId())
                .orElseThrow(() -> new ResourceNotFoundException("Slot not found: " + request.getSlotId()));

        // Step 2: Verify slot is still AVAILABLE (prevents double-booking)
        if (slot.getStatus() != SlotStatus.AVAILABLE) {
            logger.warn("Double-booking attempt detected: slot {} is {}", slot.getSlotId(), slot.getStatus());
            throw new ConflictException(
                    "This time slot is no longer available. It may have been booked by another patient.");
        }

        // Step 2.5: Reject past-date slots
        if (slot.getStartTime().isBefore(java.time.LocalDateTime.now())) {
            throw new BadRequestException("Cannot book a time slot that is in the past.");
        }

        // Step 3: Validate service exists
        serviceRepository.findById(request.getServiceId())
                .orElseThrow(() -> new ResourceNotFoundException("Service not found: " + request.getServiceId()));

        // Step 4: Create appointment record
        Appointment appointment = new Appointment();
        appointment.setPatientId(patientId);
        appointment.setDoctorId(slot.getDoctorId());
        appointment.setServiceId(request.getServiceId());
        appointment.setSlotId(slot.getSlotId());
        appointment.setStatus(AppointmentStatus.BOOKED);
        appointment.setNotes(request.getNotes());
        appointment = appointmentRepository.insert(appointment);

        // Step 5: Mark slot as BOOKED (within same transaction)
        slot.setStatus(SlotStatus.BOOKED);
        slotRepository.save(slot);

        logger.info("Appointment {} booked successfully for patient {} at slot {}",
                appointment.getAppointmentId(), patientId, slot.getSlotId());

        // Step 6: Send notification via mock external service (AFTER COMMIT)
        final Long apptId = appointment.getAppointmentId();
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                try {
                    appointmentRepository.findById(apptId).ifPresent(notificationClient::sendBookingConfirmation);
                } catch (Exception e) {
                    logger.error("Failed to send booking notification for appointment {}: {}", apptId, e.getMessage());
                }
            }
        });

        return appointmentRepository.findById(appointment.getAppointmentId())
                .orElse(appointment);
    }

    @Override
    @Transactional(isolation = Isolation.SERIALIZABLE)
    public Appointment cancelAppointment(Long appointmentId, Long userId) {
        logger.info("Canceling appointment: id={}, requestedBy={}", appointmentId, userId);

        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found: " + appointmentId));

        if (appointment.getStatus() != AppointmentStatus.BOOKED) {
            throw new BadRequestException("Only BOOKED appointments can be canceled. Current status: " +
                    appointment.getStatus());
        }

        // Verify the requesting user is the patient or the doctor
        Doctor doctor = doctorRepository.findById(appointment.getDoctorId()).orElse(null);
        boolean isPatient = appointment.getPatientId().equals(userId);
        boolean isDoctor = doctor != null && doctor.getUserId().equals(userId);

        if (!isPatient && !isDoctor) {
            throw new BadRequestException("You are not authorized to cancel this appointment");
        }

        // Step 1: Update appointment status
        appointmentRepository.updateStatus(appointmentId, AppointmentStatus.CANCELED);

        // Step 2: Release the slot back to AVAILABLE
        AvailabilitySlot slot = slotRepository.findByIdForUpdate(appointment.getSlotId())
                .orElseThrow(() -> new ResourceNotFoundException("Slot not found"));
        slot.setStatus(SlotStatus.AVAILABLE);
        slotRepository.save(slot);

        logger.info("Appointment {} canceled, slot {} released", appointmentId, appointment.getSlotId());

        // Step 3: Send cancellation notification (AFTER COMMIT)
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                try {
                    appointmentRepository.findById(appointmentId)
                            .ifPresent(notificationClient::sendCancellationNotice);
                } catch (Exception e) {
                    logger.error("Failed to send cancellation notification: {}", e.getMessage());
                }
            }
        });

        return appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found after cancel"));
    }

    @Override
    @Transactional
    public Appointment completeAppointment(Long appointmentId, Long doctorUserId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found: " + appointmentId));

        if (appointment.getStatus() != AppointmentStatus.BOOKED) {
            throw new BadRequestException("Only BOOKED appointments can be completed");
        }

        Doctor doctor = doctorRepository.findById(appointment.getDoctorId())
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found"));

        if (!doctor.getUserId().equals(doctorUserId)) {
            throw new BadRequestException("Only the assigned doctor can complete this appointment");
        }

        appointmentRepository.updateStatus(appointmentId, AppointmentStatus.COMPLETED);
        logger.info("Appointment {} completed by doctor {}", appointmentId, doctorUserId);

        return appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found after complete"));
    }

    @Override
    @Transactional(readOnly = true)
    public List<Appointment> getPatientAppointments(Long patientId) {
        return appointmentRepository.findByPatientId(patientId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Appointment> getPatientAppointmentsByStatus(Long patientId, AppointmentStatus status) {
        return appointmentRepository.findByPatientIdAndStatus(patientId, status);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Appointment> getDoctorAppointments(Long doctorId) {
        return appointmentRepository.findByDoctorId(doctorId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Appointment> getDoctorAppointmentsByStatus(Long doctorId, AppointmentStatus status) {
        return appointmentRepository.findByDoctorIdAndStatus(doctorId, status);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Appointment> getAllAppointments() {
        return appointmentRepository.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public Appointment getAppointmentById(Long appointmentId) {
        return appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found: " + appointmentId));
    }
}
