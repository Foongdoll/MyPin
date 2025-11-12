package com.foongdoll.server.note.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "notes",
        indexes = {
                @Index(name = "ix_note_category", columnList = "category_id"),
                @Index(name = "ix_note_date", columnList = "written_date"),
                @Index(name = "ix_note_author", columnList = "author")
        })
@Getter
@Setter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class Note {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(length = 500)
    private String snippet;

    @Lob
    @Column(name = "content", columnDefinition = "LONGTEXT")
    private String content;

    @Column(name = "cover_image_url", length = 512)
    private String coverImageUrl;

    @Column(name = "written_date", nullable = false)
    private LocalDate date;

    @Column(nullable = false)
    private int views;

    @Column(nullable = false, length = 50)
    private String author; // 전역 유니크 name 정책이면 name 저장

    /** 노트가 속한 '리프' 카테고리 */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "category_id")
    private Category category;

    /** 조회 최적화를 위한 카테고리 경로 캐시 (denormalized) */
    @Column(name = "category_path", nullable = false, length = 512)
    private String categoryPath;

    /** 상위/하위 카테고리명 빠른 표기를 위한 캐시(선택) */
    @Column(name = "category_top", length = 50)
    private String categoryTop;

    @Column(name = "category_sub", length = 50)
    private String categorySub;

    @ManyToMany(fetch = FetchType.LAZY, cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    @JoinTable(
            name = "note_tags",
            joinColumns = @JoinColumn(name = "note_id"),
            inverseJoinColumns = @JoinColumn(name = "tag_id")
    )
    @Builder.Default
    private Set<Tag> tags = new HashSet<>();

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "note_sections", joinColumns = @JoinColumn(name = "note_id"))
    @OrderBy("sortOrder ASC")
    @Builder.Default
    private List<NoteSection> sections = new ArrayList<>();

    @PrePersist @PreUpdate
    private void syncCategoryFields() {
        if (category != null) {
            this.categoryPath = category.getPath(); // 예: /dev/front1/front-c-1
            // 필요시 path split해서 top/sub 캐시
            String[] parts = categoryPath.split("/");
            // parts[0]은 빈 문자열, 루트=parts[1], 그 다음=parts[2]...
            if (parts.length >= 2) this.categoryTop = parts[1];
            if (parts.length >= 3) this.categorySub = parts[2];
        }
    }
}
