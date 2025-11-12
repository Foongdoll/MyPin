package com.foongdoll.server.note.repository;

import com.foongdoll.server.note.domain.Note;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface NoteRepository extends JpaRepository<Note, Long>, JpaSpecificationExecutor<Note> {
    boolean existsByCategoryId(Long categoryId);
}
