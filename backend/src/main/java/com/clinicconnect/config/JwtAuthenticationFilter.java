package com.clinicconnect.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(JwtAuthenticationFilter.class);
    private final JwtUtil jwtUtil;

    public JwtAuthenticationFilter(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String authHeader = request.getHeader("Authorization");
        String requestURI = request.getRequestURI();

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            try {
                if (jwtUtil.validateToken(token)) {
                    String username = jwtUtil.getUsername(token);
                    Long userId = jwtUtil.getUserId(token);
                    String role = jwtUtil.getRole(token);

                    UsernamePasswordAuthenticationToken authToken =
                            new UsernamePasswordAuthenticationToken(
                                    userId,
                                    username,
                                    Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + role)));

                    SecurityContextHolder.getContext().setAuthentication(authToken);
                    logger.info("JWT AUTH OK: user={}, userId={}, role={}, uri={}", username, userId, role, requestURI);
                } else {
                    logger.warn("JWT AUTH FAIL: token invalid for uri={}", requestURI);
                }
            } catch (Exception e) {
                logger.warn("JWT AUTH ERROR: {} for uri={}", e.getMessage(), requestURI);
            }
        } else {
            logger.debug("JWT AUTH SKIP: no Bearer token for uri={}", requestURI);
        }

        filterChain.doFilter(request, response);
    }
}
