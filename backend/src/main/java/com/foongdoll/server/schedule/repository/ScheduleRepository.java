package com.foongdoll.server.schedule.repository;

import com.foongdoll.server.schedule.domain.Schedule;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface ScheduleRepository extends JpaRepository<Schedule, Long> {

    @Query("""
    SELECT s FROM Schedule s
    WHERE (:targetDate IS NULL OR (s.startDate <= :targetDate AND s.endDate >= :targetDate))
      AND (:ownerId IS NULL OR s.owner.id = :ownerId)
    """)
    Page<Schedule> findByTargetDateAndOwnerId(
            @Param("targetDate") LocalDate targetDate,
            @Param("ownerId") Long ownerId,
            Pageable pageable
    );

    @Query("""
            SELECT s FROM Schedule s
            WHERE (:startDate IS NULL OR s.endDate >= :startDate)
              AND (:endDate IS NULL OR s.startDate <= :endDate)
              AND (:ownerId IS NULL OR s.owner.id = :ownerId)
            """)
    List<Schedule> findByDateRangeAndOwnerId(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("ownerId") Long ownerId
    );
}
