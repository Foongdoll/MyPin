package com.foongdoll.server.friend.dto;

import com.foongdoll.server.friend.domain.Friendship;
import com.foongdoll.server.friend.model.FriendPresenceStatus;
import com.foongdoll.server.friend.model.FriendshipStatus;
import com.foongdoll.server.user.domain.User;

public record FriendSummaryResponse(
        Long friendId,
        String friendName,
        FriendshipStatus relationshipStatus,
        FriendPresenceStatus presenceStatus,
        boolean blocked
) {
    public static FriendSummaryResponse from(Long myUserId,
                                             Friendship friendship,
                                             FriendPresenceStatus presenceStatus) {
        User counterpart = friendship.getUser().getId().equals(myUserId)
                ? friendship.getFriend()
                : friendship.getUser();

        boolean blocked = friendship.getStatus() == FriendshipStatus.BLOCKED
                && friendship.getBlockedBy() != null
                && friendship.getBlockedBy().getId().equals(myUserId);

        return new FriendSummaryResponse(
                counterpart.getId(),
                counterpart.getName(),
                friendship.getStatus(),
                presenceStatus,
                blocked
        );
    }
}
