package com.foongdoll.server.friend.model;

public enum FriendshipStatus {
    PENDING,   // 친구 요청 중 (수락/거절 대기)
    ACCEPTED,  // 친구 상태
    REJECTED,  // 거절 기록(로그용, 실서비스에서는 삭제해도 됨)
    BLOCKED    // 차단
}
