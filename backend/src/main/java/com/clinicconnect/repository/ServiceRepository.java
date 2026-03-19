package com.clinicconnect.repository;

import com.clinicconnect.model.ClinicService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public class ServiceRepository {

    private static final Logger logger = LoggerFactory.getLogger(ServiceRepository.class);
    private final JdbcTemplate jdbcTemplate;

    public ServiceRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private final RowMapper<ClinicService> serviceRowMapper = (rs, rowNum) -> {
        ClinicService service = new ClinicService();
        service.setServiceId(rs.getLong("service_id"));
        service.setName(rs.getString("name"));
        service.setDescription(rs.getString("description"));
        service.setDurationMinutes(rs.getInt("duration_minutes"));
        service.setPrice(rs.getBigDecimal("price"));
        service.setActive(rs.getBoolean("active"));
        service.setCreatedAt(rs.getTimestamp("created_at").toLocalDateTime());
        return service;
    };

    public List<ClinicService> findAllActive() {
        String sql = "SELECT * FROM services WHERE active = TRUE ORDER BY name";
        return jdbcTemplate.query(sql, serviceRowMapper);
    }

    public List<ClinicService> findAll() {
        String sql = "SELECT * FROM services ORDER BY name";
        return jdbcTemplate.query(sql, serviceRowMapper);
    }

    public Optional<ClinicService> findById(Long serviceId) {
        String sql = "SELECT * FROM services WHERE service_id = ?";
        List<ClinicService> services = jdbcTemplate.query(sql, serviceRowMapper, serviceId);
        return services.isEmpty() ? Optional.empty() : Optional.of(services.get(0));
    }
}
