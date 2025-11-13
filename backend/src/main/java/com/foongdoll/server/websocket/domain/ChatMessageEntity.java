package com.foongdoll.server.websocket.domain;
import com.foongdoll.server.websocket.dto.ChatRedisMessage;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "chat_message",
        indexes = {
                @Index(name = "ix_chat_room_ts", columnList = "room_id, ts")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessageEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "room_id", nullable = false, length = 100)
    private String roomId;

    @Column(name = "sender_id", nullable = false, length = 100)
    private String senderId;

    @Column(name = "msg_type", nullable = false, length = 50)
    private String type;   // "chat.message" 등

    @Column(name = "content", length = 2000)
    private String content;

    @Column(name = "media_type", length = 20)
    private String mediaType; // IMAGE, VIDEO, AUDIO 등

    @Column(name = "media_url", length = 500)
    private String mediaUrl;

    @Column(name = "ts", nullable = false)
    private Long ts; // epoch milli

    public static ChatMessageEntity fromRedis(ChatRedisMessage msg) {
        return ChatMessageEntity.builder()
                .roomId(msg.getRoomId())
                .senderId(msg.getSenderId())
                .type(msg.getType())
                .content(msg.getContent())
                .mediaType(msg.getMediaType())
                .mediaUrl(msg.getMediaUrl())
                .ts(msg.getTs())
                .build();
    }
}