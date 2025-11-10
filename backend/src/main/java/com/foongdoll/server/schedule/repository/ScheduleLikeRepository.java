package com.foongdoll.server.schedule.repository;

import com.foongdoll.server.schedule.domain.ScheduleLike;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ScheduleLikeRepository extends JpaRepository<ScheduleLike, Long> {
    Optional<ScheduleLike> findByScheduleIdAndUserId(Long scheduleId, Long userId);
    boolean existsByScheduleIdAndUserId(Long scheduleId, Long userId);
    long countByScheduleId(Long scheduleId);
    void deleteByScheduleId(Long scheduleId);
}
