package com.clinicconnect.controller;

import com.clinicconnect.dto.ApiResponse;
import com.clinicconnect.exception.ResourceNotFoundException;
import com.clinicconnect.repository.ServiceRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/services")
public class ServiceController {

    private final ServiceRepository serviceRepository;

    public ServiceController(ServiceRepository serviceRepository) {
        this.serviceRepository = serviceRepository;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<?>> getActiveServices() {
        return ResponseEntity.ok(ApiResponse.success("Services retrieved", serviceRepository.findAllActive()));
    }

    @GetMapping("/all")
    public ResponseEntity<ApiResponse<?>> getAllServices() {
        return ResponseEntity.ok(ApiResponse.success("All services", serviceRepository.findAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<?>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Service retrieved",
                serviceRepository.findById(id)
                        .orElseThrow(() -> new ResourceNotFoundException("Service not found: " + id))));
    }
}
