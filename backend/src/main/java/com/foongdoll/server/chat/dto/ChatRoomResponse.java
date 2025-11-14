package com.foongdoll.server.chat.dto;

import com.foongdoll.server.chat.domain.ChatRoom;
import com.foongdoll.server.chat.domain.ChatRoomMember;

import java.util.List;

public record ChatRoomResponse(
        String roomKey,
        String name,
        boolean groupRoom,
        boolean muted,
        List<MemberSummary> members
) {
    public static ChatRoomResponse from(ChatRoom room, ChatRoomMember me, List<MemberSummary> members) {
        return new ChatRoomResponse(
                room.getRoomKey(),
                room.getName(),
                room.isGroupRoom(),
                me != null && me.isMuted(),
                members
        );
    }

    public record MemberSummary(Long userId, String name, boolean admin) {
        public static MemberSummary from(ChatRoomMember member) {
            return new MemberSummary(
                    member.getMember().getId(),
                    member.getMember().getName(),
                    member.isAdmin()
            );
        }
    }
}
