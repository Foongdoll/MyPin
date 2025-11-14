package com.foongdoll.server.websocket.dto;
import com.foongdoll.server.websocket.domain.ChatMessageEntity;
import lombok.*;
import java.io.Serializable;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatRedisMessage implements Serializable {
    private String roomId;
    private String senderId;
    private String type;
    private String content;
    private String mediaType;
    private String mediaUrl;
    private long ts;

    public static ChatRedisMessage from(ChatMessage msg) {
        return ChatRedisMessage.builder()
                .roomId(msg.getRoomId())
                .senderId(msg.getSenderId())
                .type(msg.getType())
                .content(msg.getContent())
                .mediaType(msg.getMediaType())
                .mediaUrl(msg.getMediaUrl())
                .ts(msg.getTs() != null ? msg.getTs() : System.currentTimeMillis())
                .build();
    }

    public static ChatRedisMessage fromEntity(ChatMessageEntity entity) {
        return ChatRedisMessage.builder()
                .roomId(entity.getRoomId())
                .senderId(entity.getSenderId())
                .type(entity.getType())
                .content(entity.getContent())
                .mediaType(entity.getMediaType())
                .mediaUrl(entity.getMediaUrl())
                .ts(entity.getTs())
                .build();
    }
}
