package com.dbtraining.reconx.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.config.annotation.web.configuration.WebSecurityCustomizer;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.access.AccessDeniedHandlerImpl;
import org.springframework.http.HttpStatus;
import org.springframework.web.cors.CorsConfiguration;


/**
 * ============================================================================
 * Stateless security filter chain wiring JWT filter
 * RBAC: HTTP-method + path level role rules
 * Roles: ADMIN, TRADER, VIEWER, RECON_ANALYST
 *
 * NOTE: `/api` context-path is set in application.yml, so paths here
 * are relative to that (e.g. /v1/trades resolves to /api/v1/trades).
 * ============================================================================
 */
@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public WebSecurityCustomizer webSecurityCustomizer() {
        return (web) -> web.ignoring().requestMatchers(
                "/v1/trades/stream",
                "/v1/trades/recent",
                "/v1/recon/breaks/count"
        );
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http, JwtAuthenticationFilter jwtFilter) throws Exception {
        http
                .cors(cors -> cors.configurationSource(request -> {
                    var config = new CorsConfiguration();
                    config.setAllowedOrigins(java.util.List.of("*"));
                    config.setAllowedMethods(java.util.List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
                    config.setAllowedHeaders(java.util.List.of("*"));
                    return config;
                }))
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(e -> e
                    .authenticationEntryPoint(
                             new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED))
                    .accessDeniedHandler(
                             new AccessDeniedHandlerImpl()))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.GET, "/v1/trades/stream").permitAll()
                        .requestMatchers(
                                "/auth/login",
                                "/actuator/health/**",
                                "/actuator/info",
                                "/actuator/prometheus",
                                "/swagger-ui.html",
                                "/swagger-ui/**",
                                "/v3/api-docs/**",
                                "/h2/**",
                                "/error")
                        .permitAll()
                        .requestMatchers(HttpMethod.GET, "/v1/trades/search").hasAnyRole("VIEWER", "TRADER", "RECON_ANALYST", "ADMIN")
                        .requestMatchers(HttpMethod.GET, "/v1/trades/stats").hasAnyRole("VIEWER", "TRADER", "RECON_ANALYST", "ADMIN")
                        .requestMatchers(HttpMethod.GET, "/v1/trades/**")
                        .hasAnyRole("VIEWER", "TRADER", "RECON_ANALYST", "ADMIN")
                        .requestMatchers(HttpMethod.POST, "/v1/trades").hasAnyRole("TRADER", "ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/v1/trades/**").hasAnyRole("TRADER", "ADMIN")
                        .requestMatchers(HttpMethod.PATCH, "/v1/trades/**").hasAnyRole("TRADER", "ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/v1/trades/**").hasRole("ADMIN")
                        .requestMatchers("/v1/recon/**").hasAnyRole("RECON_ANALYST", "ADMIN")
                        .requestMatchers("/v1/audit/**").hasAnyRole("RECON_ANALYST", "ADMIN")
                        .anyRequest().authenticated())
                .headers(h -> h.frameOptions(f -> f.disable())) // for /h2 dev console
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

     
}
