package com.foongdoll.server.friend.controller;

import com.foongdoll.server.friend.dto.FriendRequestResponse;
import com.foongdoll.server.friend.dto.FriendSummaryResponse;
import com.foongdoll.server.friend.model.FriendPresenceStatus;
import com.foongdoll.server.friend.service.FriendService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/friends")
@RequiredArgsConstructor
public class FriendController {

    private final FriendService friendService;

    /** 친구 요청 보내기 */
    @PostMapping("/request")
    public ResponseEntity<Void> sendFriendRequest(
            @RequestParam Long fromUserId,
            @RequestParam Long toUserId
    ) {
        friendService.sendFriendRequest(fromUserId, toUserId);
        return ResponseEntity.ok().build();
    }

    /** 친구 요청 취소 (요청한 사람만 가능) */
    @DeleteMapping("/request")
    public ResponseEntity<Void> cancelFriendRequest(
            @RequestParam Long fromUserId,
            @RequestParam Long toUserId
    ) {
        friendService.cancelFriendRequest(fromUserId, toUserId);
        return ResponseEntity.ok().build();
    }

    /** 친구 요청 수락 */
    @PostMapping("/accept")
    public ResponseEntity<Void> acceptFriendRequest(
            @RequestParam Long myUserId,
            @RequestParam Long fromUserId
    ) {
        friendService.acceptFriendRequest(myUserId, fromUserId);
        return ResponseEntity.ok().build();
    }

    /** 친구 요청 거절 */
    @PostMapping("/reject")
    public ResponseEntity<Void> rejectFriendRequest(
            @RequestParam Long myUserId,
            @RequestParam Long fromUserId
    ) {
        friendService.rejectFriendRequest(myUserId, fromUserId);
        return ResponseEntity.ok().build();
    }

    /** 친구 차단 */
    @PostMapping("/block")
    public ResponseEntity<Void> blockUser(
            @RequestParam Long myUserId,
            @RequestParam Long targetUserId
    ) {
        friendService.blockUser(myUserId, targetUserId);
        return ResponseEntity.ok().build();
    }

    /** 차단 해제 */
    @PostMapping("/unblock")
    public ResponseEntity<Void> unblockUser(
            @RequestParam Long myUserId,
            @RequestParam Long targetUserId
    ) {
        friendService.unblockUser(myUserId, targetUserId);
        return ResponseEntity.ok().build();
    }

    /** 친구 목록 조회 */
    @GetMapping
    public ResponseEntity<List<FriendSummaryResponse>> getFriends(
            @RequestParam Long myUserId
    ) {
        return ResponseEntity.ok(friendService.getFriends(myUserId));
    }

    /** 차단한 사용자 목록 조회 */
    @GetMapping("/blocked")
    public ResponseEntity<List<FriendSummaryResponse>> getBlockedFriends(
            @RequestParam Long myUserId
    ) {
        return ResponseEntity.ok(friendService.getBlockedFriends(myUserId));
    }

    /** 받은 친구 요청 목록 조회 */
    @GetMapping("/requests/incoming")
    public ResponseEntity<List<FriendRequestResponse>> getIncomingRequests(@RequestParam Long myUserId) {
        return ResponseEntity.ok(friendService.getIncomingRequests(myUserId));
    }

    /** 보낸 친구 요청 목록 조회 */
    @GetMapping("/requests/outgoing")
    public ResponseEntity<List<FriendRequestResponse>> getOutgoingRequests(@RequestParam Long myUserId) {
        return ResponseEntity.ok(friendService.getOutgoingRequests(myUserId));
    }

    /** 내 상태 메시지(온라인/오프라인/자리비움 등) 변경 */
    @PatchMapping("/presence")
    public ResponseEntity<Void> updatePresence(
            @RequestParam Long myUserId,
            @RequestParam FriendPresenceStatus status
    ) {
        friendService.updatePresencePreference(myUserId, status);
        return ResponseEntity.ok().build();
    }
}
