package com.foongdoll.server.auth.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class RefreshResponse {
    private final String accessToken;
}
