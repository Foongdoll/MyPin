package com.foongdoll.server.websocket.dto;

import lombok.Data;

@Data
public class ChatMessage {

    private String type;       // "ping", "chat.send", "chat.join", "chat.message"
    private String roomId;
    private String senderId;

    private String content;    // 일반 텍스트 메시지

    private String mediaType;  // IMAGE, VIDEO, AUDIO, FILE 등
    private String mediaUrl;   // 업로드된 파일 경로/URL

    private Long ts;           // timestamp (ms)
}
