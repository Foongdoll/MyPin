package com.foongdoll.server.note.service;

import com.foongdoll.server.note.domain.Category;
import com.foongdoll.server.note.domain.Note;
import com.foongdoll.server.note.domain.NoteSection;
import com.foongdoll.server.note.domain.Tag;
import com.foongdoll.server.note.model.Dtos;
import com.foongdoll.server.note.repository.NoteCategoryRepository;
import com.foongdoll.server.note.repository.NoteRepository;
import com.foongdoll.server.note.repository.TagRepository;
import com.foongdoll.server.security.service.SecurityUtils;
import jakarta.persistence.EntityNotFoundException;
import lombok.*;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * NOTE/CATEGORY 비즈니스 로직
 * - 검색(제목/내용), 카테고리(해당 노드 + 하위) 필터, 페이징(6개), 이전/다음 여부 포함
 * - 카테고리 트리 CRUD (Materialized Path + Adjacency List 조합 가정)
 * - 🔹 멀티 유저: 로그인 사용자(ownerId/author) 기준으로 격리
 */
@Service
@Transactional(readOnly = true)
public class NoteService {

    private static final int DEFAULT_PAGE_SIZE = 6;
    private static final int SNIPPET_MAX_LENGTH = 200;

    private final NoteRepository noteRepository;
    private final NoteCategoryRepository categoryRepository;
    private final TagRepository tagRepository;

    public NoteService(NoteRepository noteRepository,
                       NoteCategoryRepository categoryRepository,
                       TagRepository tagRepository) {
        this.noteRepository = noteRepository;
        this.categoryRepository = categoryRepository;
        this.tagRepository = tagRepository;
    }

    /* ===================== 공통 유틸: 현재 사용자 ===================== */

    private String currentUserId() {
        var principal = SecurityUtils.getAuthenticatedUser();
        if (principal == null) {
            throw new IllegalStateException("인증된 사용자가 없습니다.");
        }
        // userId / username / email 중 실제로 사용하는 값으로 통일
        return principal.getNickname();
    }

    /* ===================== NOTE (내 노트만) ===================== */

    public Dtos.NoteListResponse getNotes(int page, int pageSize,
                                          String q,
                                          String categoryCode,
                                          String categoryPath) {

        String ownerId = currentUserId();

        int safePage = Math.max(page, 1) - 1;                // 0-based
        int safeSize = pageSize > 0 ? pageSize : DEFAULT_PAGE_SIZE;

        // 카테고리 경로 결정: code가 들어오면 code로 Category path 조회 (내 카테고리에서만)
        String pathPrefix = null;
        if (categoryPath != null && !categoryPath.isBlank()) {
            pathPrefix = normalizePathPrefix(categoryPath);
        } else if (categoryCode != null && !categoryCode.isBlank()) {
            Category cat = categoryRepository.findByOwnerIdAndCode(ownerId, categoryCode)
                    .orElseThrow(() -> new EntityNotFoundException("Category not found: " + categoryCode));
            pathPrefix = normalizePathPrefix(cat.getPath());
        }

        Pageable pageable = PageRequest.of(
                safePage,
                safeSize,
                Sort.by(Sort.Direction.DESC, "date", "id")
        );

        Page<Note> pageResult = noteRepository.findAll(
                specFor(q, pathPrefix, ownerId),
                pageable
        );

        List<Dtos.NoteSummary> items = pageResult.getContent().stream()
                .map(NoteService::toSummary)
                .toList();

        return Dtos.NoteListResponse.builder()
                .items(items)
                .page(page)
                .pageSize(safeSize)
                .total((int) pageResult.getTotalElements())
                .hasPrev(pageResult.hasPrevious())
                .hasNext(pageResult.hasNext())
                .build();
    }

    public Dtos.NoteDetailResponse getNote(Long id) {
        String ownerId = currentUserId();

        Note note = noteRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Note not found: " + id));

        // 🔹 내 노트만 접근 가능
        if (!ownerId.equals(note.getAuthor())) {
            throw new EntityNotFoundException("Note not found: " + id);
        }

        return toDetail(note);
    }

    @Transactional
    public Dtos.NoteDetailResponse createNote(Dtos.NoteCreateRequest req) {
        String ownerId = currentUserId();
        Category category = categoryBy(req.getCategoryCode(), req.getCategoryId(), ownerId);

        Note note = Note.builder()
                .title(req.getTitle())
                .snippet(generateSnippet(req.getSnippet(), req.getContent()))
                // 🔹 프론트에서 넘어온 author 무시하고 서버에서 강제 세팅
                .author(ownerId)
                .date(Optional.ofNullable(req.getDate()).orElse(LocalDate.now()))
                .views(Optional.ofNullable(req.getViews()).orElse(0))
                .category(category)
                .content(req.getContent())
                .coverImageUrl(req.getCoverImageUrl())
                .build();

        syncSections(note, req.getSections());
        syncTags(note, req.getTags());

        Note saved = noteRepository.save(note);
        return toDetail(saved);
    }

    @Transactional
    public Dtos.NoteDetailResponse updateNote(Long id, Dtos.NoteUpdateRequest req) {
        String ownerId = currentUserId();

        Note note = noteRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Note not found: " + id));

        // 🔹 소유자 검증
        if (!ownerId.equals(note.getAuthor())) {
            throw new EntityNotFoundException("Note not found: " + id);
        }

        if (req.getTitle() != null) note.setTitle(req.getTitle());
        // 🔹 author는 변경 불가 (보안상)
        if (req.getDate() != null) note.setDate(req.getDate());
        if (req.getViews() != null) note.setViews(req.getViews());
        if (req.getCoverImageUrl() != null) note.setCoverImageUrl(req.getCoverImageUrl());
        if (req.getContent() != null) note.setContent(req.getContent());

        if (req.getCategoryId() != null || StringUtils.hasText(req.getCategoryCode())) {
            Category category = categoryBy(req.getCategoryCode(), req.getCategoryId(), ownerId);
            note.setCategory(category);
        }

        if (req.getSnippet() != null || req.getContent() != null) {
            String contentSource = req.getContent() != null ? req.getContent() : note.getContent();
            note.setSnippet(generateSnippet(req.getSnippet(), contentSource));
        }

        if (req.getSections() != null) {
            syncSections(note, req.getSections());
        }

        if (req.getTags() != null) {
            syncTags(note, req.getTags());
        }

        return toDetail(note);
    }

    @Transactional
    public void deleteNote(Long id) {
        String ownerId = currentUserId();

        Note note = noteRepository.findById(id)
                .orElse(null);
        if (note == null) return;

        if (!ownerId.equals(note.getAuthor())) {
            // 남의 노트는 없는 것처럼 처리
            throw new EntityNotFoundException("Note not found: " + id);
        }

        noteRepository.delete(note);
    }

    /* ===================== CATEGORY (내 카테고리만) ===================== */

    public List<Dtos.CategoryNode> getCategoryTree() {
        String ownerId = currentUserId();

        List<Category> all = categoryRepository
                .findAllByOwnerIdOrderByDepthAscSortOrderAscIdAsc(ownerId);

        return buildTree(all);
    }

    public Dtos.CategoryNode getCategoryNode(Long id) {
        String ownerId = currentUserId();

        Category c = categoryRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Category not found: " + id));

        if (!ownerId.equals(c.getOwnerId())) {
            throw new EntityNotFoundException("Category not found: " + id);
        }

        return toNode(c);
    }

    @Transactional
    public Dtos.CategoryNode createCategory(Dtos.CategoryCreateRequest req) {
        String ownerId = currentUserId();

        Category parent = null;
        if (req.getParentId() != null) {
            parent = categoryRepository.findById(req.getParentId())
                    .orElseThrow(() -> new EntityNotFoundException("Parent not found: " + req.getParentId()));

            if (!ownerId.equals(parent.getOwnerId())) {
                throw new IllegalStateException("다른 사용자의 카테고리를 부모로 지정할 수 없습니다.");
            }
        }

        Category c = Category.builder()
                .ownerId(ownerId) // 🔹 소유자 세팅
                .code(req.getCode())
                .label(req.getLabel())
                .parent(parent)
                .sortOrder(Optional.ofNullable(req.getSortOrder()).orElse(0))
                .build();

        Category saved = categoryRepository.save(c);
        // path/depth는 @PrePersist에서 자동 계산된다고 가정
        return toNode(saved);
    }

    @Transactional
    public Dtos.CategoryNode updateCategory(Long id, Dtos.CategoryUpdateRequest req) {
        String ownerId = currentUserId();

        Category c = categoryRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Category not found: " + id));

        if (!ownerId.equals(c.getOwnerId())) {
            throw new EntityNotFoundException("Category not found: " + id);
        }

        if (req.getLabel() != null) c.setLabel(req.getLabel());
        if (req.getCode() != null) c.setCode(req.getCode());
        if (req.getSortOrder() != null) c.setSortOrder(req.getSortOrder());

        if (req.getParentId() != null) {
            Category parent = categoryRepository.findById(req.getParentId())
                    .orElseThrow(() -> new EntityNotFoundException("Parent not found: " + req.getParentId()));
            if (!ownerId.equals(parent.getOwnerId())) {
                throw new IllegalStateException("다른 사용자의 카테고리를 부모로 지정할 수 없습니다.");
            }
            c.setParent(parent); // path/depth는 @PreUpdate에서 재계산
        } else if (Boolean.TRUE.equals(req.getDetachParent())) {
            c.setParent(null);
        }

        return toNode(c);
    }

    @Transactional
    public void deleteCategory(Long id) {
        String ownerId = currentUserId();

        Category c = categoryRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Category not found: " + id));

        if (!ownerId.equals(c.getOwnerId())) {
            throw new EntityNotFoundException("Category not found: " + id);
        }

        // 전략: 하위가 있거나 Note가 참조 중이면 예외 처리/제약
        boolean hasChildren = categoryRepository.existsByOwnerIdAndParentId(ownerId, id);
        if (hasChildren) {
            throw new IllegalStateException("하위 카테고리가 존재합니다. 먼저 하위를 정리하세요.");
        }
        boolean inUse = noteRepository.existsByCategoryId(id);
        if (inUse) {
            throw new IllegalStateException("해당 카테고리를 참조하는 노트가 있습니다.");
        }
        categoryRepository.delete(c);
    }

    /* ===================== 내부 유틸/스펙/매핑 ===================== */

    private static String normalizePathPrefix(String path) {
        if (path == null || path.isBlank()) return null;
        String p = path.trim();
        if (!p.startsWith("/")) p = "/" + p;
        return p;
    }

    /** 🔹 검색 + 카테고리 + 로그인 사용자(author) 필터 */
    private Specification<Note> specFor(String q, String pathPrefix, String ownerId) {
        return (root, query, cb) -> {
            List<jakarta.persistence.criteria.Predicate> preds = new ArrayList<>();

            if (q != null && !q.isBlank()) {
                String like = "%" + q.toLowerCase() + "%";
                var title = cb.like(cb.lower(root.get("title")), like);
                var content = cb.like(cb.lower(root.get("content")), like);
                var snippet = cb.like(cb.lower(root.get("snippet")), like);
                preds.add(cb.or(title, snippet, content));
            }

            // 🔹 작성자 = 현재 사용자
            preds.add(cb.equal(root.get("author"), ownerId));

            if (pathPrefix != null) {
                // denorm 캐시를 우선 사용
                preds.add(cb.like(root.get("categoryPath"), pathPrefix + "%"));
            }

            return preds.isEmpty()
                    ? cb.conjunction()
                    : cb.and(preds.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };
    }

    private static Dtos.NoteSummary toSummary(Note n) {
        return Dtos.NoteSummary.builder()
                .id(n.getId())
                .title(n.getTitle())
                .snippet(n.getSnippet())
                .coverImageUrl(n.getCoverImageUrl())
                .categoryTop(n.getCategoryTop())
                .categorySub(n.getCategorySub())
                .date(n.getDate())
                .views(n.getViews())
                .author(n.getAuthor())
                .build();
    }

    private static Dtos.NoteDetailResponse toDetail(Note n) {
        List<String> tagNames = n.getTags() == null ? List.of()
                : n.getTags().stream().map(Tag::getName).toList();
        List<Dtos.NoteSectionBlock> sections = n.getSections() == null ? List.of()
                : n.getSections().stream()
                .map(section -> Dtos.NoteSectionBlock.builder()
                        .title(section.getTitle())
                        .imageUrl(section.getImageUrl())
                        .description(section.getDescription())
                        .sortOrder(section.getSortOrder())
                        .build())
                .toList();

        return Dtos.NoteDetailResponse.builder()
                .id(n.getId())
                .title(n.getTitle())
                .snippet(n.getSnippet())
                .content(n.getContent())
                .author(n.getAuthor())
                .date(n.getDate())
                .views(n.getViews())
                .coverImageUrl(n.getCoverImageUrl())
                .categoryId(n.getCategory().getId())
                .categoryCode(n.getCategory().getCode())
                .categoryPath(n.getCategoryPath())
                .categoryTop(n.getCategoryTop())
                .categorySub(n.getCategorySub())
                .tags(tagNames)
                .sections(sections)
                .build();
    }

    /** 🔹 현재 사용자(ownerId) 기준으로 카테고리 찾기 */
    private Category categoryBy(String code, Long id, String ownerId) {
        if (id != null) {
            Category c = categoryRepository.findById(id)
                    .orElseThrow(() -> new EntityNotFoundException("Category not found: " + id));
            if (!ownerId.equals(c.getOwnerId())) {
                throw new EntityNotFoundException("Category not found: " + id);
            }
            return c;
        }
        if (code != null && !code.isBlank()) {
            return categoryRepository.findByOwnerIdAndCode(ownerId, code)
                    .orElseThrow(() -> new EntityNotFoundException("Category not found: " + code));
        }
        throw new IllegalArgumentException("카테고리 식별자(categoryId 또는 categoryCode)가 필요합니다.");
    }

    private void syncSections(Note note, List<Dtos.NoteSectionBlock> blocks) {
        note.getSections().clear();
        if (blocks == null || blocks.isEmpty()) {
            return;
        }
        int index = 0;
        for (Dtos.NoteSectionBlock block : blocks) {
            if (block == null) continue;
            NoteSection section = NoteSection.builder()
                    .title(block.getTitle())
                    .imageUrl(block.getImageUrl())
                    .description(block.getDescription())
                    .sortOrder(block.getSortOrder() != null ? block.getSortOrder() : index)
                    .build();
            note.getSections().add(section);
            index++;
        }
    }

    private void syncTags(Note note, List<String> tagNames) {
        note.getTags().clear();
        if (tagNames == null || tagNames.isEmpty()) {
            return;
        }
        List<String> sanitized = sanitizeTagNames(tagNames);
        if (sanitized.isEmpty()) {
            return;
        }
        Map<String, Tag> existing = tagRepository.findByNameIn(sanitized).stream()
                .collect(Collectors.toMap(t -> t.getName().toLowerCase(), Function.identity(), (a, b) -> a));
        for (String name : sanitized) {
            Tag tag = existing.get(name.toLowerCase());
            if (tag == null) {
                tag = Tag.builder().name(name).build();
            }
            note.getTags().add(tag);
        }
    }

    private static List<String> sanitizeTagNames(List<String> tagNames) {
        return tagNames.stream()
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(StringUtils::hasText)
                .map(name -> name.length() > 50 ? name.substring(0, 50) : name)
                .distinct()
                .toList();
    }

    private static String generateSnippet(String preferredSnippet, String content) {
        if (StringUtils.hasText(preferredSnippet)) {
            return truncateSnippet(preferredSnippet);
        }
        if (!StringUtils.hasText(content)) {
            return null;
        }
        String plain = stripMarkdown(content);
        if (!StringUtils.hasText(plain)) {
            return null;
        }
        return truncateSnippet(plain);
    }

    private static String truncateSnippet(String value) {
        String normalized = value.replaceAll("\\s+", " ").trim();
        if (normalized.length() <= SNIPPET_MAX_LENGTH) {
            return normalized;
        }
        return normalized.substring(0, SNIPPET_MAX_LENGTH).trim() + "...";
    }

    private static String stripMarkdown(String source) {
        String noCodeBlock = source.replaceAll("(?s)```.*?```", " ");
        String noInlineCode = noCodeBlock.replaceAll("`[^`]*`", " ");
        String noImage = noInlineCode.replaceAll("!\\[[^\\]]*\\]\\([^)]*\\)", " ");
        String noLink = noImage.replaceAll("\\[[^\\]]*\\]\\([^)]*\\)", " ");
        String noMarkup = noLink.replaceAll("[#>*_`~]", " ");
        return noMarkup.replaceAll("\\s+", " ").trim();
    }

    private static List<Dtos.CategoryNode> buildTree(List<Category> all) {
        Map<Long, Dtos.CategoryNode> byId = new LinkedHashMap<>();
        for (Category c : all) {
            byId.put(c.getId(), toNode(c));
        }
        List<Dtos.CategoryNode> roots = new ArrayList<>();
        for (Category c : all) {
            Dtos.CategoryNode node = byId.get(c.getId());
            if (c.getParent() == null) {
                roots.add(node);
            } else {
                Dtos.CategoryNode parent = byId.get(c.getParent().getId());
                if (parent != null) parent.getChildren().add(node);
            }
        }
        // 자식 정렬
        roots.forEach(NoteService::sortRec);
        return roots;
    }

    private static void sortRec(Dtos.CategoryNode n) {
        n.getChildren().sort(
                Comparator.comparing(Dtos.CategoryNode::getSortOrder)
                        .thenComparing(Dtos.CategoryNode::getId)
        );
        n.getChildren().forEach(NoteService::sortRec);
    }

    private static Dtos.CategoryNode toNode(Category c) {
        return Dtos.CategoryNode.builder()
                .id(c.getId())
                .code(c.getCode())
                .label(c.getLabel())
                .path(c.getPath())
                .depth(c.getDepth())
                .sortOrder(Optional.ofNullable(c.getSortOrder()).orElse(0))
                .parentId(c.getParent() == null ? null : c.getParent().getId())
                .children(new ArrayList<>())
                .build();
    }

}
