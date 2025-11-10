package com.foongdoll.server.schedule.repository;

import com.foongdoll.server.schedule.domain.Schedule;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;

public interface ScheduleRepository extends JpaRepository<Schedule, Long> {

    @Query("""
            SELECT s FROM Schedule s
            WHERE (:targetDate IS NULL OR (s.startDate <= :targetDate AND s.endDate >= :targetDate))
            """)
    Page<Schedule> findByTargetDate(@Param("targetDate") LocalDate targetDate, Pageable pageable);
}
