package com.clinicconnect.repository;

import com.clinicconnect.model.AvailabilitySlot;
import com.clinicconnect.model.SlotStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public class SlotRepository {

    private static final Logger logger = LoggerFactory.getLogger(SlotRepository.class);
    private final JdbcTemplate jdbcTemplate;

    public SlotRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private final RowMapper<AvailabilitySlot> slotRowMapper = (rs, rowNum) -> {
        AvailabilitySlot slot = new AvailabilitySlot();
        slot.setSlotId(rs.getLong("slot_id"));
        slot.setDoctorId(rs.getLong("doctor_id"));
        slot.setStartTime(rs.getTimestamp("start_time").toLocalDateTime());
        slot.setEndTime(rs.getTimestamp("end_time").toLocalDateTime());
        slot.setStatus(SlotStatus.valueOf(rs.getString("status")));
        slot.setCreatedAt(rs.getTimestamp("created_at").toLocalDateTime());
        slot.setUpdatedAt(rs.getTimestamp("updated_at").toLocalDateTime());
        slot.setVersion(rs.getInt("version"));
        return slot;
    };

    private final RowMapper<AvailabilitySlot> slotDetailRowMapper = (rs, rowNum) -> {
        AvailabilitySlot slot = new AvailabilitySlot();
        slot.setSlotId(rs.getLong("slot_id"));
        slot.setDoctorId(rs.getLong("doctor_id"));
        slot.setStartTime(rs.getTimestamp("start_time").toLocalDateTime());
        slot.setEndTime(rs.getTimestamp("end_time").toLocalDateTime());
        slot.setStatus(SlotStatus.valueOf(rs.getString("status")));
        slot.setCreatedAt(rs.getTimestamp("created_at").toLocalDateTime());
        slot.setUpdatedAt(rs.getTimestamp("updated_at").toLocalDateTime());
        slot.setVersion(rs.getInt("version"));
        slot.setDoctorFirstName(rs.getString("first_name"));
        slot.setDoctorLastName(rs.getString("last_name"));
        slot.setSpecialty(rs.getString("specialty"));
        return slot;
    };

    /**
     * Find available slots for a specific doctor within a date range.
     */
    public List<AvailabilitySlot> findAvailableByDoctorAndDateRange(
            Long doctorId, LocalDateTime start, LocalDateTime end) {
        String sql = """
                SELECT s.*, u.first_name, u.last_name, d.specialty
                FROM availability_slots s
                JOIN doctors d ON s.doctor_id = d.doctor_id
                JOIN users u ON d.user_id = u.user_id
                WHERE s.doctor_id = ?
                  AND s.status = 'AVAILABLE'
                  AND s.start_time >= ?
                  AND s.start_time <= ?
                ORDER BY s.start_time
                """;
        return jdbcTemplate.query(sql, slotDetailRowMapper,
                doctorId, Timestamp.valueOf(start), Timestamp.valueOf(end));
    }

    /**
     * Find all available slots within a date range (across all doctors).
     */
    public List<AvailabilitySlot> findAvailableByDateRange(LocalDateTime start, LocalDateTime end) {
        String sql = """
                SELECT s.*, u.first_name, u.last_name, d.specialty
                FROM availability_slots s
                JOIN doctors d ON s.doctor_id = d.doctor_id
                JOIN users u ON d.user_id = u.user_id
                WHERE s.status = 'AVAILABLE'
                  AND s.start_time >= ?
                  AND s.start_time <= ?
                ORDER BY s.start_time, u.last_name
                """;
        return jdbcTemplate.query(sql, slotDetailRowMapper,
                Timestamp.valueOf(start), Timestamp.valueOf(end));
    }

    /**
     * Find all slots for a doctor (any status) for schedule management.
     */
    public List<AvailabilitySlot> findByDoctorId(Long doctorId) {
        String sql = """
                SELECT s.*, u.first_name, u.last_name, d.specialty
                FROM availability_slots s
                JOIN doctors d ON s.doctor_id = d.doctor_id
                JOIN users u ON d.user_id = u.user_id
                WHERE s.doctor_id = ?
                ORDER BY s.start_time
                """;
        return jdbcTemplate.query(sql, slotDetailRowMapper, doctorId);
    }

    public List<AvailabilitySlot> findByDoctorIdAndDateRange(Long doctorId, LocalDateTime start, LocalDateTime end) {
        String sql = """
                SELECT s.*, u.first_name, u.last_name, d.specialty
                FROM availability_slots s
                JOIN doctors d ON s.doctor_id = d.doctor_id
                JOIN users u ON d.user_id = u.user_id
                WHERE s.doctor_id = ?
                  AND s.start_time >= ?
                  AND s.start_time <= ?
                ORDER BY s.start_time
                """;
        return jdbcTemplate.query(sql, slotDetailRowMapper,
                doctorId, Timestamp.valueOf(start), Timestamp.valueOf(end));
    }

    public Optional<AvailabilitySlot> findById(Long slotId) {
        String sql = "SELECT * FROM availability_slots WHERE slot_id = ?";
        List<AvailabilitySlot> slots = jdbcTemplate.query(sql, slotRowMapper, slotId);
        return slots.isEmpty() ? Optional.empty() : Optional.of(slots.get(0));
    }

    /**
     * Pessimistic lock: SELECT ... FOR UPDATE to prevent concurrent booking.
     * This must be called within an active transaction.
     */
    public Optional<AvailabilitySlot> findByIdForUpdate(Long slotId) {
        String sql = "SELECT * FROM availability_slots WHERE slot_id = ? FOR UPDATE";
        logger.debug("Acquiring pessimistic lock on slot_id: {}", slotId);
        List<AvailabilitySlot> slots = jdbcTemplate.query(sql, slotRowMapper, slotId);
        return slots.isEmpty() ? Optional.empty() : Optional.of(slots.get(0));
    }

    public AvailabilitySlot save(AvailabilitySlot slot) {
        if (slot.getSlotId() == null) {
            return insert(slot);
        } else {
            return update(slot);
        }
    }

    private AvailabilitySlot insert(AvailabilitySlot slot) {
        String sql = "INSERT INTO availability_slots (doctor_id, start_time, end_time, status, version) " +
                "VALUES (?, ?, ?, ?, 0)";
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            ps.setLong(1, slot.getDoctorId());
            ps.setTimestamp(2, Timestamp.valueOf(slot.getStartTime()));
            ps.setTimestamp(3, Timestamp.valueOf(slot.getEndTime()));
            ps.setString(4, slot.getStatus().name());
            return ps;
        }, keyHolder);
        slot.setSlotId(keyHolder.getKey().longValue());
        logger.info("Created availability slot ID: {} for doctor: {}", slot.getSlotId(), slot.getDoctorId());
        return slot;
    }

    private AvailabilitySlot update(AvailabilitySlot slot) {
        String sql = "UPDATE availability_slots SET status = ?, version = version + 1, " +
                "updated_at = CURRENT_TIMESTAMP WHERE slot_id = ?";
        jdbcTemplate.update(sql, slot.getStatus().name(), slot.getSlotId());
        return slot;
    }

    /**
     * Optimistic locking update: only succeeds if version matches.
     * Returns the number of rows updated (0 means concurrent modification).
     */
    public int updateStatusWithVersion(Long slotId, SlotStatus newStatus, int expectedVersion) {
        String sql = "UPDATE availability_slots SET status = ?, version = version + 1 " +
                "WHERE slot_id = ? AND version = ?";
        int rows = jdbcTemplate.update(sql, newStatus.name(), slotId, expectedVersion);
        logger.debug("Optimistic lock update on slot {}: {} rows affected (expected version: {})",
                slotId, rows, expectedVersion);
        return rows;
    }

    public void deleteById(Long slotId) {
        String sql = "DELETE FROM availability_slots WHERE slot_id = ? AND status = 'AVAILABLE'";
        jdbcTemplate.update(sql, slotId);
    }

    /**
     * Check if a doctor already has a non-CLOSED slot that overlaps with the given
     * time range.
     */
    public boolean hasOverlappingSlot(Long doctorId, LocalDateTime startTime, LocalDateTime endTime) {
        String sql = "SELECT COUNT(*) FROM availability_slots " +
                "WHERE doctor_id = ? AND status != 'CLOSED' " +
                "AND start_time < ? AND end_time > ?";
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, doctorId,
                Timestamp.valueOf(endTime), Timestamp.valueOf(startTime));
        return count != null && count > 0;
    }
}
