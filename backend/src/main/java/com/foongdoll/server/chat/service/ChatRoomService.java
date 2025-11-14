package com.foongdoll.server.chat.service;

import com.foongdoll.server.chat.domain.ChatRoom;
import com.foongdoll.server.chat.domain.ChatRoomMember;
import com.foongdoll.server.chat.dto.*;
import com.foongdoll.server.chat.repository.ChatRoomMemberRepository;
import com.foongdoll.server.chat.repository.ChatRoomRepository;
import com.foongdoll.server.friend.model.FriendshipStatus;
import com.foongdoll.server.friend.repository.FriendshipRepository;
import com.foongdoll.server.user.domain.User;
import com.foongdoll.server.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChatRoomService {

    private final ChatRoomRepository chatRoomRepository;
    private final ChatRoomMemberRepository chatRoomMemberRepository;
    private final UserRepository userRepository;
    private final FriendshipRepository friendshipRepository;

    /**
     * 채팅방 생성
     */
    @Transactional
    public ChatRoomResponse createRoom(ChatRoomCreateRequest request) {

        if (request.memberIds() == null || request.memberIds().isEmpty()) {
            throw new IllegalArgumentException("채팅방 멤버가 없습니다.");
        }

        User owner = userRepository.findById(request.ownerId())
                .orElseThrow(() -> new IllegalArgumentException("방 생성자를 찾을 수 없습니다."));

        // 중복 제거 + owner 포함
        LinkedHashSet<Long> allIds = new LinkedHashSet<>(request.memberIds());
        allIds.add(owner.getId());

        List<User> members = userRepository.findAllById(allIds);
        if (members.size() != allIds.size()) {
            throw new IllegalArgumentException("존재하지 않는 사용자가 포함되어 있습니다.");
        }

        // 1:1 채팅일 경우, 친구 관계인지 확인
        if (!request.groupRoom()) {
            if (allIds.size() != 2) {
                throw new IllegalStateException("1:1 채팅방은 멤버가 정확히 2명이어야 합니다.");
            }

            Long friendId = allIds.stream().filter(id -> !id.equals(owner.getId())).findFirst().orElseThrow();
            boolean accepted = friendshipRepository.findBetweenUsers(owner.getId(), friendId)
                    .stream()
                    .anyMatch(f -> f.getStatus() == FriendshipStatus.ACCEPTED);

            if (!accepted) {
                throw new IllegalStateException("친구 관계인 사용자와만 1:1 채팅을 만들 수 있습니다.");
            }
        }

        ChatRoom room = ChatRoom.builder()
                .name(resolveRoomName(request, members, owner))
                .groupRoom(request.groupRoom())
                .directRoom(!request.groupRoom())
                .owner(owner)
                .build();

        // 멤버 등록
        for (User member : members) {
            ChatRoomMember roomMember = ChatRoomMember.builder()
                    .room(room)
                    .member(member)
                    .admin(member.getId().equals(owner.getId()))
                    .build();

            room.getMembers().add(roomMember);
        }

        ChatRoom saved = chatRoomRepository.save(room);
        return mapToResponse(saved, owner.getId());
    }

    /**
     * 내가 속한 채팅방 목록 조회
     */
    @Transactional(readOnly = true)
    public List<ChatRoomResponse> myRooms(Long userId) {
        List<ChatRoom> rooms = chatRoomRepository.findActiveRoomsByMember(userId);
        return rooms.stream()
                .map(room -> mapToResponse(room, userId))
                .collect(Collectors.toList());
    }

    /**
     * 멤버 초대
     */
    @Transactional
    public void inviteMembers(ChatInviteRequest request) {
        ChatRoom room = chatRoomRepository.findByRoomKey(request.roomKey())
                .orElseThrow(() -> new IllegalArgumentException("채팅방을 찾을 수 없습니다."));

        ChatRoomMember requester = chatRoomMemberRepository.findActiveMember(request.roomKey(), request.requesterId())
                .orElseThrow(() -> new IllegalStateException("초대 요청자는 해당 채팅방의 멤버가 아닙니다."));

        if (!room.isGroupRoom()) {
            throw new IllegalStateException("1:1 채팅방에는 초대할 수 없습니다.");
        }

        List<User> invitees = userRepository.findAllById(request.inviteeIds());
        if (invitees.isEmpty()) {
            throw new IllegalArgumentException("초대 대상 사용자가 없습니다.");
        }

        for (User invitee : invitees) {
            boolean alreadyMember = room.getMembers().stream()
                    .anyMatch(member -> member.getMember().getId().equals(invitee.getId()) && member.isActive());

            if (alreadyMember) {
                continue;
            }

            ChatRoomMember newMember = ChatRoomMember.builder()
                    .room(room)
                    .member(invitee)
                    .admin(false)
                    .build();

            room.getMembers().add(newMember);
        }
    }

    /**
     * 채팅방 나가기
     */
    @Transactional
    public void leaveRoom(ChatLeaveRequest request) {
        ChatRoomMember member = chatRoomMemberRepository.findActiveMember(request.roomKey(), request.userId())
                .orElseThrow(() -> new IllegalArgumentException("해당 채팅방의 멤버가 아닙니다."));

        member.setActive(false);
        chatRoomMemberRepository.save(member);
    }

    /**
     * 채팅방 알림 끄기/켜기
     */
    @Transactional
    public void toggleMute(ChatMuteRequest request) {
        ChatRoomMember member = chatRoomMemberRepository.findActiveMember(request.roomKey(), request.userId())
                .orElseThrow(() -> new IllegalArgumentException("해당 채팅방의 멤버가 아닙니다."));

        member.setMuted(request.muted());
        chatRoomMemberRepository.save(member);
    }

    /**
     * 응답 DTO 매핑
     */
    private ChatRoomResponse mapToResponse(ChatRoom room, Long userId) {

        List<ChatRoomResponse.MemberSummary> members = room.getMembers().stream()
                .filter(ChatRoomMember::isActive)
                .map(ChatRoomResponse.MemberSummary::from)
                .toList();

        ChatRoomMember me = room.getMembers().stream()
                .filter(ChatRoomMember::isActive)
                .filter(member -> member.getMember().getId().equals(userId))
                .findFirst()
                .orElse(null);

        return ChatRoomResponse.from(room, me, members);
    }

    /**
     * 채팅방 이름 자동 생성
     */
    private String resolveRoomName(ChatRoomCreateRequest request, List<User> members, User owner) {

        // 사용자 지정 이름이 있으면 그대로 사용
        if (request.name() != null && !request.name().isBlank()) {
            return request.name();
        }

        // 1:1방 -> 상대방 이름으로 세팅
        if (!request.groupRoom()) {
            return members.stream()
                    .filter(user -> !user.getId().equals(owner.getId()))
                    .map(User::getName)
                    .findFirst()
                    .orElse("1:1 채팅");
        }

        // 그룹방 기본 이름
        return owner.getName() + "님의 그룹";
    }
}
