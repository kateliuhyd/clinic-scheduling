package com.clinicconnect.repository;

import com.clinicconnect.model.Doctor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.sql.Types;
import java.util.List;
import java.util.Optional;

@Repository
public class DoctorRepository {

    private static final Logger logger = LoggerFactory.getLogger(DoctorRepository.class);
    private final JdbcTemplate jdbcTemplate;

    public DoctorRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private final RowMapper<Doctor> doctorRowMapper = (rs, rowNum) -> {
        Doctor doctor = new Doctor();
        doctor.setDoctorId(rs.getLong("doctor_id"));
        doctor.setUserId(rs.getLong("user_id"));
        long deptId = rs.getLong("department_id");
        doctor.setDepartmentId(rs.wasNull() ? null : deptId);
        doctor.setSpecialty(rs.getString("specialty"));
        doctor.setBio(rs.getString("bio"));
        doctor.setActive(rs.getBoolean("active"));
        doctor.setCreatedAt(rs.getTimestamp("created_at").toLocalDateTime());
        return doctor;
    };

    private final RowMapper<Doctor> doctorDetailRowMapper = (rs, rowNum) -> {
        Doctor doctor = new Doctor();
        doctor.setDoctorId(rs.getLong("doctor_id"));
        doctor.setUserId(rs.getLong("user_id"));
        long deptId = rs.getLong("department_id");
        doctor.setDepartmentId(rs.wasNull() ? null : deptId);
        doctor.setSpecialty(rs.getString("specialty"));
        doctor.setBio(rs.getString("bio"));
        doctor.setActive(rs.getBoolean("d_active"));
        doctor.setCreatedAt(rs.getTimestamp("d_created_at").toLocalDateTime());
        doctor.setFirstName(rs.getString("first_name"));
        doctor.setLastName(rs.getString("last_name"));
        doctor.setEmail(rs.getString("email"));
        doctor.setPhone(rs.getString("phone"));
        doctor.setDepartmentName(rs.getString("dept_name"));
        return doctor;
    };

    public List<Doctor> findAllWithDetails() {
        String sql = """
            SELECT d.doctor_id, d.user_id, d.department_id, d.specialty, d.bio,
                   d.active AS d_active, d.created_at AS d_created_at,
                   u.first_name, u.last_name, u.email, u.phone,
                   dep.name AS dept_name
            FROM doctors d
            JOIN users u ON d.user_id = u.user_id
            LEFT JOIN departments dep ON d.department_id = dep.department_id
            WHERE d.active = TRUE
            ORDER BY u.last_name, u.first_name
            """;
        return jdbcTemplate.query(sql, doctorDetailRowMapper);
    }

    public Optional<Doctor> findByIdWithDetails(Long doctorId) {
        String sql = """
            SELECT d.doctor_id, d.user_id, d.department_id, d.specialty, d.bio,
                   d.active AS d_active, d.created_at AS d_created_at,
                   u.first_name, u.last_name, u.email, u.phone,
                   dep.name AS dept_name
            FROM doctors d
            JOIN users u ON d.user_id = u.user_id
            LEFT JOIN departments dep ON d.department_id = dep.department_id
            WHERE d.doctor_id = ?
            """;
        List<Doctor> doctors = jdbcTemplate.query(sql, doctorDetailRowMapper, doctorId);
        return doctors.isEmpty() ? Optional.empty() : Optional.of(doctors.get(0));
    }

    public Optional<Doctor> findByUserId(Long userId) {
        String sql = "SELECT * FROM doctors WHERE user_id = ?";
        List<Doctor> doctors = jdbcTemplate.query(sql, doctorRowMapper, userId);
        return doctors.isEmpty() ? Optional.empty() : Optional.of(doctors.get(0));
    }

    public Optional<Doctor> findById(Long doctorId) {
        String sql = "SELECT * FROM doctors WHERE doctor_id = ?";
        List<Doctor> doctors = jdbcTemplate.query(sql, doctorRowMapper, doctorId);
        return doctors.isEmpty() ? Optional.empty() : Optional.of(doctors.get(0));
    }

    public List<Doctor> findByDepartmentId(Long departmentId) {
        String sql = """
            SELECT d.doctor_id, d.user_id, d.department_id, d.specialty, d.bio,
                   d.active AS d_active, d.created_at AS d_created_at,
                   u.first_name, u.last_name, u.email, u.phone,
                   dep.name AS dept_name
            FROM doctors d
            JOIN users u ON d.user_id = u.user_id
            LEFT JOIN departments dep ON d.department_id = dep.department_id
            WHERE d.department_id = ? AND d.active = TRUE
            ORDER BY u.last_name
            """;
        return jdbcTemplate.query(sql, doctorDetailRowMapper, departmentId);
    }

    public Doctor save(Doctor doctor) {
        if (doctor.getDoctorId() == null) {
            return insert(doctor);
        } else {
            return update(doctor);
        }
    }

    private Doctor insert(Doctor doctor) {
        String sql = "INSERT INTO doctors (user_id, department_id, specialty, bio, active) VALUES (?, ?, ?, ?, ?)";
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            ps.setLong(1, doctor.getUserId());
            if (doctor.getDepartmentId() != null) {
                ps.setLong(2, doctor.getDepartmentId());
            } else {
                ps.setNull(2, Types.BIGINT);
            }
            ps.setString(3, doctor.getSpecialty());
            ps.setString(4, doctor.getBio());
            ps.setBoolean(5, doctor.isActive());
            return ps;
        }, keyHolder);
        doctor.setDoctorId(keyHolder.getKey().longValue());
        logger.info("Created doctor profile with ID: {}", doctor.getDoctorId());
        return doctor;
    }

    private Doctor update(Doctor doctor) {
        String sql = "UPDATE doctors SET department_id = ?, specialty = ?, bio = ?, active = ? WHERE doctor_id = ?";
        jdbcTemplate.update(sql,
                doctor.getDepartmentId(), doctor.getSpecialty(),
                doctor.getBio(), doctor.isActive(), doctor.getDoctorId());
        return doctor;
    }
}
