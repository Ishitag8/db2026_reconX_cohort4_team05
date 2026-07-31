package com.dbtraining.reconx.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;

/**
 * ============================================================================
 * TICKET-ADV072 — JwtTokenProvider (jjwt 0.12.x API)
 *
 * WHAT: Generates + validates HS256-signed JWTs.
 * HOW: Subject = email. Role goes into a custom "role" claim that
 * {@link JwtAuthenticationFilter} turns into a GrantedAuthority.
 * WHY: Self-contained (no DB hit per request) and stateless (no session).
 * OBSERVE: Decode any token at jwt.io with the configured secret.
 * ============================================================================
 *
 * TODO(TICKET-ADV072):
 * public String generate(String email, String role) {
 * Instant now = Instant.now();
 * Instant exp = now.plusSeconds(expirationMinutes * 60);
 * return Jwts.builder()
 * .subject(email)
 * .issuer(issuer)
 * .issuedAt(Date.from(now))
 * .expiration(Date.from(exp))
 * .claims(Map.of("role", role))
 * .signWith(key)
 * .compact();
 * }
 *
 * public Claims parse(String token) {
 * return Jwts.parser()
 * .verifyWith(key)
 * .requireIssuer(issuer)
 * .build()
 * .parseSignedClaims(token)
 * .getPayload();
 * }
 *
 * HINT: jjwt 0.12 uses .subject() / .issuer() / .claims() / .signWith() —
 * the older 0.11 builder API (.setSubject etc.) is deprecated.
 * GOTCHA: HS256 needs a key of at least 256 bits — short secrets throw
 * io.jsonwebtoken.security.WeakKeyException at startup.
 * ============================================================================
 */
@Component
public class JwtTokenProvider {

    private final SecretKey key;
    private final long expirationMinutes;
    private final String issuer;

    public JwtTokenProvider(@Value("${reconx.security.jwt.secret}") String secret,
            @Value("${reconx.security.jwt.expiration-minutes}") long expirationMinutes,
            @Value("${reconx.security.jwt.issuer}") String issuer) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationMinutes = expirationMinutes;
        this.issuer = issuer;
    }

    public String generate(String email, String role) {
        java.time.Instant now = java.time.Instant.now();
        java.util.Date issuedAt = java.util.Date.from(now);
        java.util.Date expiresAt = java.util.Date.from(now.plusSeconds(expirationMinutes * 60));

        return Jwts.builder()
                .setSubject(email)
                .setIssuer(issuer)
                .setIssuedAt(issuedAt)
                .setExpiration(expiresAt)
                .claim("role", role)
                .signWith(key)
                .compact();
    }

    public Claims parse(String token) {
        // Support multiple jjwt versions at runtime by trying the newer parserBuilder
        // API first via reflection; fall back to the older parser() API if unavailable.
        try {
            java.lang.reflect.Method parserBuilderMethod = Jwts.class.getMethod("parserBuilder");
            Object builder = parserBuilderMethod.invoke(null);

            java.lang.reflect.Method setSigningKey = builder.getClass().getMethod("setSigningKey", java.security.Key.class);
            Object withKey = setSigningKey.invoke(builder, key);

            java.lang.reflect.Method requireIssuer = withKey.getClass().getMethod("requireIssuer", String.class);
            Object withIssuer = requireIssuer.invoke(withKey, issuer);

            java.lang.reflect.Method build = withIssuer.getClass().getMethod("build");
            Object parser = build.invoke(withIssuer);

            java.lang.reflect.Method parseClaimsJws = parser.getClass().getMethod("parseClaimsJws", String.class);
            Object jws = parseClaimsJws.invoke(parser, token);

            java.lang.reflect.Method getBody = jws.getClass().getMethod("getBody");
            return (Claims) getBody.invoke(jws);
        } catch (NoSuchMethodException e) {
            // parserBuilder() not present — try the older parser() API via reflection
            try {
                java.lang.reflect.Method parserMethod = Jwts.class.getMethod("parser");
                Object parserObj = parserMethod.invoke(null);

                java.lang.reflect.Method setSigningKey2 = parserObj.getClass().getMethod("setSigningKey", java.security.Key.class);
                Object parserWithKey = setSigningKey2.invoke(parserObj, key);

                java.lang.reflect.Method requireIssuer2 = parserWithKey.getClass().getMethod("requireIssuer", String.class);
                Object parserWithIssuer = requireIssuer2.invoke(parserWithKey, issuer);

                java.lang.reflect.Method parseClaimsJws2 = parserWithIssuer.getClass().getMethod("parseClaimsJws", String.class);
                Object jws = parseClaimsJws2.invoke(parserWithIssuer, token);

                java.lang.reflect.Method getBody2 = jws.getClass().getMethod("getBody");
                return (Claims) getBody2.invoke(jws);
            } catch (Exception ex) {
                throw new RuntimeException("Failed to parse JWT (fallback)", ex);
            }
        } catch (RuntimeException re) {
            throw re;
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse JWT", e);
        }
    }

    public long expirationSeconds() {
        return expirationMinutes * 60;
    }
}
