package com.foongdoll.server.schedule.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class ScheduleListResponse {
    private final List<ScheduleResponse> items;
    private final long total;
    private final int page;
    private final int pageSize;
}
