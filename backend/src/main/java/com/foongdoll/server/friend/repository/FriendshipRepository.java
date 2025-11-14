package com.foongdoll.server.friend.repository;

import com.foongdoll.server.friend.domain.Friendship;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface FriendshipRepository extends JpaRepository<Friendship, Long> {

    /** 양방향 관계 전체 조회 */
    @Query("""
        SELECT f FROM Friendship f
        WHERE (f.user.id = :userId AND f.friend.id = :friendId)
           OR (f.user.id = :friendId AND f.friend.id = :userId)
        """)
    List<Friendship> findBetweenUsers(@Param("userId") Long userId,
                                      @Param("friendId") Long friendId);

    /** 내가 보낸 친구 요청 (PENDING) 하나 찾기 */
    @Query("""
        SELECT f FROM Friendship f
        WHERE f.user.id = :fromUserId
          AND f.friend.id = :toUserId
          AND f.status = 'PENDING'
        """)
    Optional<Friendship> findPendingRequest(@Param("fromUserId") Long fromUserId,
                                            @Param("toUserId") Long toUserId);

    /** 내게 온 친구 요청 목록 */
    @Query("""
        SELECT f FROM Friendship f
        WHERE f.friend.id = :userId
          AND f.status = 'PENDING'
        """)
    List<Friendship> findIncomingRequests(@Param("userId") Long userId);

    /** 내가 보낸 친구 요청 목록 */
    @Query("""
        SELECT f FROM Friendship f
        WHERE f.user.id = :userId
          AND f.status = 'PENDING'
        """)
    List<Friendship> findOutgoingRequests(@Param("userId") Long userId);

    /** 친구 상태 */
    @Query("""
        SELECT f FROM Friendship f
        WHERE (f.user.id = :userId OR f.friend.id = :userId)
          AND f.status = 'ACCEPTED'
        """)
    List<Friendship> findAcceptedFriends(@Param("userId") Long userId);

    @Query("""
        SELECT f FROM Friendship f
        WHERE (f.user.id = :userId OR f.friend.id = :userId)
          AND f.status = 'BLOCKED'
        """)
    List<Friendship> findBlockedRelations(@Param("userId") Long userId);
}
