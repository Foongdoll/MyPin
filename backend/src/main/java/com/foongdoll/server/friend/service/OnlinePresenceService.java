package com.foongdoll.server.friend.service;

import com.foongdoll.server.friend.model.FriendPresenceStatus;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Collection;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
public class OnlinePresenceService {

    private final Map<Long, PresenceEntry> states = new ConcurrentHashMap<>();

    public void markOnline(Long userId) {
        PresenceEntry entry = states.computeIfAbsent(userId, PresenceEntry::new);
        entry.connections++;
        entry.lastSeen = Instant.now();
        entry.status = entry.manualOverride == FriendPresenceStatus.BUSY
                ? FriendPresenceStatus.BUSY
                : FriendPresenceStatus.ONLINE;
    }

    public void markOffline(Long userId) {
        PresenceEntry entry = states.computeIfAbsent(userId, PresenceEntry::new);
        entry.connections = Math.max(0, entry.connections - 1);
        entry.lastSeen = Instant.now();
        if (entry.connections == 0) {
            entry.status = FriendPresenceStatus.OFFLINE;
        }
    }

    public void forceOffline(Long userId) {
        PresenceEntry entry = states.computeIfAbsent(userId, PresenceEntry::new);
        entry.connections = 0;
        entry.lastSeen = Instant.now();
        entry.status = FriendPresenceStatus.OFFLINE;
    }

    public void setManualStatus(Long userId, FriendPresenceStatus status) {
        PresenceEntry entry = states.computeIfAbsent(userId, PresenceEntry::new);
        entry.lastSeen = Instant.now();
        if (status == FriendPresenceStatus.BUSY) {
            entry.manualOverride = FriendPresenceStatus.BUSY;
            entry.status = FriendPresenceStatus.BUSY;
        } else if (status == FriendPresenceStatus.ONLINE) {
            entry.manualOverride = null;
            entry.status = entry.connections > 0 ? FriendPresenceStatus.ONLINE : FriendPresenceStatus.OFFLINE;
        } else {
            entry.manualOverride = null;
            entry.status = FriendPresenceStatus.OFFLINE;
            entry.connections = 0;
        }
    }

    public FriendPresenceStatus getPresence(Long userId) {
        return states.getOrDefault(userId, PresenceEntry.OFFLINE_ENTRY).status;
    }

    public Map<Long, FriendPresenceStatus> getPresence(Collection<Long> userIds) {
        return userIds.stream().collect(Collectors.toMap(id -> id, this::getPresence));
    }

    public Instant getLastSeen(Long userId) {
        return states.getOrDefault(userId, PresenceEntry.OFFLINE_ENTRY).lastSeen;
    }

    private static final class PresenceEntry {
        static final PresenceEntry OFFLINE_ENTRY = new PresenceEntry(-1L);

        private final Long userId;
        private int connections;
        private FriendPresenceStatus status;
        private FriendPresenceStatus manualOverride;
        private Instant lastSeen;

        PresenceEntry(Long userId) {
            this.userId = userId;
            this.status = FriendPresenceStatus.OFFLINE;
            this.lastSeen = Instant.EPOCH;
        }
    }
}
