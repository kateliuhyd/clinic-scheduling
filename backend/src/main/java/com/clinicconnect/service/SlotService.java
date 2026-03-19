package com.clinicconnect.service;

import com.clinicconnect.dto.BatchSlotRequest;
import com.clinicconnect.dto.SlotRequest;
import com.clinicconnect.model.AvailabilitySlot;

import java.time.LocalDate;
import java.util.List;

public interface SlotService {
    AvailabilitySlot createSlot(Long doctorUserId, SlotRequest request);
    List<AvailabilitySlot> batchCreateSlots(Long doctorUserId, BatchSlotRequest request);
    AvailabilitySlot closeSlot(Long slotId, Long doctorUserId);
    void deleteSlot(Long slotId, Long doctorUserId);
    List<AvailabilitySlot> getAvailableSlots(Long doctorId, LocalDate startDate, LocalDate endDate);
    List<AvailabilitySlot> getAllAvailableSlots(LocalDate startDate, LocalDate endDate);
    List<AvailabilitySlot> getDoctorSchedule(Long doctorUserId, LocalDate startDate, LocalDate endDate);
}
