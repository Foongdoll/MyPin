package com.foongdoll.server.websocket.dto;
import lombok.*;
import java.io.Serializable;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatRedisMessage implements Serializable {
    private String roomId;
    private String senderId;
    private String type;       // "chat.message" 등
    private String content;    // 텍스트 내용 (없으면 null)
    private String mediaType;  // "IMAGE", "VIDEO", "AUDIO", "FILE", null
    private String mediaUrl;   // 파일/이미지 URL
    private long ts;           // epoch milli

    // 필요하면 네 ChatMessage 구조에 맞게 수정
    public static ChatRedisMessage from(ChatMessage msg) {
        return ChatRedisMessage.builder()
                .roomId(msg.getRoomId())
                .senderId(msg.getSenderId())
                .type(msg.getType())
                .content(msg.getContent())
                .mediaType(msg.getMediaType())   // 없으면 제거
                .mediaUrl(msg.getMediaUrl())     // 없으면 제거
                .ts(msg.getTs() != null ? msg.getTs() : System.currentTimeMillis())
                .build();
    }
}
