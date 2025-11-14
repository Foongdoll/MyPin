package com.foongdoll.server.friend.dto;

import com.foongdoll.server.friend.domain.Friendship;
import com.foongdoll.server.friend.model.FriendshipStatus;

public record FriendRequestResponse(
        Long requestId,
        Long requesterId,
        String requesterName,
        Long receiverId,
        String receiverName,
        FriendshipStatus status,
        Long createdAt
) {
    public static FriendRequestResponse from(Friendship friendship) {
        return new FriendRequestResponse(
                friendship.getId(),
                friendship.getUser().getId(),
                friendship.getUser().getName(),
                friendship.getFriend().getId(),
                friendship.getFriend().getName(),
                friendship.getStatus(),
                friendship.getCreatedAt()
        );
    }
}
