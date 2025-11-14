package com.foongdoll.server.websocket.repository;

import com.foongdoll.server.websocket.domain.ChatMessageEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChatMessageEntityRepository extends JpaRepository<ChatMessageEntity, Long> {
    List<ChatMessageEntity> findTop100ByRoomIdOrderByTsDesc(String roomId);
}
