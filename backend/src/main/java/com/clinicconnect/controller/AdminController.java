package com.clinicconnect.controller;

import com.clinicconnect.dto.ApiResponse;
import com.clinicconnect.model.User;
import com.clinicconnect.model.AppointmentStatus;
import com.clinicconnect.exception.BadRequestException;
import com.clinicconnect.exception.ResourceNotFoundException;
import com.clinicconnect.repository.AppointmentRepository;
import com.clinicconnect.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final UserRepository userRepository;
    private final AppointmentRepository appointmentRepository;

    public AdminController(UserRepository userRepository, AppointmentRepository appointmentRepository) {
        this.userRepository = userRepository;
        this.appointmentRepository = appointmentRepository;
    }

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<?>> getAllUsers() {
        return ResponseEntity.ok(ApiResponse.success("Users retrieved", userRepository.findAll()));
    }

    @PutMapping("/users/{id}/toggle-active")
    public ResponseEntity<ApiResponse<?>> toggleUserActive(@PathVariable Long id, Authentication auth) {
        Long currentUserId = (Long) auth.getCredentials();

        // Prevent admin from deactivating themselves
        if (id.equals(currentUserId)) {
            throw new BadRequestException("You cannot deactivate your own account");
        }

        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));
        user.setActive(!user.isActive());
        userRepository.save(user);
        return ResponseEntity.ok(ApiResponse.success(
                user.isActive() ? "User activated" : "User deactivated", user));
    }

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<?>> getDashboard() {
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalUsers", userRepository.countAll());
        stats.put("totalAppointments", appointmentRepository.countAll());
        stats.put("bookedAppointments", appointmentRepository.countByStatus(AppointmentStatus.BOOKED));
        stats.put("completedAppointments", appointmentRepository.countByStatus(AppointmentStatus.COMPLETED));
        stats.put("canceledAppointments", appointmentRepository.countByStatus(AppointmentStatus.CANCELED));
        return ResponseEntity.ok(ApiResponse.success("Dashboard stats", stats));
    }
}
