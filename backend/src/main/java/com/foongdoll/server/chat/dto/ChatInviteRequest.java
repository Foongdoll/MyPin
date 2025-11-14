package com.foongdoll.server.chat.dto;

import java.util.List;

public record ChatInviteRequest(
        String roomKey,
        Long requesterId,
        List<Long> inviteeIds
) {}
