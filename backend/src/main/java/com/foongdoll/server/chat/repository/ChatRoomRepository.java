package com.foongdoll.server.chat.repository;

import com.foongdoll.server.chat.domain.ChatRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ChatRoomRepository extends JpaRepository<ChatRoom, Long> {
    Optional<ChatRoom> findByRoomKey(String roomKey);

    @Query("""
        SELECT DISTINCT r FROM ChatRoom r
        JOIN r.members m
        WHERE m.member.id = :memberId
          AND m.active = true
        """)
    List<ChatRoom> findActiveRoomsByMember(@Param("memberId") Long memberId);
}
