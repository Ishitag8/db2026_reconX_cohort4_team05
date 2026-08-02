package com.dbtraining.reconx.controller;

import com.dbtraining.reconx.dto.LoginRequest;
import com.dbtraining.reconx.dto.LoginResponse;
import com.dbtraining.reconx.exception.InvalidTradeException;
import com.dbtraining.reconx.repository.AppUserRepository;
import com.dbtraining.reconx.repository.entity.AppUser;
import com.dbtraining.reconx.security.JwtTokenProvider;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

/**
 * TICKET-ADV072 — POST /api/auth/login
 *
 * Verifies BCrypt password, returns a JWT carrying the user's role.
 */
@RestController
@RequestMapping("/auth")
@Tag(name = "auth")
public class AuthController {

    private final AppUserRepository users;
    private final PasswordEncoder encoder;
    private final JwtTokenProvider jwt;

    public AuthController(AppUserRepository users, PasswordEncoder encoder, JwtTokenProvider jwt) {
        this.users = users;
        this.encoder = encoder;
        this.jwt = jwt;
    }

    @PostMapping("/login")
public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest req) {

    System.out.println(">>> Login reached");
    System.out.println("Email = " + req.email());

    AppUser u = users.findByEmail(req.email())
            .orElseThrow(() -> {
                System.out.println(">>> User not found");
                return new InvalidTradeException("Invalid credentials");
            });

    System.out.println(">>> User found: " + u.getEmail());
    System.out.println(">>> Enabled = " + u.getEnabled());

    boolean ok = encoder.matches(req.password(), u.getPasswordHash());
    System.out.println(">>> Password matches = " + ok);

    if (!u.getEnabled() || !ok) {
        throw new InvalidTradeException("Invalid credentials");
    }

    String token = jwt.generate(u.getEmail(), u.getRole());
    return ResponseEntity.ok(
            new LoginResponse(token, "Bearer", jwt.expirationSeconds(), u.getRole()));
}
}