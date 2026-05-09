package com.clinicconnect.controller;

import com.clinicconnect.repository.NotificationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Mock Notification Service endpoint.
 * Simulates an external notification/calendar service.
 * Receives calls from NotificationClient, logs them, and persists to
 * notifications_log.
 */
@RestController
@RequestMapping("/mock/notify")
public class MockNotificationController {

    private static final Logger logger = LoggerFactory.getLogger(MockNotificationController.class);

    private final NotificationRepository notificationRepository;

    public MockNotificationController(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    @PostMapping("/appointment-event")
    public ResponseEntity<Map<String, Object>> handleAppointmentEvent(
            @RequestBody Map<String, Object> payload) {
        logger.info("=== MOCK NOTIFICATION SERVICE (Coarse-Grained Event) ===");
        logger.info("Event Type: {}", payload.get("eventType"));
        logger.info("Appointment ID: {}", payload.get("appointmentId"));
        logger.info("Patient ID: {}", payload.get("patientId"));
        logger.info("Doctor ID: {}", payload.get("doctorId"));
        logger.info("Service ID: {}", payload.get("serviceId"));
        logger.info("Start Time: {}", payload.get("startTime"));
        logger.info("End Time: {}", payload.get("endTime"));
        logger.info("Patient Email: {}", payload.get("patientEmail"));
        logger.info("=================================");

        // Persist notification for audit
        try {
            Long apptId = payload.get("appointmentId") != null
                    ? Long.valueOf(payload.get("appointmentId").toString())
                    : null;
            Long recipientId = payload.get("patientId") != null
                    ? Long.valueOf(payload.get("patientId").toString())
                    : null;
            String eventType = String.valueOf(payload.get("eventType"));
            String patientEmail = String.valueOf(payload.get("patientEmail"));
            String message = "Simulated " + eventType + " for " + patientEmail + " at " + payload.get("startTime");

            notificationRepository.save(apptId, eventType, recipientId, message, "ACCEPTED");
        } catch (Exception e) {
            logger.error("Error persisting mock notification: {}", e.getMessage());
        }

        Map<String, Object> response = new java.util.HashMap<>();
        long now = System.currentTimeMillis();
        response.put("status", "ACCEPTED");
        response.put("messageId", "mock-" + now);
        response.put("timestamp", now);

        return ResponseEntity.ok(response);
    }
}
