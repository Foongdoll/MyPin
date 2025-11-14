package com.foongdoll.server.notification.domain;

import com.foongdoll.server.notification.model.ScheduledDispatchStatus;
import com.foongdoll.server.notification.model.ScheduledDispatchType;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "scheduled_dispatch")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScheduledDispatch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ScheduledDispatchType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ScheduledDispatchStatus status;

    /** chat message ¿ë roomKey */
    @Column(name = "room_key", length = 64)
    private String roomKey;

    @Column(name = "sender_id")
    private Long senderId;

    @Column(name = "message", columnDefinition = "TEXT")
    private String message;

    @ElementCollection
    @CollectionTable(name = "scheduled_dispatch_recipients", joinColumns = @JoinColumn(name = "dispatch_id"))
    @Column(name = "recipient")
    @Builder.Default
    private List<String> recipients = new ArrayList<>();

    @Column(name = "email_subject")
    private String emailSubject;

    @Column(name = "email_body", columnDefinition = "TEXT")
    private String emailBody;

    @Column(name = "scheduled_at", nullable = false)
    private Long scheduledAt;

    @Column(name = "executed_at")
    private Long executedAt;

    @Column(name = "created_at", nullable = false)
    private Long createdAt;

    @PrePersist
    public void onCreate() {
        long now = Instant.now().toEpochMilli();
        this.createdAt = now;
        if (this.status == null) {
            this.status = ScheduledDispatchStatus.PENDING;
        }
    }
}
