package com.dbtraining.reconx.repository;

import com.dbtraining.reconx.repository.entity.ReconBreak;
import com.dbtraining.reconx.repository.entity.ReconBreakStatus;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReconBreakRepository extends JpaRepository<ReconBreak, Long> {
    /** TICKET-ADV085 — exported as recon_break_count gauge. */
    long countByStatus(ReconBreakStatus status);
}
