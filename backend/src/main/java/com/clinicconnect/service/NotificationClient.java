package com.clinicconnect.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

/**
 * Mock external notification service client.
 * Simulates a distribution boundary via a coarse-grained REST API call.
 * In production, this would call an actual email/SMS/calendar service.
 */
@Component
public class NotificationClient {

    private static final Logger logger = LoggerFactory.getLogger(NotificationClient.class);

    @Value("${app.notification.base-url}")
    private String baseUrl;

    private final RestTemplate restTemplate;

    public NotificationClient() {
        this.restTemplate = new RestTemplate();
    }

    /**
     * Send booking confirmation notification via mock REST API.
     */
    public void sendBookingConfirmation(Long appointmentId, Long patientId) {
        logger.info("[MOCK NOTIFICATION] Sending booking confirmation: appointment={}, patient={}",
                appointmentId, patientId);

        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("type", "BOOKING_CONFIRMATION");
            payload.put("appointmentId", appointmentId);
            payload.put("recipientId", patientId);
            payload.put("message", "Your appointment #" + appointmentId + " has been confirmed.");

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);

            restTemplate.postForEntity(baseUrl + "/send", request, String.class);
            logger.info("[MOCK NOTIFICATION] Booking confirmation sent successfully");
        } catch (Exception e) {
            logger.warn("[MOCK NOTIFICATION] Failed to send notification (non-critical): {}", e.getMessage());
        }
    }

    /**
     * Send cancellation notice notification via mock REST API.
     */
    public void sendCancellationNotice(Long appointmentId, Long patientId) {
        logger.info("[MOCK NOTIFICATION] Sending cancellation notice: appointment={}, patient={}",
                appointmentId, patientId);

        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("type", "CANCELLATION_NOTICE");
            payload.put("appointmentId", appointmentId);
            payload.put("recipientId", patientId);
            payload.put("message", "Your appointment #" + appointmentId + " has been canceled.");

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);

            restTemplate.postForEntity(baseUrl + "/send", request, String.class);
            logger.info("[MOCK NOTIFICATION] Cancellation notice sent successfully");
        } catch (Exception e) {
            logger.warn("[MOCK NOTIFICATION] Failed to send notification (non-critical): {}", e.getMessage());
        }
    }
}
