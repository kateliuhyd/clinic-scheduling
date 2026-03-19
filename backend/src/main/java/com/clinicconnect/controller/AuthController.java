package com.clinicconnect.controller;

import com.clinicconnect.config.JwtUtil;
import com.clinicconnect.dto.*;
import com.clinicconnect.exception.BadRequestException;
import com.clinicconnect.model.User;
import com.clinicconnect.model.UserRole;
import com.clinicconnect.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthController(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        logger.info("Login attempt for user: {}", request.getUsername());

        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new BadRequestException("Invalid username or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new BadRequestException("Invalid username or password");
        }

        if (!user.isActive()) {
            throw new BadRequestException("Account is deactivated");
        }

        String token = jwtUtil.generateToken(user.getUserId(), user.getUsername(), user.getRole().name());

        AuthResponse authResponse = new AuthResponse(
                token, user.getUserId(), user.getUsername(),
                user.getRole().name(), user.getFirstName(), user.getLastName());

        logger.info("User {} logged in successfully", user.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Login successful", authResponse));
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        logger.info("Registration attempt for user: {}", request.getUsername());

        if (userRepository.existsByUsername(request.getUsername())) {
            throw new BadRequestException("Username already exists");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email already exists");
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setPhone(request.getPhone());
        user.setRole(UserRole.PATIENT);
        user.setActive(true);

        user = userRepository.save(user);

        String token = jwtUtil.generateToken(user.getUserId(), user.getUsername(), user.getRole().name());

        AuthResponse authResponse = new AuthResponse(
                token, user.getUserId(), user.getUsername(),
                user.getRole().name(), user.getFirstName(), user.getLastName());

        logger.info("User {} registered successfully", user.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Registration successful", authResponse));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<AuthResponse>> getCurrentUser(
            @RequestHeader("Authorization") String authHeader) {
        String token = authHeader.substring(7);
        Long userId = jwtUtil.getUserId(token);
        String username = jwtUtil.getUsername(token);
        String role = jwtUtil.getRole(token);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BadRequestException("User not found"));

        AuthResponse authResponse = new AuthResponse(
                token, user.getUserId(), user.getUsername(),
                user.getRole().name(), user.getFirstName(), user.getLastName());

        return ResponseEntity.ok(ApiResponse.success(authResponse));
    }
}
