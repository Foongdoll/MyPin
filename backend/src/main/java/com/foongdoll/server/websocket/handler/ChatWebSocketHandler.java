package com.foongdoll.server.websocket.handler;

import com.foongdoll.server.websocket.dto.ChatMessage;
import com.foongdoll.server.websocket.service.ChatMessageService;
import com.foongdoll.server.websocket.service.ChatSessionRegistry;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.*;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.Set;

@Slf4j
@Component
@RequiredArgsConstructor
public class ChatWebSocketHandler extends TextWebSocketHandler {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final ChatMessageService chatMessageService;
    private final ChatSessionRegistry chatSessionRegistry;

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        Long userId = (Long) session.getAttributes().get("userId");
        chatSessionRegistry.register(session, userId);
        log.info("WebSocket connected: {} (user={})", session.getId(), userId);
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String payload = message.getPayload();
        ChatMessage msg;
        try {
            msg = objectMapper.readValue(payload, ChatMessage.class);
        } catch (Exception e) {
            log.warn("Invalid message payload: {}", payload, e);
            return;
        }

        if (msg.getType() == null) return;

        switch (msg.getType()) {
            case "ping" -> handlePing(session, msg);
            case "chat.join" -> handleJoin(session, msg);
            case "chat.leave" -> handleLeave(session, msg);
            case "chat.send" -> handleSend(session, msg);
            default -> log.warn("Unknown message type: {}", msg.getType());
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        Set<String> rooms = chatSessionRegistry.unregister(session);
        for (String roomId : rooms) {
            chatMessageService.flushRoom(roomId);
        }
        log.info("WebSocket closed: {} ({})", session.getId(), status);
    }

    private void handlePing(WebSocketSession session, ChatMessage msg) throws IOException {
        msg.setType("pong");
        msg.setTs(System.currentTimeMillis());
        session.sendMessage(new TextMessage(objectMapper.writeValueAsString(msg)));
    }

    private void handleJoin(WebSocketSession session, ChatMessage msg) {
        String roomId = msg.getRoomId();
        if (roomId == null || roomId.isBlank()) return;

        chatSessionRegistry.joinRoom(session, roomId);
        log.info("session {} joined room {}", session.getId(), roomId);
    }

    private void handleLeave(WebSocketSession session, ChatMessage msg) {
        String roomId = msg.getRoomId();
        if (roomId == null || roomId.isBlank()) return;

        chatSessionRegistry.leaveRoom(session, roomId);
        log.info("session {} left room {}", session.getId(), roomId);
    }

    private void handleSend(WebSocketSession session, ChatMessage msg) throws IOException {
        String roomId = msg.getRoomId();
        if (roomId == null || roomId.isBlank()) return;

        msg.setType("chat.message");
        msg.setTs(System.currentTimeMillis());
        msg.setSenderId(String.valueOf(chatSessionRegistry.getUserId(session)));

        chatMessageService.saveToRedis(msg);

        String json = objectMapper.writeValueAsString(msg);
        TextMessage textMessage = new TextMessage(json);
        chatSessionRegistry.broadcastToRoom(roomId, textMessage);
    }
}