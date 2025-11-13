package com.foongdoll.server.ledger.controller;

import com.foongdoll.server.common.response.ApiResponse;
import com.foongdoll.server.ledger.model.LedgerDtos;
import com.foongdoll.server.ledger.service.LedgerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/ledger")
@RequiredArgsConstructor
@Validated
public class LedgerController {

    private final LedgerService ledgerService;

    @GetMapping("/categories")
    public ResponseEntity<ApiResponse<List<LedgerDtos.CategoryResponse>>> getCategories() {
        return ResponseEntity.ok(ApiResponse.success(ledgerService.getCategories()));
    }

    @PostMapping("/categories")
    public ResponseEntity<ApiResponse<LedgerDtos.CategoryResponse>> createCategory(
            @Valid @RequestBody LedgerDtos.CategoryRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(ledgerService.createCategory(request)));
    }

    @PutMapping("/categories/{id}")
    public ResponseEntity<ApiResponse<LedgerDtos.CategoryResponse>> updateCategory(
            @PathVariable Long id,
            @Valid @RequestBody LedgerDtos.CategoryRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(ledgerService.updateCategory(id, request)));
    }

    @DeleteMapping("/categories/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteCategory(@PathVariable Long id) {
        ledgerService.deleteCategory(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @GetMapping("/transactions")
    public ResponseEntity<ApiResponse<LedgerDtos.TransactionListResponse>> getTransactions(
            @Valid LedgerDtos.TransactionSearchRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(ledgerService.getTransactions(request)));
    }

    @PostMapping("/transactions")
    public ResponseEntity<ApiResponse<LedgerDtos.TransactionResponse>> createTransaction(
            @Valid @RequestBody LedgerDtos.TransactionRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(ledgerService.createTransaction(request)));
    }

    @PutMapping("/transactions/{id}")
    public ResponseEntity<ApiResponse<LedgerDtos.TransactionResponse>> updateTransaction(
            @PathVariable Long id,
            @Valid @RequestBody LedgerDtos.TransactionRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(ledgerService.updateTransaction(id, request)));
    }

    @DeleteMapping("/transactions/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteTransaction(@PathVariable Long id) {
        ledgerService.deleteTransaction(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @GetMapping("/overview")
    public ResponseEntity<ApiResponse<LedgerDtos.OverviewResponse>> getOverview(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) Long categoryId
    ) {
        return ResponseEntity.ok(ApiResponse.success(ledgerService.getOverview(startDate, endDate, categoryId)));
    }
}
