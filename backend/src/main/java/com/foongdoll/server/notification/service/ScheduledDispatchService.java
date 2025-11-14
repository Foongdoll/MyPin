package com.foongdoll.server.notification.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.foongdoll.server.notification.domain.ScheduledDispatch;
import com.foongdoll.server.notification.dto.ScheduledDispatchRequest;
import com.foongdoll.server.notification.dto.ScheduledDispatchResponse;
import com.foongdoll.server.notification.model.ScheduledDispatchStatus;
import com.foongdoll.server.notification.model.ScheduledDispatchType;
import com.foongdoll.server.notification.repository.ScheduledDispatchRepository;
import com.foongdoll.server.websocket.dto.ChatMessage;
import com.foongdoll.server.websocket.service.ChatMessageService;
import com.foongdoll.server.websocket.service.ChatSessionRegistry;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.socket.TextMessage;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ScheduledDispatchService {

    private final ScheduledDispatchRepository scheduledDispatchRepository;
    private final ChatMessageService chatMessageService;
    private final ChatSessionRegistry chatSessionRegistry;
    private final ObjectProvider<JavaMailSender> mailSenderProvider;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Transactional
    public ScheduledDispatchResponse schedule(ScheduledDispatchRequest request) {
        if (request.scheduledAt() == null) {
            throw new IllegalArgumentException("scheduledAt is required");
        }
        ScheduledDispatch dispatch = ScheduledDispatch.builder()
                .type(request.type())
                .roomKey(request.roomKey())
                .senderId(request.senderId())
                .message(request.message())
                .recipients(request.recipients() == null ? List.of() : request.recipients())
                .emailSubject(request.emailSubject())
                .emailBody(request.emailBody())
                .scheduledAt(request.scheduledAt())
                .status(ScheduledDispatchStatus.PENDING)
                .build();
        return ScheduledDispatchResponse.from(scheduledDispatchRepository.save(dispatch));
    }

    @Transactional
    public void cancel(Long dispatchId) {
        ScheduledDispatch dispatch = scheduledDispatchRepository.findById(dispatchId)
                .orElseThrow(() -> new IllegalArgumentException("dispatch not found"));
        dispatch.setStatus(ScheduledDispatchStatus.CANCELLED);
    }

    @Transactional(readOnly = true)
    public List<ScheduledDispatchResponse> upcoming() {
        return scheduledDispatchRepository.findAll().stream()
                .map(ScheduledDispatchResponse::from)
                .toList();
    }

    @Scheduled(fixedDelay = 15000)
    @Transactional
    public void processDueDispatches() {
        long now = Instant.now().toEpochMilli();
        List<ScheduledDispatch> due = scheduledDispatchRepository.findDueDispatches(now);
        for (ScheduledDispatch dispatch : due) {
            try {
                if (dispatch.getType() == ScheduledDispatchType.CHAT_MESSAGE) {
                    handleChatDispatch(dispatch);
                } else {
                    handleEmailDispatch(dispatch);
                }
                dispatch.setStatus(ScheduledDispatchStatus.SENT);
                dispatch.setExecutedAt(System.currentTimeMillis());
            } catch (Exception e) {
                log.error("Failed to process dispatch {}", dispatch.getId(), e);
            }
        }
    }

    private void handleChatDispatch(ScheduledDispatch dispatch) throws Exception {
        if (dispatch.getRoomKey() == null) {
            throw new IllegalStateException("roomKey is required");
        }

        ChatMessage msg = new ChatMessage();
        msg.setType("chat.message");
        msg.setRoomId(dispatch.getRoomKey());
        msg.setSenderId(dispatch.getSenderId() == null ? "system" : dispatch.getSenderId().toString());
        msg.setContent(dispatch.getMessage());
        msg.setTs(System.currentTimeMillis());

        chatMessageService.saveToRedis(msg);
        TextMessage textMessage = new TextMessage(objectMapper.writeValueAsString(msg));
        chatSessionRegistry.broadcastToRoom(dispatch.getRoomKey(), textMessage);
    }

    private void handleEmailDispatch(ScheduledDispatch dispatch) {
        JavaMailSender sender = mailSenderProvider.getIfAvailable();
        if (sender == null) {
            log.warn("Mail sender is not configured; skipping email dispatch {}", dispatch.getId());
            return;
        }

        if (dispatch.getRecipients() == null || dispatch.getRecipients().isEmpty()) {
            log.warn("Email dispatch {} has no recipients", dispatch.getId());
            return;
        }

        for (String recipient : dispatch.getRecipients()) {
            try {
                MimeMessage mimeMessage = sender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, false, StandardCharsets.UTF_8.name());
                helper.setTo(recipient);
                helper.setSubject(dispatch.getEmailSubject());
                helper.setText(dispatch.getEmailBody(), false);
                sender.send(mimeMessage);
            } catch (Exception e) {
                log.error("Failed to send scheduled mail {} to {}", dispatch.getId(), recipient, e);
            }
        }
    }
}