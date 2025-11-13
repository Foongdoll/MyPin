package com.foongdoll.server.note.repository;

import com.foongdoll.server.note.domain.Category;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface NoteCategoryRepository extends JpaRepository<Category, Long> {

    // 카테고리 코드로 찾을 때도 내 것만
    Optional<Category> findByOwnerIdAndCode(String ownerId, String code);

    // 트리 조회용: 현재 사용자 것만 + 기존 정렬 유지
    List<Category> findAllByOwnerIdOrderByDepthAscSortOrderAscIdAsc(String ownerId);

    // 부모/자식 체크할 때도 내 것만 (deleteCategory에서 활용 가능)
    boolean existsByOwnerIdAndParentId(String ownerId, Long parentId);
}
