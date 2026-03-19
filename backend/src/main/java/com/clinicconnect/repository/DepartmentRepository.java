package com.clinicconnect.repository;

import com.clinicconnect.model.Department;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public class DepartmentRepository {

    private final JdbcTemplate jdbcTemplate;

    public DepartmentRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private final RowMapper<Department> departmentRowMapper = (rs, rowNum) -> {
        Department dept = new Department();
        dept.setDepartmentId(rs.getLong("department_id"));
        dept.setName(rs.getString("name"));
        dept.setDescription(rs.getString("description"));
        dept.setActive(rs.getBoolean("active"));
        dept.setCreatedAt(rs.getTimestamp("created_at").toLocalDateTime());
        return dept;
    };

    public List<Department> findAllActive() {
        String sql = "SELECT * FROM departments WHERE active = TRUE ORDER BY name";
        return jdbcTemplate.query(sql, departmentRowMapper);
    }

    public Optional<Department> findById(Long departmentId) {
        String sql = "SELECT * FROM departments WHERE department_id = ?";
        List<Department> depts = jdbcTemplate.query(sql, departmentRowMapper, departmentId);
        return depts.isEmpty() ? Optional.empty() : Optional.of(depts.get(0));
    }
}
