package com.clinicconnect.service;

import com.clinicconnect.model.Appointment;
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
    public void sendBookingConfirmation(Appointment appointment) {
        logger.info("[MOCK NOTIFICATION] Preparing coarse-grained booking event: appointment={}",
                appointment.getAppointmentId());

        try {
            Map<String, Object> payload = createCoarseGrainedPayload("BOOKED", appointment);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);

            restTemplate.postForEntity(baseUrl + "/appointment-event", request, String.class);
            logger.info("[MOCK NOTIFICATION] Booking event sent successfully");
        } catch (Exception e) {
            logger.warn("[MOCK NOTIFICATION] Failed to send notification (non-critical): {}", e.getMessage());
        }
    }

    /**
     * Send cancellation notice notification via mock REST API.
     */
    public void sendCancellationNotice(Appointment appointment) {
        logger.info("[MOCK NOTIFICATION] Preparing coarse-grained cancellation event: appointment={}",
                appointment.getAppointmentId());

        try {
            Map<String, Object> payload = createCoarseGrainedPayload("CANCELED", appointment);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);

            restTemplate.postForEntity(baseUrl + "/appointment-event", request, String.class);
            logger.info("[MOCK NOTIFICATION] Cancellation event sent successfully to {}",
                    baseUrl + "/appointment-event");
        } catch (Exception e) {
            logger.warn("[MOCK NOTIFICATION] Failed to send notification (non-critical): {}", e.getMessage());
        }
    }

    private Map<String, Object> createCoarseGrainedPayload(String eventType, Appointment appt) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("eventType", eventType);
        payload.put("appointmentId", appt.getAppointmentId());
        payload.put("patientId", appt.getPatientId());
        payload.put("doctorId", appt.getDoctorId());
        payload.put("serviceId", appt.getServiceId());
        payload.put("startTime", appt.getSlotStartTime() != null ? appt.getSlotStartTime().toString() : "");
        payload.put("endTime", appt.getSlotEndTime() != null ? appt.getSlotEndTime().toString() : "");
        payload.put("patientEmail", appt.getPatientEmail() != null ? appt.getPatientEmail() : "");
        return payload;
    }
}
