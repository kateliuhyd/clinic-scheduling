package com.clinicconnect.repository;

import com.clinicconnect.model.MedicalRecord;
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
public class MedicalRecordRepository {

    private static final Logger logger = LoggerFactory.getLogger(MedicalRecordRepository.class);
    private final JdbcTemplate jdbcTemplate;

    public MedicalRecordRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private final RowMapper<MedicalRecord> recordDetailRowMapper = (rs, rowNum) -> {
        MedicalRecord record = new MedicalRecord();
        record.setRecordId(rs.getLong("record_id"));
        record.setAppointmentId(rs.getLong("appointment_id"));
        record.setPatientId(rs.getLong("patient_id"));
        record.setDoctorId(rs.getLong("doctor_id"));
        record.setDiagnosis(rs.getString("diagnosis"));
        record.setTreatment(rs.getString("treatment"));
        record.setNotes(rs.getString("record_notes"));
        record.setCreatedAt(rs.getTimestamp("record_created").toLocalDateTime());
        record.setPatientFirstName(rs.getString("patient_first"));
        record.setPatientLastName(rs.getString("patient_last"));
        record.setDoctorFirstName(rs.getString("doctor_first"));
        record.setDoctorLastName(rs.getString("doctor_last"));
        record.setSpecialty(rs.getString("specialty"));
        record.setServiceName(rs.getString("service_name"));
        record.setAppointmentDate(rs.getTimestamp("start_time").toLocalDateTime());
        return record;
    };

    private static final String DETAIL_SELECT = """
            SELECT mr.record_id, mr.appointment_id, mr.patient_id, mr.doctor_id,
                   mr.diagnosis, mr.treatment, mr.notes AS record_notes,
                   mr.created_at AS record_created,
                   p.first_name AS patient_first, p.last_name AS patient_last,
                   du.first_name AS doctor_first, du.last_name AS doctor_last,
                   d.specialty,
                   sv.name AS service_name,
                   sl.start_time
            FROM medical_records mr
            JOIN users p ON mr.patient_id = p.user_id
            JOIN doctors d ON mr.doctor_id = d.doctor_id
            JOIN users du ON d.user_id = du.user_id
            JOIN appointments a ON mr.appointment_id = a.appointment_id
            JOIN services sv ON a.service_id = sv.service_id
            JOIN availability_slots sl ON a.slot_id = sl.slot_id
            """;

    public List<MedicalRecord> findByPatientId(Long patientId) {
        String sql = DETAIL_SELECT + " WHERE mr.patient_id = ? ORDER BY sl.start_time DESC";
        return jdbcTemplate.query(sql, recordDetailRowMapper, patientId);
    }

    public List<MedicalRecord> findByDoctorId(Long doctorId) {
        String sql = DETAIL_SELECT + " WHERE mr.doctor_id = ? ORDER BY sl.start_time DESC";
        return jdbcTemplate.query(sql, recordDetailRowMapper, doctorId);
    }

    public List<MedicalRecord> findByDoctorIdAndPatientId(Long doctorId, Long patientId) {
        String sql = DETAIL_SELECT + " WHERE mr.doctor_id = ? AND mr.patient_id = ? ORDER BY sl.start_time DESC";
        return jdbcTemplate.query(sql, recordDetailRowMapper, doctorId, patientId);
    }

    public Optional<MedicalRecord> findByAppointmentId(Long appointmentId) {
        String sql = DETAIL_SELECT + " WHERE mr.appointment_id = ?";
        List<MedicalRecord> records = jdbcTemplate.query(sql, recordDetailRowMapper, appointmentId);
        return records.isEmpty() ? Optional.empty() : Optional.of(records.get(0));
    }

    public MedicalRecord insert(MedicalRecord record) {
        String sql = "INSERT INTO medical_records (appointment_id, patient_id, doctor_id, diagnosis, treatment, notes) "
                +
                "VALUES (?, ?, ?, ?, ?, ?)";
        logger.info("Creating medical record for appointment {}", record.getAppointmentId());

        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            ps.setLong(1, record.getAppointmentId());
            ps.setLong(2, record.getPatientId());
            ps.setLong(3, record.getDoctorId());
            ps.setString(4, record.getDiagnosis());
            ps.setString(5, record.getTreatment());
            ps.setString(6, record.getNotes());
            return ps;
        }, keyHolder);

        record.setRecordId(keyHolder.getKey().longValue());
        logger.info("Created medical record ID: {}", record.getRecordId());
        return record;
    }
}
