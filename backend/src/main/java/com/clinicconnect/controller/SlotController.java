package com.clinicconnect.controller;

import com.clinicconnect.dto.ApiResponse;
import com.clinicconnect.dto.BatchSlotRequest;
import com.clinicconnect.dto.SlotRequest;
import com.clinicconnect.model.AvailabilitySlot;
import com.clinicconnect.service.SlotService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/slots")
public class SlotController {

    private final SlotService slotService;

    public SlotController(SlotService slotService) {
        this.slotService = slotService;
    }

    /**
     * GET /api/slots/available
     * Browse available slots (public endpoint).
     */
    @GetMapping("/available")
    public ResponseEntity<ApiResponse<List<AvailabilitySlot>>> getAvailableSlots(
            @RequestParam(required = false) Long doctorId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        List<AvailabilitySlot> slots;
        if (doctorId != null) {
            slots = slotService.getAvailableSlots(doctorId, startDate, endDate);
        } else {
            slots = slotService.getAllAvailableSlots(startDate, endDate);
        }
        return ResponseEntity.ok(ApiResponse.success(slots));
    }

    /**
     * GET /api/slots/my-schedule
     * Get doctor's own schedule (all statuses).
     */
    @GetMapping("/my-schedule")
    public ResponseEntity<ApiResponse<List<AvailabilitySlot>>> getMySchedule(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            Authentication auth) {
        if (auth == null || auth.getPrincipal() == null) {
            return ResponseEntity.status(401)
                    .body(ApiResponse.error("Not authenticated. Please log in again."));
        }
        Long userId = (Long) auth.getPrincipal();
        List<AvailabilitySlot> slots = slotService.getDoctorSchedule(userId, startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success(slots));
    }

    /**
     * POST /api/slots
     * Create a single availability slot (Doctor).
     */
    @PostMapping
    public ResponseEntity<ApiResponse<AvailabilitySlot>> createSlot(
            @Valid @RequestBody SlotRequest request,
            Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        AvailabilitySlot slot = slotService.createSlot(userId, request);
        return ResponseEntity.ok(ApiResponse.success("Slot created", slot));
    }

    /**
     * POST /api/slots/batch
     * Batch create availability slots (Doctor).
     */
    @PostMapping("/batch")
    public ResponseEntity<ApiResponse<List<AvailabilitySlot>>> batchCreateSlots(
            @Valid @RequestBody BatchSlotRequest request,
            Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        List<AvailabilitySlot> slots = slotService.batchCreateSlots(userId, request);
        return ResponseEntity.ok(ApiResponse.success("Created " + slots.size() + " slots", slots));
    }

    /**
     * PUT /api/slots/{id}/close
     * Close a slot (Doctor).
     */
    @PutMapping("/{id}/close")
    public ResponseEntity<ApiResponse<AvailabilitySlot>> closeSlot(
            @PathVariable Long id,
            Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        AvailabilitySlot slot = slotService.closeSlot(id, userId);
        return ResponseEntity.ok(ApiResponse.success("Slot closed", slot));
    }

    /**
     * DELETE /api/slots/{id}
     * Delete an available slot (Doctor).
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteSlot(
            @PathVariable Long id,
            Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        slotService.deleteSlot(id, userId);
        return ResponseEntity.ok(ApiResponse.success("Slot deleted", null));
    }
}
