package com.foongdoll.server.chat.dto;

public record ChatMuteRequest(
        String roomKey,
        Long userId,
        boolean muted
) {}
