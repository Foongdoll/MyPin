package com.foongdoll.server.notification.dto;

import com.foongdoll.server.notification.domain.ScheduledDispatch;
import com.foongdoll.server.notification.model.ScheduledDispatchStatus;
import com.foongdoll.server.notification.model.ScheduledDispatchType;

import java.util.List;

public record ScheduledDispatchResponse(
        Long id,
        ScheduledDispatchType type,
        ScheduledDispatchStatus status,
        String roomKey,
        Long senderId,
        String message,
        List<String> recipients,
        String emailSubject,
        String emailBody,
        Long scheduledAt,
        Long executedAt
) {
    public static ScheduledDispatchResponse from(ScheduledDispatch dispatch) {
        return new ScheduledDispatchResponse(
                dispatch.getId(),
                dispatch.getType(),
                dispatch.getStatus(),
                dispatch.getRoomKey(),
                dispatch.getSenderId(),
                dispatch.getMessage(),
                dispatch.getRecipients(),
                dispatch.getEmailSubject(),
                dispatch.getEmailBody(),
                dispatch.getScheduledAt(),
                dispatch.getExecutedAt()
        );
    }
}
