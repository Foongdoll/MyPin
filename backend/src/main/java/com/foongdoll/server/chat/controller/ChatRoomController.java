package com.foongdoll.server.chat.controller;

import com.foongdoll.server.chat.dto.*;
import com.foongdoll.server.chat.service.ChatRoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/chat/rooms")
@RequiredArgsConstructor
public class ChatRoomController {

    private final ChatRoomService chatRoomService;

    @PostMapping
    public ResponseEntity<ChatRoomResponse> createRoom(@RequestBody ChatRoomCreateRequest request) {
        return ResponseEntity.ok(chatRoomService.createRoom(request));
    }

    @GetMapping
    public ResponseEntity<List<ChatRoomResponse>> myRooms(@RequestParam Long userId) {
        return ResponseEntity.ok(chatRoomService.myRooms(userId));
    }

    @PostMapping("/invite")
    public ResponseEntity<Void> invite(@RequestBody ChatInviteRequest request) {
        chatRoomService.inviteMembers(request);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/leave")
    public ResponseEntity<Void> leave(@RequestBody ChatLeaveRequest request) {
        chatRoomService.leaveRoom(request);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/mute")
    public ResponseEntity<Void> toggleMute(@RequestBody ChatMuteRequest request) {
        chatRoomService.toggleMute(request);
        return ResponseEntity.ok().build();
    }
}
