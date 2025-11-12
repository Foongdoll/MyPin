package com.foongdoll.server.note.controller;

import com.foongdoll.server.common.response.ApiResponse;
import com.foongdoll.server.note.model.Dtos;
import com.foongdoll.server.note.service.NoteAssetService;
import com.foongdoll.server.note.service.NoteService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/note")
public class NoteController {

    private final NoteService noteService;
    private final NoteAssetService noteAssetService;

    public NoteController(NoteService noteService, NoteAssetService noteAssetService) {
        this.noteService = noteService;
        this.noteAssetService = noteAssetService;
    }

    /* -------------------- NOTE: LIST (검색/페이징) -------------------- */
    @GetMapping
    public ResponseEntity<ApiResponse<Dtos.NoteListResponse>> getNotes(
            @RequestParam(defaultValue = "1") int page,             // 1-based
            @RequestParam(defaultValue = "6") int pageSize,         // 항상 6
            @RequestParam(required = false) String q,               // 제목/내용 검색어
            @RequestParam(required = false) String categoryCode,    // 특정 카테고리(해당 노드 또는 하위 포함)
            @RequestParam(required = false) String categoryPath     // 직접 path로 필터링하고 싶을 때
    ) {
        Dtos.NoteListResponse res = noteService.getNotes(page, pageSize, q, categoryCode, categoryPath);
        return ResponseEntity.ok(ApiResponse.success(res));
    }

    /* -------------------- NOTE: DETAIL -------------------- */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Dtos.NoteDetailResponse>> getNote(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(noteService.getNote(id)));
    }

    /* -------------------- NOTE: CREATE -------------------- */
    @PostMapping
    public ResponseEntity<ApiResponse<Dtos.NoteDetailResponse>> createNote(@RequestBody Dtos.NoteCreateRequest req) {
        return ResponseEntity.ok(ApiResponse.success(noteService.createNote(req)));
    }

    /* -------------------- NOTE: UPDATE -------------------- */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Dtos.NoteDetailResponse>> updateNote(
            @PathVariable Long id,
            @RequestBody Dtos.NoteUpdateRequest req
    ) {
        return ResponseEntity.ok(ApiResponse.success(noteService.updateNote(id, req)));
    }

    /* -------------------- NOTE: DELETE -------------------- */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteNote(@PathVariable Long id) {
        noteService.deleteNote(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    /* ==================== CATEGORY: CRUD ==================== */

    /* 트리 전체 조회 */
    @GetMapping("/categories")
    public ResponseEntity<ApiResponse<List<Dtos.CategoryNode>>> getCategoryTree() {
        return ResponseEntity.ok(ApiResponse.success(noteService.getCategoryTree()));
    }

    /* 단건 조회 */
    @GetMapping("/categories/{id}")
    public ResponseEntity<ApiResponse<Dtos.CategoryNode>> getCategory(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(noteService.getCategoryNode(id)));
    }

    /* 생성 (parentId=null이면 루트) */
    @PostMapping("/categories")
    public ResponseEntity<ApiResponse<Dtos.CategoryNode>> createCategory(@RequestBody Dtos.CategoryCreateRequest req) {
        return ResponseEntity.ok(ApiResponse.success(noteService.createCategory(req)));
    }

    /* 수정 (label/code/sortOrder/parent 변경 가능) */
    @PutMapping("/categories/{id}")
    public ResponseEntity<ApiResponse<Dtos.CategoryNode>> updateCategory(
            @PathVariable Long id,
            @RequestBody Dtos.CategoryUpdateRequest req
    ) {
        return ResponseEntity.ok(ApiResponse.success(noteService.updateCategory(id, req)));
    }

    /* 삭제 (하위/참조 처리 전략은 서비스에 기술) */
    @DeleteMapping("/categories/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteCategory(@PathVariable Long id) {
        noteService.deleteCategory(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PostMapping("/assets")
    public ResponseEntity<ApiResponse<Dtos.AssetUploadResponse>> uploadAsset(@RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(ApiResponse.success(noteAssetService.uploadImage(file)));
    }
}
