package com.foongdoll.server.chat.dto;

import java.util.List;

public record ChatRoomCreateRequest(
        Long ownerId,
        String name,
        boolean groupRoom,
        List<Long> memberIds
) {}
