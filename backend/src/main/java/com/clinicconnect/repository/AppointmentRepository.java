package com.clinicconnect.repository;

import com.clinicconnect.model.Appointment;
import com.clinicconnect.model.AppointmentStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.util.List;
import java.util.Optional;

@Repository
public class AppointmentRepository {

    private static final Logger logger = LoggerFactory.getLogger(AppointmentRepository.class);
    private final JdbcTemplate jdbcTemplate;

    public AppointmentRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private final RowMapper<Appointment> appointmentDetailRowMapper = (rs, rowNum) -> {
        Appointment appt = new Appointment();
        appt.setAppointmentId(rs.getLong("appointment_id"));
        appt.setPatientId(rs.getLong("patient_id"));
        appt.setDoctorId(rs.getLong("doctor_id"));
        appt.setServiceId(rs.getLong("service_id"));
        appt.setSlotId(rs.getLong("slot_id"));
        appt.setStatus(AppointmentStatus.valueOf(rs.getString("appt_status")));
        appt.setNotes(rs.getString("notes"));
        appt.setCreatedAt(rs.getTimestamp("appt_created").toLocalDateTime());
        appt.setUpdatedAt(rs.getTimestamp("appt_updated").toLocalDateTime());
        appt.setPatientFirstName(rs.getString("patient_first"));
        appt.setPatientLastName(rs.getString("patient_last"));
        appt.setPatientEmail(rs.getString("patient_email"));
        appt.setDoctorFirstName(rs.getString("doctor_first"));
        appt.setDoctorLastName(rs.getString("doctor_last"));
        appt.setServiceName(rs.getString("service_name"));
        appt.setServiceDurationMinutes(rs.getInt("duration_minutes"));
        appt.setSlotStartTime(rs.getTimestamp("start_time").toLocalDateTime());
        appt.setSlotEndTime(rs.getTimestamp("end_time").toLocalDateTime());
        appt.setSpecialty(rs.getString("specialty"));
        return appt;
    };

    private static final String DETAIL_SELECT = """
            SELECT a.appointment_id, a.patient_id, a.doctor_id, a.service_id, a.slot_id,
                   a.status AS appt_status, a.notes,
                   a.created_at AS appt_created, a.updated_at AS appt_updated,
                   p.first_name AS patient_first, p.last_name AS patient_last, p.email AS patient_email,
                   du.first_name AS doctor_first, du.last_name AS doctor_last,
                   sv.name AS service_name, sv.duration_minutes,
                   sl.start_time, sl.end_time,
                   d.specialty
            FROM appointments a
            JOIN users p ON a.patient_id = p.user_id
            JOIN doctors d ON a.doctor_id = d.doctor_id
            JOIN users du ON d.user_id = du.user_id
            JOIN services sv ON a.service_id = sv.service_id
            JOIN availability_slots sl ON a.slot_id = sl.slot_id
            """;

    public List<Appointment> findByPatientId(Long patientId) {
        String sql = DETAIL_SELECT + " WHERE a.patient_id = ? ORDER BY sl.start_time DESC";
        return jdbcTemplate.query(sql, appointmentDetailRowMapper, patientId);
    }

    public List<Appointment> findByPatientIdAndStatus(Long patientId, AppointmentStatus status) {
        String sql = DETAIL_SELECT + " WHERE a.patient_id = ? AND a.status = ? ORDER BY sl.start_time DESC";
        return jdbcTemplate.query(sql, appointmentDetailRowMapper, patientId, status.name());
    }

    public List<Appointment> findByDoctorId(Long doctorId) {
        String sql = DETAIL_SELECT + " WHERE a.doctor_id = ? ORDER BY sl.start_time DESC";
        return jdbcTemplate.query(sql, appointmentDetailRowMapper, doctorId);
    }

    public List<Appointment> findByDoctorIdAndStatus(Long doctorId, AppointmentStatus status) {
        String sql = DETAIL_SELECT + " WHERE a.doctor_id = ? AND a.status = ? ORDER BY sl.start_time ASC";
        return jdbcTemplate.query(sql, appointmentDetailRowMapper, doctorId, status.name());
    }

    public List<Appointment> findAll() {
        String sql = DETAIL_SELECT + " ORDER BY a.created_at DESC";
        return jdbcTemplate.query(sql, appointmentDetailRowMapper);
    }

    public Optional<Appointment> findById(Long appointmentId) {
        String sql = DETAIL_SELECT + " WHERE a.appointment_id = ?";
        List<Appointment> appts = jdbcTemplate.query(sql, appointmentDetailRowMapper, appointmentId);
        return appts.isEmpty() ? Optional.empty() : Optional.of(appts.get(0));
    }

    public Appointment insert(Appointment appointment) {
        String sql = "INSERT INTO appointments (patient_id, doctor_id, service_id, slot_id, status, notes) " +
                "VALUES (?, ?, ?, ?, ?, ?)";
        logger.info("Creating appointment: patient={}, doctor={}, slot={}",
                appointment.getPatientId(), appointment.getDoctorId(), appointment.getSlotId());

        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            ps.setLong(1, appointment.getPatientId());
            ps.setLong(2, appointment.getDoctorId());
            ps.setLong(3, appointment.getServiceId());
            ps.setLong(4, appointment.getSlotId());
            ps.setString(5, appointment.getStatus().name());
            ps.setString(6, appointment.getNotes());
            return ps;
        }, keyHolder);

        appointment.setAppointmentId(keyHolder.getKey().longValue());
        logger.info("Created appointment ID: {}", appointment.getAppointmentId());
        return appointment;
    }

    public void updateStatus(Long appointmentId, AppointmentStatus status) {
        String sql = "UPDATE appointments SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE appointment_id = ?";
        logger.info("Updating appointment {} status to {}", appointmentId, status);
        jdbcTemplate.update(sql, status.name(), appointmentId);
    }

    public long countByStatus(AppointmentStatus status) {
        String sql = "SELECT COUNT(*) FROM appointments WHERE status = ?";
        Long count = jdbcTemplate.queryForObject(sql, Long.class, status.name());
        return count != null ? count : 0;
    }

    public long count() {
        String sql = "SELECT COUNT(*) FROM appointments";
        Long count = jdbcTemplate.queryForObject(sql, Long.class);
        return count != null ? count : 0;
    }

    public long countAll() {
        return count();
    }
}
