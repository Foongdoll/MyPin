package com.foongdoll.server.schedule.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class ScheduleCalendarResponse {
    private final String month;
    private final List<ScheduleCalendarDayResponse> days;
}
