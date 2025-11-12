package com.foongdoll.server.user.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, unique = true, length = 64)
    private String userId;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false, length = 50, unique = true)
    private String name;

    @Column(length = 120)
    private String email;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    /** 🔹 역할 연결 (다대일) */
    @ManyToOne(fetch = FetchType.EAGER) // 사용자 한 명이 하나의 Role을 가짐
    @JoinColumn(name = "role_id", nullable = false)
    private Role role;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
