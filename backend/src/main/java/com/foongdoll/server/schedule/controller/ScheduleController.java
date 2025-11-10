package com.foongdoll.server.schedule.controller;

import com.foongdoll.server.common.response.ApiResponse;
import com.foongdoll.server.schedule.dto.ScheduleCommentRequest;
import com.foongdoll.server.schedule.dto.ScheduleCommentResponse;
import com.foongdoll.server.schedule.dto.ScheduleCreateRequest;
import com.foongdoll.server.schedule.dto.ScheduleListResponse;
import com.foongdoll.server.schedule.dto.ScheduleReactionResponse;
import com.foongdoll.server.schedule.dto.ScheduleResponse;
import com.foongdoll.server.schedule.service.ScheduleService;
import com.foongdoll.server.security.model.AuthenticatedUser;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/schedules")
@RequiredArgsConstructor
public class ScheduleController {

    private final ScheduleService scheduleService;

    @GetMapping
    public ResponseEntity<ApiResponse<ScheduleListResponse>> getSchedules(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "5") int pageSize,
            @RequestParam(required = false) String date
    ) {
        ScheduleListResponse response = scheduleService.getSchedules(page, pageSize, date);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ScheduleResponse>> createSchedule(
            @AuthenticationPrincipal AuthenticatedUser user,
            @Valid @RequestBody ScheduleCreateRequest request
    ) {
        ScheduleResponse response = scheduleService.createSchedule(request, user.getId());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{scheduleId}/comments")
    public ResponseEntity<ApiResponse<List<ScheduleCommentResponse>>> getComments(
            @PathVariable Long scheduleId
    ) {
        List<ScheduleCommentResponse> responses = scheduleService.getComments(scheduleId);
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @PostMapping("/{scheduleId}/comments")
    public ResponseEntity<ApiResponse<ScheduleCommentResponse>> addComment(
            @PathVariable Long scheduleId,
            @Valid @RequestBody ScheduleCommentRequest request
    ) {
        ScheduleCommentResponse response = scheduleService.addComment(scheduleId, request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{scheduleId}/likes")
    public ResponseEntity<ApiResponse<ScheduleReactionResponse>> getReaction(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable Long scheduleId
    ) {
        ScheduleReactionResponse response = scheduleService.getReaction(scheduleId, user.getId());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/{scheduleId}/likes/toggle")
    public ResponseEntity<ApiResponse<ScheduleReactionResponse>> toggleReaction(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable Long scheduleId
    ) {
        ScheduleReactionResponse response = scheduleService.toggleReaction(scheduleId, user.getId());
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
