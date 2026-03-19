package com.clinicconnect.service;

import com.clinicconnect.dto.BatchSlotRequest;
import com.clinicconnect.dto.SlotRequest;
import com.clinicconnect.exception.BadRequestException;
import com.clinicconnect.exception.ConflictException;
import com.clinicconnect.exception.ResourceNotFoundException;
import com.clinicconnect.model.AvailabilitySlot;
import com.clinicconnect.model.Doctor;
import com.clinicconnect.model.SlotStatus;
import com.clinicconnect.repository.DoctorRepository;
import com.clinicconnect.repository.SlotRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class SlotServiceImpl implements SlotService {

    private static final Logger logger = LoggerFactory.getLogger(SlotServiceImpl.class);

    private final SlotRepository slotRepository;
    private final DoctorRepository doctorRepository;

    public SlotServiceImpl(SlotRepository slotRepository, DoctorRepository doctorRepository) {
        this.slotRepository = slotRepository;
        this.doctorRepository = doctorRepository;
    }

    @Override
    @Transactional
    public AvailabilitySlot createSlot(Long doctorUserId, SlotRequest request) {
        Doctor doctor = doctorRepository.findByUserId(doctorUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor profile not found for user: " + doctorUserId));

        validateSlotTimes(request.getStartTime(), request.getEndTime());

        // Check for overlapping slots
        if (slotRepository.hasOverlappingSlot(doctor.getDoctorId(), request.getStartTime(), request.getEndTime())) {
            throw new ConflictException("This time slot overlaps with an existing slot");
        }

        AvailabilitySlot slot = new AvailabilitySlot();
        slot.setDoctorId(doctor.getDoctorId());
        slot.setStartTime(request.getStartTime());
        slot.setEndTime(request.getEndTime());
        slot.setStatus(SlotStatus.AVAILABLE);

        return slotRepository.save(slot);
    }

    @Override
    @Transactional
    public List<AvailabilitySlot> batchCreateSlots(Long doctorUserId, BatchSlotRequest request) {
        Doctor doctor = doctorRepository.findByUserId(doctorUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor profile not found for user: " + doctorUserId));

        if (request.getStartDate().isAfter(request.getEndDate())) {
            throw new BadRequestException("Start date must be before or equal to end date");
        }
        if (request.getStartHour() >= request.getEndHour()) {
            throw new BadRequestException("Start hour must be before end hour");
        }
        if (request.getSlotDurationMinutes() < 10 || request.getSlotDurationMinutes() > 120) {
            throw new BadRequestException("Slot duration must be between 10 and 120 minutes");
        }

        List<AvailabilitySlot> createdSlots = new ArrayList<>();
        LocalDate currentDate = request.getStartDate();

        while (!currentDate.isAfter(request.getEndDate())) {
            // Skip weekends
            if (currentDate.getDayOfWeek().getValue() <= 5) {
                LocalDateTime slotStart = LocalDateTime.of(currentDate, LocalTime.of(request.getStartHour(), 0));
                LocalDateTime dayEnd = LocalDateTime.of(currentDate, LocalTime.of(request.getEndHour(), 0));

                while (slotStart.plusMinutes(request.getSlotDurationMinutes()).compareTo(dayEnd) <= 0) {
                    LocalDateTime slotEnd = slotStart.plusMinutes(request.getSlotDurationMinutes());

                    AvailabilitySlot slot = new AvailabilitySlot();
                    slot.setDoctorId(doctor.getDoctorId());
                    slot.setStartTime(slotStart);
                    slot.setEndTime(slotEnd);
                    slot.setStatus(SlotStatus.AVAILABLE);

                    createdSlots.add(slotRepository.save(slot));
                    slotStart = slotEnd;
                }
            }
            currentDate = currentDate.plusDays(1);
        }

        logger.info("Batch created {} slots for doctor {}", createdSlots.size(), doctor.getDoctorId());
        return createdSlots;
    }

    @Override
    @Transactional
    public AvailabilitySlot closeSlot(Long slotId, Long doctorUserId) {
        Doctor doctor = doctorRepository.findByUserId(doctorUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor profile not found"));

        AvailabilitySlot slot = slotRepository.findById(slotId)
                .orElseThrow(() -> new ResourceNotFoundException("Slot not found: " + slotId));

        if (!slot.getDoctorId().equals(doctor.getDoctorId())) {
            throw new BadRequestException("You can only manage your own slots");
        }

        if (slot.getStatus() == SlotStatus.BOOKED) {
            throw new BadRequestException("Cannot close a slot that is already booked");
        }

        slot.setStatus(SlotStatus.CLOSED);
        return slotRepository.save(slot);
    }

    @Override
    @Transactional
    public void deleteSlot(Long slotId, Long doctorUserId) {
        Doctor doctor = doctorRepository.findByUserId(doctorUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor profile not found"));

        AvailabilitySlot slot = slotRepository.findById(slotId)
                .orElseThrow(() -> new ResourceNotFoundException("Slot not found: " + slotId));

        if (!slot.getDoctorId().equals(doctor.getDoctorId())) {
            throw new BadRequestException("You can only delete your own slots");
        }

        if (slot.getStatus() == SlotStatus.BOOKED) {
            throw new BadRequestException("Cannot delete a booked slot. Cancel the appointment first.");
        }

        slotRepository.deleteById(slotId);
        logger.info("Deleted slot {} by doctor user {}", slotId, doctorUserId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AvailabilitySlot> getAvailableSlots(Long doctorId, LocalDate startDate, LocalDate endDate) {
        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = endDate.atTime(23, 59, 59);
        return slotRepository.findAvailableByDoctorAndDateRange(doctorId, start, end);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AvailabilitySlot> getAllAvailableSlots(LocalDate startDate, LocalDate endDate) {
        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = endDate.atTime(23, 59, 59);
        return slotRepository.findAvailableByDateRange(start, end);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AvailabilitySlot> getDoctorSchedule(Long doctorUserId, LocalDate startDate, LocalDate endDate) {
        Doctor doctor = doctorRepository.findByUserId(doctorUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor profile not found"));

        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = endDate.atTime(23, 59, 59);
        return slotRepository.findByDoctorIdAndDateRange(doctor.getDoctorId(), start, end);
    }

    private void validateSlotTimes(LocalDateTime start, LocalDateTime end) {
        if (start.isAfter(end) || start.isEqual(end)) {
            throw new BadRequestException("Start time must be before end time");
        }
        if (start.isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Cannot create slots in the past");
        }
    }
}
