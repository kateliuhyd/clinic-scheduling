package com.clinicconnect.controller;

import com.clinicconnect.dto.ApiResponse;
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
@RequestMapping("/api/mock/notifications")
public class MockNotificationController {

        private static final Logger logger = LoggerFactory.getLogger(MockNotificationController.class);

        private final NotificationRepository notificationRepository;

        public MockNotificationController(NotificationRepository notificationRepository) {
                this.notificationRepository = notificationRepository;
        }

        @PostMapping("/send")
        public ResponseEntity<ApiResponse<Map<String, String>>> sendNotification(
                        @RequestBody Map<String, Object> payload) {
                logger.info("=== MOCK NOTIFICATION SERVICE ===");
                logger.info("Received notification request: type={}, appointmentId={}, recipientId={}",
                                payload.get("type"), payload.get("appointmentId"), payload.get("recipientId"));
                logger.info("Message: {}", payload.get("message"));
                logger.info("=================================");

                // Persist notification to database
                Long appointmentId = payload.get("appointmentId") != null
                                ? Long.valueOf(payload.get("appointmentId").toString())
                                : null;
                Long recipientId = payload.get("recipientId") != null
                                ? Long.valueOf(payload.get("recipientId").toString())
                                : null;
                String type = payload.get("type") != null ? payload.get("type").toString() : "UNKNOWN";
                String message = payload.get("message") != null ? payload.get("message").toString() : "";

                notificationRepository.save(appointmentId, type, recipientId, message, "DELIVERED");

                Map<String, String> response = Map.of(
                                "status", "DELIVERED",
                                "notificationId", "MOCK-" + System.currentTimeMillis());
                return ResponseEntity.ok(ApiResponse.success("Notification sent", response));
        }
}
