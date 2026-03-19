package com.clinicconnect.controller;

import com.clinicconnect.dto.ApiResponse;
import com.clinicconnect.exception.ResourceNotFoundException;
import com.clinicconnect.repository.DoctorRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/doctors")
public class DoctorController {

    private final DoctorRepository doctorRepository;

    public DoctorController(DoctorRepository doctorRepository) {
        this.doctorRepository = doctorRepository;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<?>> getAll() {
        return ResponseEntity.ok(ApiResponse.success("Doctors retrieved", doctorRepository.findAllWithDetails()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<?>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Doctor retrieved",
                doctorRepository.findByIdWithDetails(id)
                        .orElseThrow(() -> new ResourceNotFoundException("Doctor not found: " + id))));
    }

    @GetMapping("/department/{deptId}")
    public ResponseEntity<ApiResponse<?>> getByDepartment(@PathVariable Long deptId) {
        return ResponseEntity.ok(ApiResponse.success("Doctors retrieved",
                doctorRepository.findByDepartmentId(deptId)));
    }
}
