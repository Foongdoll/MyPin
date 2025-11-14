package com.foongdoll.server.friend.service;

import com.foongdoll.server.friend.domain.Friendship;
import com.foongdoll.server.friend.dto.FriendRequestResponse;
import com.foongdoll.server.friend.dto.FriendSummaryResponse;
import com.foongdoll.server.friend.model.FriendPresenceStatus;
import com.foongdoll.server.friend.model.FriendshipStatus;
import com.foongdoll.server.friend.repository.FriendshipRepository;
import com.foongdoll.server.user.domain.User;
import com.foongdoll.server.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FriendService {

    private final UserRepository userRepository;
    private final FriendshipRepository friendshipRepository;
    private final OnlinePresenceService onlinePresenceService;

    /** 친구 요청 */
    @Transactional
    public void sendFriendRequest(Long fromUserId, Long toUserId) {
        if (fromUserId.equals(toUserId)) {
            throw new IllegalArgumentException("본인에게 친구 요청을 보낼 수 없습니다.");
        }

        User from = userRepository.findById(fromUserId)
                .orElseThrow(() -> new IllegalArgumentException("보낸 회원을 찾을 수 없습니다."));
        User to = userRepository.findById(toUserId)
                .orElseThrow(() -> new IllegalArgumentException("대상 회원을 찾을 수 없습니다."));

        List<Friendship> existing = friendshipRepository.findBetweenUsers(fromUserId, toUserId);
        boolean hasActiveRelation = existing.stream()
                .anyMatch(f -> f.getStatus() == FriendshipStatus.PENDING
                        || f.getStatus() == FriendshipStatus.ACCEPTED
                        || f.getStatus() == FriendshipStatus.BLOCKED);

        if (hasActiveRelation) {
            throw new IllegalStateException("이미 친구 상태이거나 요청/차단 상태입니다.");
        }

        Friendship friendship = Friendship.builder()
                .user(from)
                .friend(to)
                .status(FriendshipStatus.PENDING)
                .build();

        friendshipRepository.save(friendship);
    }

    /** 친구 요청 취소 */
    @Transactional
    public void cancelFriendRequest(Long fromUserId, Long toUserId) {
        Friendship request = friendshipRepository.findPendingRequest(fromUserId, toUserId)
                .orElseThrow(() -> new IllegalArgumentException("진행 중인 친구 요청이 없습니다."));

        if (!request.getUser().getId().equals(fromUserId)) {
            throw new IllegalStateException("해당 요청을 취소할 권한이 없습니다.");
        }

        friendshipRepository.delete(request);
    }

    /** 친구 요청 수락 */
    @Transactional
    public void acceptFriendRequest(Long myUserId, Long fromUserId) {
        Friendship request = friendshipRepository.findPendingRequest(fromUserId, myUserId)
                .orElseThrow(() -> new IllegalArgumentException("해당 친구 요청을 찾을 수 없습니다."));

        if (!request.getFriend().getId().equals(myUserId)) {
            throw new IllegalStateException("나에게 온 요청만 수락할 수 있습니다.");
        }

        request.setStatus(FriendshipStatus.ACCEPTED);
        request.setBlockedBy(null);
        friendshipRepository.save(request);
    }

    /** 친구 요청 거절 */
    @Transactional
    public void rejectFriendRequest(Long myUserId, Long fromUserId) {
        Friendship request = friendshipRepository.findPendingRequest(fromUserId, myUserId)
                .orElseThrow(() -> new IllegalArgumentException("해당 친구 요청을 찾을 수 없습니다."));

        if (!request.getFriend().getId().equals(myUserId)) {
            throw new IllegalStateException("나에게 온 요청만 거절할 수 있습니다.");
        }

        request.setStatus(FriendshipStatus.REJECTED);
        friendshipRepository.save(request);
    }

    /** 친구 차단 */
    @Transactional
    public void blockUser(Long myUserId, Long targetUserId) {
        if (myUserId.equals(targetUserId)) {
            throw new IllegalArgumentException("본인을 차단할 수 없습니다.");
        }

        User me = userRepository.findById(myUserId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        User target = userRepository.findById(targetUserId)
                .orElseThrow(() -> new IllegalArgumentException("대상 사용자를 찾을 수 없습니다."));

        List<Friendship> relations = friendshipRepository.findBetweenUsers(myUserId, targetUserId);
        boolean hasAccepted = relations.stream()
                .anyMatch(f -> f.getStatus() == FriendshipStatus.ACCEPTED);
        if (!hasAccepted) {
            throw new IllegalStateException("친구 상태에서만 차단할 수 있습니다.");
        }

        boolean alreadyBlocked = relations.stream()
                .anyMatch(f -> f.getStatus() == FriendshipStatus.BLOCKED
                        && f.getBlockedBy() != null
                        && f.getBlockedBy().getId().equals(myUserId));
        if (alreadyBlocked) {
            return;
        }

        for (Friendship relation : relations) {
            relation.setStatus(FriendshipStatus.BLOCKED);
            relation.setBlockedBy(me);
        }
        friendshipRepository.saveAll(relations);

        // 추가로 block row 생성 (안전용)
        if (relations.isEmpty()) {
            Friendship blockRelation = Friendship.builder()
                    .user(me)
                    .friend(target)
                    .status(FriendshipStatus.BLOCKED)
                    .blockedBy(me)
                    .build();
            friendshipRepository.save(blockRelation);
        }
    }

    @Transactional
    public void unblockUser(Long myUserId, Long targetUserId) {
        List<Friendship> relations = friendshipRepository.findBetweenUsers(myUserId, targetUserId);
        if (relations.isEmpty()) {
            throw new IllegalArgumentException("차단 기록이 없습니다.");
        }

        boolean updated = false;
        for (Friendship relation : relations) {
            if (relation.getStatus() == FriendshipStatus.BLOCKED
                    && relation.getBlockedBy() != null
                    && relation.getBlockedBy().getId().equals(myUserId)) {
                relation.setStatus(FriendshipStatus.ACCEPTED);
                relation.setBlockedBy(null);
                updated = true;
            }
        }

        if (!updated) {
            throw new IllegalStateException("해제할 차단 상태가 없습니다.");
        }
        friendshipRepository.saveAll(relations);
    }

    /** 친구 목록 */
    @Transactional(readOnly = true)
    public List<FriendSummaryResponse> getFriends(Long myUserId) {
        List<Friendship> friends = friendshipRepository.findAcceptedFriends(myUserId);
        Set<Long> friendIds = friends.stream()
                .map(f -> f.getUser().getId().equals(myUserId) ? f.getFriend().getId() : f.getUser().getId())
                .collect(Collectors.toSet());
        Map<Long, FriendPresenceStatus> presences = onlinePresenceService.getPresence(friendIds);

        List<FriendSummaryResponse> responses = new ArrayList<>();
        for (Friendship friendship : friends) {
            Long counterpartId = friendship.getUser().getId().equals(myUserId)
                    ? friendship.getFriend().getId()
                    : friendship.getUser().getId();
            responses.add(FriendSummaryResponse.from(
                    myUserId,
                    friendship,
                    presences.getOrDefault(counterpartId, FriendPresenceStatus.OFFLINE)
            ));
        }
        return responses;
    }

    @Transactional(readOnly = true)
    public List<FriendSummaryResponse> getBlockedFriends(Long myUserId) {
        List<Friendship> blocked = friendshipRepository.findBlockedRelations(myUserId);
        List<FriendSummaryResponse> result = new ArrayList<>();
        for (Friendship friendship : blocked) {
            Long counterpartId = friendship.getUser().getId().equals(myUserId)
                    ? friendship.getFriend().getId()
                    : friendship.getUser().getId();
            result.add(FriendSummaryResponse.from(
                    myUserId,
                    friendship,
                    onlinePresenceService.getPresence(counterpartId)
            ));
        }
        return result;
    }

    @Transactional(readOnly = true)
    public List<FriendRequestResponse> getIncomingRequests(Long myUserId) {
        return friendshipRepository.findIncomingRequests(myUserId)
                .stream()
                .map(FriendRequestResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<FriendRequestResponse> getOutgoingRequests(Long myUserId) {
        return friendshipRepository.findOutgoingRequests(myUserId)
                .stream()
                .map(FriendRequestResponse::from)
                .toList();
    }

    @Transactional
    public void updatePresencePreference(Long myUserId, FriendPresenceStatus status) {
        onlinePresenceService.setManualStatus(myUserId, status);
    }
}
