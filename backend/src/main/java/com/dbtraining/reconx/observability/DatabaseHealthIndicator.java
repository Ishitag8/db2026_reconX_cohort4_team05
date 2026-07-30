package com.dbtraining.reconx.observability;

import org.springframework.boot.actuate.health.AbstractHealthIndicator;
import org.springframework.boot.actuate.health.Health;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.time.Duration;

/**
 * ============================================================================
 * TICKET-ADV059 — DatabaseHealthIndicator (timed SELECT 1)
 *
 * WHAT:    Custom actuator HealthIndicator that runs a fast `SELECT 1` with
 *          a 2-second timeout and reports elapsedMs as a detail.
 * HOW:     Extends AbstractHealthIndicator; Spring picks it up by bean name
 *          and exposes it as reconxDatabase under /actuator/health.
 * WHY:     The default DataSource health indicator works, but a custom one
 *          gives us a controllable timeout AND visible latency for SRE
 *          dashboards.
 * OBSERVE: GET /api/actuator/health -> components.reconxDatabase is UP with
 *          details `{"query":"SELECT 1","elapsedMs": <number>}`.
 * ============================================================================
 *
 *  TODO(TICKET-ADV059):
 *    long start = System.nanoTime();
 *    try (Connection c = ds.getConnection(); Statement s = c.createStatement()) {
 *        s.setQueryTimeout(2);
 *        s.execute("SELECT 1");
 *        builder.up().withDetail("latencyMs", (System.nanoTime() - start) / 1_000_000);
 *    }
 *
 *  HINT: Throw any exception out of this method — AbstractHealthIndicator
 *        converts it to DOWN with the exception class as a detail.
 * ============================================================================
 */
@Component("reconxDatabase")
public class DatabaseHealthIndicator extends AbstractHealthIndicator {

    private static final String QUERY = "SELECT 1";
    private static final Duration TIMEOUT = Duration.ofSeconds(2);

    private final DataSource ds;

    public DatabaseHealthIndicator(DataSource ds) {
        super("ReconX database health check failed");
        this.ds = ds;
    }

    @Override
    protected void doHealthCheck(Health.Builder builder) throws Exception {
        long start = System.nanoTime();
        try (Connection connection = ds.getConnection();
             Statement statement = connection.createStatement()) {
            statement.setQueryTimeout((int) TIMEOUT.toSeconds());
            try (ResultSet resultSet = statement.executeQuery(QUERY)) {
                resultSet.next();
            }

            long elapsedMs = (System.nanoTime() - start) / 1_000_000;
            builder.up()
                    .withDetail("query", QUERY)
                    .withDetail("elapsedMs", elapsedMs);
        } catch (SQLException e) {
            builder.down(e).withDetail("query", QUERY);
        }
    }
}
