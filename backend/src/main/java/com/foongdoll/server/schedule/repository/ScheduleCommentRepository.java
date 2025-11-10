package com.foongdoll.server.schedule.repository;

import com.foongdoll.server.schedule.domain.ScheduleComment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ScheduleCommentRepository extends JpaRepository<ScheduleComment, Long> {
    List<ScheduleComment> findByScheduleIdOrderByCreatedAtDesc(Long scheduleId);
}
