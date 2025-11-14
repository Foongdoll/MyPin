package com.foongdoll.server.chat.repository;

import com.foongdoll.server.chat.domain.ChatRoom;
import com.foongdoll.server.chat.domain.ChatRoomMember;
import com.foongdoll.server.user.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ChatRoomMemberRepository extends JpaRepository<ChatRoomMember, Long> {

    Optional<ChatRoomMember> findByRoomAndMember(ChatRoom room, User member);

    @Query("""
        SELECT m FROM ChatRoomMember m
        WHERE m.room.roomKey = :roomKey
          AND m.member.id = :memberId
          AND m.active = true
        """)
    Optional<ChatRoomMember> findActiveMember(@Param("roomKey") String roomKey,
                                              @Param("memberId") Long memberId);

    @Query("""
        SELECT m FROM ChatRoomMember m
        WHERE m.room.roomKey = :roomKey
          AND m.active = true
        """)
    List<ChatRoomMember> findActiveMembersByRoomKey(@Param("roomKey") String roomKey);
}
