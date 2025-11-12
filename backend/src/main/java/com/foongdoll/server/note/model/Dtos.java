package com.foongdoll.server.note.model;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class Dtos {
    @Getter @Setter @Builder
    public static class NoteListResponse {
        private List<NoteSummary> items;
        private int page;      // 1-based
        private int pageSize;
        private int total;
        private boolean hasPrev;
        private boolean hasNext;
    }

    @Getter @Setter @Builder
    public static class NoteSummary {
        private Long id;
        private String title;
        private String snippet;
        private String coverImageUrl;
        private String categoryTop;
        private String categorySub;
        private LocalDate date;
        private int views;
        private String author;
    }

    @Getter @Setter @Builder
    public static class NoteDetailResponse {
        private Long id;
        private String title;
        private String snippet;
        private String content;
        private String author;
        private LocalDate date;
        private int views;
        private String coverImageUrl;
        private Long categoryId;
        private String categoryCode;
        private String categoryPath;
        private String categoryTop;
        private String categorySub;
        @Builder.Default
        private List<String> tags = new ArrayList<>();
        @Builder.Default
        private List<NoteSectionBlock> sections = new ArrayList<>();
    }

    @Getter @Setter
    public static class NoteCreateRequest {
        private String title;
        private String snippet;
        private String content;
        private String coverImageUrl;
        private String author;
        private LocalDate date;
        private Integer views;
        private Long categoryId;
        private String categoryCode;
        private List<String> tags;
        private List<NoteSectionBlock> sections;
    }

    @Getter @Setter
    public static class NoteUpdateRequest {
        private String title;
        private String snippet;
        private String content;
        private String coverImageUrl;
        private String author;
        private LocalDate date;
        private Integer views;
        private Long categoryId;
        private String categoryCode;
        private List<String> tags;
        private List<NoteSectionBlock> sections;
    }

    @Getter @Setter @Builder
    public static class NoteSectionBlock {
        private String title;
        private String imageUrl;
        private String description;
        private Integer sortOrder;
    }

    @Getter @Setter
    @Builder
    public static class CategoryNode {
        private Long id;
        private String code;
        private String label;
        private String path;
        private Integer depth;
        private Integer sortOrder;
        private Long parentId;
        @Builder.Default
        private List<CategoryNode> children = new ArrayList<>();
    }

    @Getter @Setter
    public static class CategoryCreateRequest {
        private String code;
        private String label;
        private Integer sortOrder;
        private Long parentId; // null이면 루트
    }

    @Getter
    @Setter
    public static class CategoryUpdateRequest {
        private String code;
        private String label;
        private Integer sortOrder;
        private Long parentId;     // 이동
        private Boolean detachParent; // true면 부모 제거(루트로)
    }

    @Getter
    @Setter
    @Builder
    public static class AssetUploadResponse {
        private String url;
        private String filename;
        private long size;
        private String contentType;
    }
}
