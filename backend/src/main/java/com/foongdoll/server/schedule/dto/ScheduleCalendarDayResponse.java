package com.foongdoll.server.schedule.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ScheduleCalendarDayResponse {
    private final String date;
    private final long count;
}
