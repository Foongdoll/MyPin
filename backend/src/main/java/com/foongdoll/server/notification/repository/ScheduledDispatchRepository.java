package com.foongdoll.server.notification.repository;

import com.foongdoll.server.notification.domain.ScheduledDispatch;
import com.foongdoll.server.notification.model.ScheduledDispatchStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.Instant;
import java.util.List;

public interface ScheduledDispatchRepository extends JpaRepository<ScheduledDispatch, Long> {

    @Query("""
        SELECT d FROM ScheduledDispatch d
        WHERE d.status = com.foongdoll.server.notification.model.ScheduledDispatchStatus.PENDING
          AND d.scheduledAt <= ?1
        ORDER BY d.scheduledAt ASC
        """)
    List<ScheduledDispatch> findDueDispatches(Long now);

    long countByStatus(ScheduledDispatchStatus status);
}
