package com.foongdoll.server.schedule.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ScheduleCommentRequest {

    @NotBlank(message = "작성자를 입력해 주세요.")
    @Size(max = 80, message = "작성자 이름은 80자 이하여야 합니다.")
    private String author;

    @NotBlank(message = "댓글 내용을 입력해 주세요.")
    private String content;
}
