package com.dbtraining.reconx.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
<<<<<<< Updated upstream
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
=======
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
>>>>>>> Stashed changes
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
<<<<<<< Updated upstream
 * ============================================================================
 * Stateless security filter chain wiring JWT filter
 * RBAC: HTTP-method + path level role rules
 *                Roles: ADMIN, TRADER, VIEWER, RECON_ANALYST
 *
 * NOTE: `/api` context-path is set in application.yml, so paths here
 *       are relative to that (e.g. /v1/trades resolves to /api/v1/trades).
 * ============================================================================
=======
 * SecurityConfig — TICKET-ADV073 + TICKET-ADV074
 *
 * Spring Security filter chain for the backend, exposing a permit-all development
 * configuration for now. PasswordEncoder is provided for future JWT auth login.
>>>>>>> Stashed changes
 */
@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
<<<<<<< Updated upstream
    public PasswordEncoder passwordEncoder() { return new BCryptPasswordEncoder(); }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http, JwtAuthenticationFilter jwtFilter) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(
                        "/auth/login",
                        "/actuator/health/**",
                        "/actuator/info",
                        "/actuator/prometheus",
                        "/swagger-ui.html",
                        "/swagger-ui/**",
                        "/v3/api-docs/**",
                        "/h2/**"
                ).permitAll()
                .requestMatchers(HttpMethod.GET,    "/v1/trades/**").hasAnyRole("VIEWER","TRADER","RECON_ANALYST","ADMIN")
                .requestMatchers(HttpMethod.POST,   "/v1/trades").hasAnyRole("TRADER","ADMIN")
                .requestMatchers(HttpMethod.PUT,    "/v1/trades/**").hasAnyRole("TRADER","ADMIN")
                .requestMatchers(HttpMethod.PATCH,  "/v1/trades/**").hasAnyRole("TRADER","ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/v1/trades/**").hasRole("ADMIN")
                .requestMatchers("/v1/recon/**").hasAnyRole("RECON_ANALYST","ADMIN")
                .requestMatchers("/v1/audit/**").hasAnyRole("RECON_ANALYST","ADMIN")
                .anyRequest().authenticated()
            )
            .headers(h -> h.frameOptions(f -> f.disable()))   // for /h2 dev console
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }


    // TODO(TICKET-ADV073): register JwtAuthenticationFilter before
    //                     UsernamePasswordAuthenticationFilter.
    // TODO(TICKET-ADV074): add @EnableMethodSecurity and the RBAC matchers.
=======
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
                .csrf(csrf -> csrf.disable())
                .headers(headers -> headers.frameOptions(frame -> frame.disable()))
                .authorizeHttpRequests(auth -> auth.anyRequest().permitAll())
                .build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
>>>>>>> Stashed changes
}
