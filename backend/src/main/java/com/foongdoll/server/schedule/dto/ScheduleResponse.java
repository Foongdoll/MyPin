package com.foongdoll.server.schedule.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class ScheduleResponse {
    private final Long no;
    private final String title;
    private final String startDate;
    private final String endDate;
    private final List<String> participant;
    private final String memo;
    private final String place;
    private final Double x;
    private final Double y;
}
