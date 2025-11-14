package com.foongdoll.server.chat.domain;

import com.foongdoll.server.user.domain.User;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "chat_room_members")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatRoomMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    private ChatRoom room;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private User member;

    @Column(name = "is_admin")
    private boolean admin;

    @Builder.Default
    @Column(name = "is_active")
    private boolean active = true;

    @Builder.Default
    @Column(name = "is_muted")
    private boolean muted = false;

    @Column(name = "joined_at", nullable = false)
    private Long joinedAt;

    @PrePersist
    public void onCreate() {
        this.joinedAt = System.currentTimeMillis();
    }
}
