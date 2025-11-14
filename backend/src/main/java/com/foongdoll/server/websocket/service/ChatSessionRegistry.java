package com.foongdoll.server.websocket.service;

import com.foongdoll.server.friend.service.OnlinePresenceService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

import java.io.IOException;
import java.util.Collections;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Component
@RequiredArgsConstructor
public class ChatSessionRegistry {

    private final OnlinePresenceService onlinePresenceService;

    private final Map<WebSocketSession, SessionInfo> sessionInfo = new ConcurrentHashMap<>();
    private final Map<String, Set<WebSocketSession>> roomSessions = new ConcurrentHashMap<>();

    public void register(WebSocketSession session, Long userId) {
        sessionInfo.put(session, new SessionInfo(userId));
        if (userId != null) {
            onlinePresenceService.markOnline(userId);
        }
    }

    public Set<String> unregister(WebSocketSession session) {
        SessionInfo info = sessionInfo.remove(session);
        if (info == null) {
            return Collections.emptySet();
        }

        if (info.userId != null) {
            onlinePresenceService.markOffline(info.userId);
        }

        Set<String> roomsSnapshot = new HashSet<>(info.rooms);

        for (String roomId : roomsSnapshot) {
            Set<WebSocketSession> sessions = roomSessions.get(roomId);
            if (sessions != null) {
                sessions.remove(session);
                if (sessions.isEmpty()) {
                    roomSessions.remove(roomId);
                }
            }
        }

        return roomsSnapshot;
    }

    public void joinRoom(WebSocketSession session, String roomId) {
        roomSessions.computeIfAbsent(roomId, key -> ConcurrentHashMap.newKeySet())
                .add(session);
        sessionInfo.computeIfAbsent(session, key -> new SessionInfo(null))
                .rooms.add(roomId);
    }

    public void leaveRoom(WebSocketSession session, String roomId) {
        SessionInfo info = sessionInfo.get(session);
        if (info != null) {
            info.rooms.remove(roomId);
        }

        Set<WebSocketSession> sessions = roomSessions.get(roomId);
        if (sessions != null) {
            sessions.remove(session);
            if (sessions.isEmpty()) {
                roomSessions.remove(roomId);
            }
        }
    }

    public void broadcastToRoom(String roomId, TextMessage message) {
        Set<WebSocketSession> sessions = roomSessions.getOrDefault(roomId, Collections.emptySet());
        for (WebSocketSession session : sessions) {
            if (session.isOpen()) {
                try {
                    session.sendMessage(message);
                } catch (IOException ignored) {
                    // 세션 오류는 무시하고 다음으로 진행
                }
            }
        }
    }

    public Long getUserId(WebSocketSession session) {
        SessionInfo info = sessionInfo.get(session);
        return info != null ? info.userId : null;
    }

    private static final class SessionInfo {
        private final Long userId;
        private final Set<String> rooms = ConcurrentHashMap.newKeySet();

        private SessionInfo(Long userId) {
            this.userId = userId;
        }
    }
}