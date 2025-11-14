package com.foongdoll.server.chat.dto;

public record ChatLeaveRequest(
        String roomKey,
        Long userId
) {}
