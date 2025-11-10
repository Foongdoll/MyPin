package com.foongdoll.server.schedule.service;

import com.foongdoll.server.schedule.domain.Schedule;
import com.foongdoll.server.schedule.domain.ScheduleComment;
import com.foongdoll.server.schedule.domain.ScheduleLike;
import com.foongdoll.server.schedule.dto.ScheduleCommentRequest;
import com.foongdoll.server.schedule.dto.ScheduleCommentResponse;
import com.foongdoll.server.schedule.dto.ScheduleCreateRequest;
import com.foongdoll.server.schedule.dto.ScheduleListResponse;
import com.foongdoll.server.schedule.dto.ScheduleReactionResponse;
import com.foongdoll.server.schedule.dto.ScheduleResponse;
import com.foongdoll.server.schedule.repository.ScheduleCommentRepository;
import com.foongdoll.server.schedule.repository.ScheduleLikeRepository;
import com.foongdoll.server.schedule.repository.ScheduleRepository;
import com.foongdoll.server.user.domain.User;
import com.foongdoll.server.user.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.time.OffsetDateTime;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ScheduleService {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE;

    private final ScheduleRepository scheduleRepository;
    private final ScheduleCommentRepository scheduleCommentRepository;
    private final ScheduleLikeRepository scheduleLikeRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public ScheduleListResponse getSchedules(int page, int pageSize, String date) {
        int safePage = Math.max(1, page);
        int safeSize = Math.min(Math.max(1, pageSize), 50);
        Pageable pageable = PageRequest.of(safePage - 1, safeSize, Sort.by(Sort.Direction.ASC, "startDate").and(Sort.by("id")));

        LocalDate targetDate = parseDate(date);
        Page<Schedule> schedulePage = scheduleRepository.findByTargetDate(targetDate, pageable);

        List<ScheduleResponse> items = schedulePage.getContent().stream()
                .map(this::toScheduleResponse)
                .toList();

        return ScheduleListResponse.builder()
                .items(items)
                .total(schedulePage.getTotalElements())
                .page(schedulePage.getNumber() + 1)
                .pageSize(schedulePage.getSize())
                .build();
    }

    @Transactional
    public ScheduleResponse createSchedule(ScheduleCreateRequest request, Long userId) {
        User owner = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("사용자를 찾을 수 없습니다."));

        LocalDate startDate = parseDateOrThrow(request.getStartDate(), "시작일 형식이 올바르지 않습니다.");
        LocalDate endDate = parseDateOrThrow(request.getEndDate(), "종료일 형식이 올바르지 않습니다.");

        if (endDate.isBefore(startDate)) {
            throw new IllegalArgumentException("종료일이 시작일보다 빠를 수 없습니다.");
        }

        List<String> participants = sanitizeParticipants(request.getParticipant());

        Schedule schedule = Schedule.builder()
                .title(request.getTitle().trim())
                .startDate(startDate)
                .endDate(endDate)
                .memo(StringUtils.hasText(request.getMemo()) ? request.getMemo().trim() : null)
                .place(StringUtils.hasText(request.getPlace()) ? request.getPlace().trim() : null)
                .owner(owner)
                .build();
        schedule.setParticipants(participants);

        return toScheduleResponse(scheduleRepository.save(schedule));
    }

    @Transactional(readOnly = true)
    public List<ScheduleCommentResponse> getComments(Long scheduleId) {
        validateSchedule(scheduleId);
        return scheduleCommentRepository.findByScheduleIdOrderByCreatedAtDesc(scheduleId).stream()
                .map(this::toCommentResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public ScheduleCommentResponse addComment(Long scheduleId, ScheduleCommentRequest request) {
        Schedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new EntityNotFoundException("일정을 찾을 수 없습니다."));

        ScheduleComment comment = ScheduleComment.builder()
                .schedule(schedule)
                .author(request.getAuthor().trim())
                .content(request.getContent().trim())
                .build();

        return toCommentResponse(scheduleCommentRepository.save(comment));
    }

    @Transactional(readOnly = true)
    public ScheduleReactionResponse getReaction(Long scheduleId, Long userId) {
        validateSchedule(scheduleId);
        long likes = scheduleLikeRepository.countByScheduleId(scheduleId);
        boolean isLiked = scheduleLikeRepository.existsByScheduleIdAndUserId(scheduleId, userId);
        return ScheduleReactionResponse.builder()
                .likes(likes)
                .isLiked(isLiked)
                .build();
    }

    @Transactional
    public ScheduleReactionResponse toggleReaction(Long scheduleId, Long userId) {
        Schedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new EntityNotFoundException("일정을 찾을 수 없습니다."));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("사용자를 찾을 수 없습니다."));

        scheduleLikeRepository.findByScheduleIdAndUserId(scheduleId, userId)
                .ifPresentOrElse(scheduleLikeRepository::delete, () -> {
                    ScheduleLike like = ScheduleLike.builder()
                            .schedule(schedule)
                            .user(user)
                            .build();
                    scheduleLikeRepository.save(like);
                });

        long likes = scheduleLikeRepository.countByScheduleId(scheduleId);
        boolean isLiked = scheduleLikeRepository.existsByScheduleIdAndUserId(scheduleId, userId);
        return ScheduleReactionResponse.builder()
                .likes(likes)
                .isLiked(isLiked)
                .build();
    }

    private void validateSchedule(Long scheduleId) {
        if (!scheduleRepository.existsById(scheduleId)) {
            throw new EntityNotFoundException("일정을 찾을 수 없습니다.");
        }
    }

    private LocalDate parseDate(String date) {
        if (!StringUtils.hasText(date)) {
            return null;
        }
        try {
            return parseFlexibleDate(date);
        } catch (DateTimeParseException ex) {
            return null;
        }
    }

    private LocalDate parseDateOrThrow(String date, String message) {
        try {
            return parseFlexibleDate(date);
        } catch (DateTimeParseException ex) {
            throw new IllegalArgumentException(message);
        }
    }

    private LocalDate parseFlexibleDate(String value) {
        if (value.contains("T")) {
            return OffsetDateTime.parse(value).toLocalDate();
        }
        return LocalDate.parse(value, DATE_FORMATTER);
    }

    private List<String> sanitizeParticipants(List<String> participant) {
        if (participant == null) {
            return Collections.emptyList();
        }
        return participant.stream()
                .map(String::trim)
                .filter(StringUtils::hasText)
                .distinct()
                .collect(Collectors.toList());
    }

    private ScheduleResponse toScheduleResponse(Schedule schedule) {
        List<String> participants = schedule.getParticipants() == null
                ? Collections.emptyList()
                : List.copyOf(schedule.getParticipants());

        return ScheduleResponse.builder()
                .no(schedule.getId())
                .title(schedule.getTitle())
                .startDate(schedule.getStartDate().format(DATE_FORMATTER))
                .endDate(schedule.getEndDate().format(DATE_FORMATTER))
                .participant(participants)
                .memo(schedule.getMemo())
                .place(schedule.getPlace())
                .x(null)
                .y(null)
                .build();
    }

    private ScheduleCommentResponse toCommentResponse(ScheduleComment comment) {
        return ScheduleCommentResponse.builder()
                .id(comment.getId().toString())
                .author(comment.getAuthor())
                .content(comment.getContent())
                .createdAt(comment.getCreatedAt().toString())
                .build();
    }
}
