package com.clinicconnect.repository;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

/**
 * Repository for persisting notifications to the notifications_log table.
 */
@Repository
public class NotificationRepository {

    private static final Logger logger = LoggerFactory.getLogger(NotificationRepository.class);

    private final JdbcTemplate jdbcTemplate;

    public NotificationRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public void save(Long appointmentId, String type, Long recipientId, String message, String status) {
        String sql = "INSERT INTO notifications_log (appointment_id, type, recipient_id, message, status) " +
                "VALUES (?, ?, ?, ?, ?)";
        try {
            jdbcTemplate.update(sql, appointmentId, type, recipientId, message, status);
            logger.info("Notification saved: type={}, appointmentId={}, recipientId={}", type, appointmentId,
                    recipientId);
        } catch (Exception e) {
            logger.warn("Failed to save notification to DB (non-critical): {}", e.getMessage());
        }
    }
}
