package com.clinicconnect.dto;

public class AuthResponse {
    private String token;
    private Long userId;
    private String username;
    private String role;
    private String firstName;
    private String lastName;

    public AuthResponse(String token, Long userId, String username, String role,
                        String firstName, String lastName) {
        this.token = token;
        this.userId = userId;
        this.username = username;
        this.role = role;
        this.firstName = firstName;
        this.lastName = lastName;
    }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }
}
