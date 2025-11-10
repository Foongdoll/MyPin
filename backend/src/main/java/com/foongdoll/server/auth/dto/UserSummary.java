package com.foongdoll.server.auth.dto;

import com.foongdoll.server.user.domain.User;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class UserSummary {
    private final Long uuid;
    private final String name;

    public static UserSummary from(User user) {
        return UserSummary.builder()
                .uuid(user.getId())
                .name(user.getName())
                .build();
    }
}
