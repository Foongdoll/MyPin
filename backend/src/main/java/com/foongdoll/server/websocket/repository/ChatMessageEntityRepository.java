package com.foongdoll.server.websocket.repository;
import com.foongdoll.server.websocket.domain.ChatMessageEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ChatMessageEntityRepository extends JpaRepository<ChatMessageEntity, Long> {
    // 필요하면 roomId + 시점으로 조회하는 쿼리 추가
}