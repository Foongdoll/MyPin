package com.foongdoll.server.chat.controller;

import com.foongdoll.server.websocket.dto.ChatRedisMessage;
import com.foongdoll.server.websocket.service.ChatMessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/chat/messages")
@RequiredArgsConstructor
public class ChatHistoryController {

    private final ChatMessageService chatMessageService;

    @GetMapping
    public ResponseEntity<List<ChatRedisMessage>> recent(@RequestParam String roomKey,
                                                         @RequestParam(defaultValue = "50") int limit) {
        return ResponseEntity.ok(chatMessageService.loadRecentMessages(roomKey, limit));
    }
}
