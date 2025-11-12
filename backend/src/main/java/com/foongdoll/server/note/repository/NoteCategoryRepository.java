package com.foongdoll.server.note.repository;

import com.foongdoll.server.note.domain.Category;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface NoteCategoryRepository extends JpaRepository<Category, Long> {
    Optional<Category> findByCode(String code);
    boolean existsByParentId(Long parentId);
}
