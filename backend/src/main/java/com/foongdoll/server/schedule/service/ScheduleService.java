package com.foongdoll.server.schedule.service;

import com.foongdoll.server.schedule.domain.Schedule;
import com.foongdoll.server.schedule.domain.ScheduleComment;
import com.foongdoll.server.schedule.domain.ScheduleLike;
import com.foongdoll.server.schedule.dto.ScheduleCalendarDayResponse;
import com.foongdoll.server.schedule.dto.ScheduleCalendarResponse;
import com.foongdoll.server.schedule.dto.ScheduleCommentRequest;
import com.foongdoll.server.schedule.dto.ScheduleCommentResponse;
import com.foongdoll.server.schedule.dto.ScheduleCommentUpdateRequest;
import com.foongdoll.server.schedule.dto.ScheduleCreateRequest;
import com.foongdoll.server.schedule.dto.ScheduleListResponse;
import com.foongdoll.server.schedule.dto.ScheduleReactionResponse;
import com.foongdoll.server.schedule.dto.ScheduleResponse;
import com.foongdoll.server.schedule.repository.ScheduleCommentRepository;
import com.foongdoll.server.schedule.repository.ScheduleLikeRepository;
import com.foongdoll.server.schedule.repository.ScheduleRepository;
import com.foongdoll.server.security.model.AuthenticatedUser;
import com.foongdoll.server.security.service.SecurityUtils;
import com.foongdoll.server.user.domain.User;
import com.foongdoll.server.user.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.*;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.LongAdder;
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
        AuthenticatedUser u = SecurityUtils.getAuthenticatedUser();
        Pageable pageable = PageRequest.of(safePage - 1, safeSize, Sort.by(Sort.Direction.ASC, "startDate").and(Sort.by("id")));

        LocalDate targetDate = parseDate(date);
        Page<Schedule> schedulePage = scheduleRepository.findByTargetDateAndOwnerId(targetDate, u.getId(), pageable);

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

    @Transactional(readOnly = true)
    public ScheduleCalendarResponse getCalendarSummary(String month) {
        LocalDate monthStart = resolveMonthStart(month);
        LocalDate monthEnd = monthStart.plusMonths(1).minusDays(1);

        AuthenticatedUser user = SecurityUtils.getAuthenticatedUser();
        List<Schedule> schedules = scheduleRepository.findByDateRangeAndOwnerId(monthStart, monthEnd, user.getId());
        Map<LocalDate, LongAdder> dayCounters = new HashMap<>();

        for (Schedule schedule : schedules) {
            LocalDate start = schedule.getStartDate();
            LocalDate end = schedule.getEndDate();

            if (start == null || end == null) {
                continue;
            }

            LocalDate cursor = start.isBefore(monthStart) ? monthStart : start;
            LocalDate limit = end.isAfter(monthEnd) ? monthEnd : end;

            while (!cursor.isAfter(limit)) {
                dayCounters.computeIfAbsent(cursor, __ -> new LongAdder()).increment();
                cursor = cursor.plusDays(1);
            }
        }

        List<ScheduleCalendarDayResponse> days = dayCounters.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(entry -> ScheduleCalendarDayResponse.builder()
                        .date(entry.getKey().format(DATE_FORMATTER))
                        .count(entry.getValue().longValue())
                        .build())
                .toList();

        return ScheduleCalendarResponse.builder()
                .month(monthStart.format(DateTimeFormatter.ofPattern("yyyy-MM")))
                .days(days)
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

    @Transactional
    public ScheduleResponse updateSchedule(Long scheduleId, ScheduleCreateRequest request, Long userId) {
        Schedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new EntityNotFoundException("일정을 찾을 수 없습니다."));
        validateScheduleOwner(schedule, userId);

        LocalDate startDate = parseDateOrThrow(request.getStartDate(), "시작일 형식이 올바르지 않습니다.");
        LocalDate endDate = parseDateOrThrow(request.getEndDate(), "종료일 형식이 올바르지 않습니다.");

        if (endDate.isBefore(startDate)) {
            throw new IllegalArgumentException("종료일이 시작일보다 빠를 수 없습니다.");
        }

        List<String> participants = sanitizeParticipants(request.getParticipant());
        schedule.update(
                request.getTitle().trim(),
                startDate,
                endDate,
                participants,
                StringUtils.hasText(request.getMemo()) ? request.getMemo().trim() : null,
                StringUtils.hasText(request.getPlace()) ? request.getPlace().trim() : null
        );

        return toScheduleResponse(schedule);
    }

    @Transactional
    public void deleteSchedule(Long scheduleId, Long userId) {
        Schedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new EntityNotFoundException("일정을 찾을 수 없습니다."));
        validateScheduleOwner(schedule, userId);
        scheduleCommentRepository.deleteByScheduleId(scheduleId);
        scheduleLikeRepository.deleteByScheduleId(scheduleId);
        scheduleRepository.delete(schedule);
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

    @Transactional
    public ScheduleCommentResponse updateComment(Long scheduleId, Long commentId, ScheduleCommentUpdateRequest request) {
        ScheduleComment comment = scheduleCommentRepository.findByIdAndScheduleId(commentId, scheduleId)
                .orElseThrow(() -> new EntityNotFoundException("댓글을 찾을 수 없습니다."));
        validateCommentAuthor(comment, request.getAuthor());

        comment.updateContent(request.getContent().trim());
        return toCommentResponse(comment);
    }

    @Transactional
    public void deleteComment(Long scheduleId, Long commentId, String author) {
        if (!StringUtils.hasText(author)) {
            throw new IllegalArgumentException("작성자를 확인할 수 없습니다.");
        }
        ScheduleComment comment = scheduleCommentRepository.findByIdAndScheduleId(commentId, scheduleId)
                .orElseThrow(() -> new EntityNotFoundException("댓글을 찾을 수 없습니다."));
        validateCommentAuthor(comment, author);
        scheduleCommentRepository.delete(comment);
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

    private void validateScheduleOwner(Schedule schedule, Long userId) {
        if (schedule.getOwner() == null || !schedule.getOwner().getId().equals(userId)) {
            throw new AccessDeniedException("일정을 수정/삭제할 권한이 없습니다.");
        }
    }

    private void validateCommentAuthor(ScheduleComment comment, String author) {
        String trimmed = author == null ? "" : author.trim();
        if (!StringUtils.hasText(trimmed) || !comment.getAuthor().equals(trimmed)) {
            throw new AccessDeniedException("댓글을 수정/삭제할 권한이 없습니다.");
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

    private LocalDate parseFlexibleDate(String raw) {
        final String value = raw.trim().replace("\"", "");

        // 1) yyyy-MM-dd → LocalDate
        try {
            return LocalDate.parse(value, DateTimeFormatter.ISO_LOCAL_DATE);
        } catch (DateTimeParseException ignore) {}

        // 2) yyyy-MM-ddTHH:mm[:ss] → LocalDateTime
        try {
            return LocalDateTime.parse(value, DateTimeFormatter.ISO_LOCAL_DATE_TIME).toLocalDate();
        } catch (DateTimeParseException ignore) {}

        // 3) yyyy-MM-ddTHH:mm[:ss]Z 또는 +09:00 같은 오프셋 포함 → OffsetDateTime
        try {
            return OffsetDateTime.parse(value, DateTimeFormatter.ISO_OFFSET_DATE_TIME).toLocalDate();
        } catch (DateTimeParseException ignore) {}

        // 4)  ISO_INSTANT 같은 경우 (예: 2025-11-14T00:00:00Z)
        try {
            return Instant.parse(value).atZone(ZoneId.systemDefault()).toLocalDate();
        } catch (DateTimeParseException ignore) {}

        // 모두 실패 시
        throw new DateTimeParseException("Unsupported date format", value, 0);
    }

    private LocalDate resolveMonthStart(String month) {
        if (!StringUtils.hasText(month)) {
            LocalDate now = LocalDate.now();
            return LocalDate.of(now.getYear(), now.getMonth(), 1);
        }
        YearMonth yearMonth = YearMonth.parse(month, DateTimeFormatter.ofPattern("yyyy-MM"));
        return yearMonth.atDay(1);
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
                .ownerId(schedule.getOwner() != null ? schedule.getOwner().getId() : null)
                .ownerName(schedule.getOwner() != null ? schedule.getOwner().getName() : null)
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
