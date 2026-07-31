package com.dbtraining.reconx.observability;

import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.Test;
import org.slf4j.MDC;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

class MdcFilterTest {

    @Test
    void putsCorrelationIdIntoMdc_duringChain() throws Exception {
        MdcFilter filter = new MdcFilter();
        HttpServletRequest req = mock(HttpServletRequest.class);
        HttpServletResponse res = mock(HttpServletResponse.class);
        when(req.getHeader("X-Correlation-Id")).thenReturn("foo-123");

        FilterChain chain = (rq, rs) -> {
            assertThat(MDC.get("correlationId")).isEqualTo("foo-123");
        };

        filter.doFilter(req, res, chain);

        assertThat(MDC.get("correlationId")).isNull(); // cleared after
    }
}