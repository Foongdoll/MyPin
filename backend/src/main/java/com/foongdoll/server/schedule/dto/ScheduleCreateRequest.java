package com.foongdoll.server.schedule.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class ScheduleCreateRequest {

    @NotBlank(message = "제목을 입력해 주세요.")
    private String title;

    @NotBlank(message = "시작일을 입력해 주세요.")
    private String startDate;

    @NotBlank(message = "종료일을 입력해 주세요.")
    private String endDate;

    private List<String> participant;
    private String memo;
    private String place;
}
