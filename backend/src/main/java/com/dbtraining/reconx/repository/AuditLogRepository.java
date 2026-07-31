package com.dbtraining.reconx.repository;

import com.dbtraining.reconx.repository.entity.AuditLogEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLogEntry, Long> {
    List<AuditLogEntry> findByTradeRefOrderByEventTimestampAsc(String tradeRef);
}
