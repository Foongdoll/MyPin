package com.foongdoll.server.schedule.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ScheduleReactionResponse {
    private final long likes;
    private final boolean isLiked;
}
