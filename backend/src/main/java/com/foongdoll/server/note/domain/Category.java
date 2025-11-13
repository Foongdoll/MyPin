package com.foongdoll.server.note.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "categories",
        indexes = {
                @Index(name = "ix_category_key", columnList = "code", unique = true),
                @Index(name = "ix_category_parent", columnList = "parent_id"),
                @Index(name = "ix_category_path", columnList = "path")
        })
@Getter
@Setter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class Category {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "owner_id", nullable = false, length = 50)
    private String ownerId;

    /** 프론트에서 쓰는 key (예: dev, front1, front-c-1) */
    @Column(name = "code", nullable = false, length = 64, unique = true)
    private String code;

    @Column(nullable = false, length = 100)
    private String label;

    /** 부모 카테고리 (루트면 null) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private Category parent;

    /** 정렬용 */
    @Column(name = "sort_order")
    private Integer sortOrder;

    /** 물질화 경로: /dev/front1/front-c-1  (루트는 /dev 처럼) */
    @Column(nullable = false, length = 512)
    private String path;

    /** 깊이(루트=1) */
    @Column(nullable = false)
    private Integer depth;

    /** path/depth 자동 세팅 */
    @PrePersist
    @PreUpdate
    private void onPersist() {
        if (parent == null) {
            this.path = "/" + code;
            this.depth = 1;
        } else {
            this.path = parent.getPath() + "/" + code;
            this.depth = parent.getDepth() + 1;
        }
        if (sortOrder == null) sortOrder = 0;
    }
}
