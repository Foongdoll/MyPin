package com.foongdoll.server.notification.dto;

import com.foongdoll.server.notification.model.ScheduledDispatchType;

import java.util.List;

public record ScheduledDispatchRequest(
        ScheduledDispatchType type,
        String roomKey,
        Long senderId,
        String message,
        List<String> recipients,
        String emailSubject,
        String emailBody,
        Long scheduledAt
) {}
