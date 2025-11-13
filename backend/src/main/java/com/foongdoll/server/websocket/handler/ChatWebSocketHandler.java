package com.foongdoll.server.websocket.handler;

import com.foongdoll.server.websocket.dto.ChatMessage;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.foongdoll.server.websocket.service.ChatMessageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.*;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Component
@RequiredArgsConstructor
public class ChatWebSocketHandler extends TextWebSocketHandler {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final ChatMessageService chatMessageService; // 🔹 주입


    /** 세션 → 참가 중인 방 ID 목록 */
    private final Map<WebSocketSession, Set<String>> sessionRooms = new ConcurrentHashMap<>();

    /** roomId → 세션 목록 */
    private final Map<String, Set<WebSocketSession>> roomSessions = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        log.info("WebSocket connected: {}", session.getId());
        sessionRooms.put(session, ConcurrentHashMap.newKeySet());
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
            case "ping"       -> handlePing(session, msg);
            case "chat.join"  -> handleJoin(session, msg);
            case "chat.leave" -> handleLeave(session, msg);
            case "chat.send"  -> handleSend(session, msg); // 🔹 여기서 Redis 저장+브로드캐스트
            default -> log.warn("Unknown message type: {}", msg.getType());
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        log.info("WebSocket closed: {} ({})", session.getId(), status);
        // 세션이 참여했던 모든 방에서 제거
        Set<String> rooms = sessionRooms.remove(session);
        if (rooms != null) {
            for (String roomId : rooms) {
                Set<WebSocketSession> sessions = roomSessions.get(roomId);
                if (sessions != null) {
                    sessions.remove(session);
                    if (sessions.isEmpty()) {
                        roomSessions.remove(roomId);
                    }
                }
            }
        }
    }

    /* ----- handlers ----- */

    private void handlePing(WebSocketSession session, ChatMessage msg) throws IOException {
        // 단순히 pong 내려주거나, 무시해도 됨
        msg.setType("pong");
        msg.setTs(System.currentTimeMillis());
        session.sendMessage(new TextMessage(objectMapper.writeValueAsString(msg)));
    }

    private void handleJoin(WebSocketSession session, ChatMessage msg) {
        String roomId = msg.getRoomId();
        if (roomId == null || roomId.isBlank()) return;

        sessionRooms.computeIfAbsent(session, s -> ConcurrentHashMap.newKeySet())
                .add(roomId);

        roomSessions.computeIfAbsent(roomId, r -> ConcurrentHashMap.newKeySet())
                .add(session);

        log.info("session {} joined room {}", session.getId(), roomId);
    }

    private void handleLeave(WebSocketSession session, ChatMessage msg) {
        String roomId = msg.getRoomId();
        if (roomId == null || roomId.isBlank()) return;

        Set<String> rooms = sessionRooms.get(session);
        if (rooms != null) {
            rooms.remove(roomId);
        }

        Set<WebSocketSession> sessions = roomSessions.get(roomId);
        if (sessions != null) {
            sessions.remove(session);
            if (sessions.isEmpty()) {
                roomSessions.remove(roomId);
            }
        }

        log.info("session {} left room {}", session.getId(), roomId);
    }

    private void handleSend(WebSocketSession session, ChatMessage msg) throws IOException {
        String roomId = msg.getRoomId();
        if (roomId == null || roomId.isBlank()) return;

        msg.setType("chat.message");
        msg.setTs(System.currentTimeMillis());

        // 🔹 Redis에 먼저 저장
        chatMessageService.saveToRedis(msg);

        String json = objectMapper.writeValueAsString(msg);
        TextMessage textMessage = new TextMessage(json);

        Set<WebSocketSession> sessions = roomSessions.getOrDefault(roomId, Collections.emptySet());
        for (WebSocketSession s : sessions) {
            if (s.isOpen()) {
                s.sendMessage(textMessage);
            }
        }
    }
}