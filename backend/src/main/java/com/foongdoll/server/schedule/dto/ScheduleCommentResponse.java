package com.foongdoll.server.schedule.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ScheduleCommentResponse {
    private final String id;
    private final String author;
    private final String content;
    private final String createdAt;
}
