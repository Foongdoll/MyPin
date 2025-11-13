package com.foongdoll.server.ledger.model;

import com.foongdoll.server.ledger.domain.LedgerCategoryField;
import com.foongdoll.server.ledger.domain.LedgerFlowType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.*;
import org.springframework.format.annotation.DateTimeFormat;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class LedgerDtos {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CategoryFieldDto {
        @NotBlank
        private String key;

        @NotBlank
        private String label;

        @NotNull
        private LedgerCategoryField.FieldType fieldType;

        @Builder.Default
        private boolean required = false;

        @Builder.Default
        private List<@NotBlank String> options = new ArrayList<>();
    }

    @Getter
    @Setter
    public static class CategoryRequest {
        @NotBlank
        private String name;
        private String description;
        @NotNull
        private LedgerFlowType defaultFlowType = LedgerFlowType.EXPENSE;
        private String color;
        @Valid
        private List<CategoryFieldDto> fields = new ArrayList<>();
    }

    @Getter
    @Setter
    @Builder
    public static class CategoryResponse {
        private Long id;
        private String name;
        private String description;
        private LedgerFlowType defaultFlowType;
        private String color;
        @Builder.Default
        private List<CategoryFieldDto> fields = new ArrayList<>();
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
    }

    @Getter
    @Setter
    public static class TransactionRequest {
        @NotNull
        private Long categoryId;

        private LedgerFlowType flowType;

        @NotNull
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
        private LocalDate transactionDate;

        @NotNull
        @Digits(integer = 13, fraction = 2)
        @DecimalMin(value = "0.0", inclusive = false)
        private BigDecimal amount;

        @Size(max = 255)
        private String memo;

        @Size(max = 80)
        private String wallet;

        private Map<String, Object> metadata = new LinkedHashMap<>();
    }

    @Getter
    @Setter
    @Builder
    public static class TransactionResponse {
        private Long id;
        private LedgerFlowType flowType;
        private LocalDate transactionDate;
        private BigDecimal amount;
        private String memo;
        private String wallet;
        private CategoryResponse category;
        @Builder.Default
        private Map<String, Object> metadata = new LinkedHashMap<>();
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
    }

    @Getter
    @Setter
    @Builder
    public static class TransactionListResponse {
        @Builder.Default
        private List<TransactionResponse> items = new ArrayList<>();
        private long total;
        private BigDecimal totalIncome;
        private BigDecimal totalExpense;
    }

    public enum LedgerTransactionSort {
        DATE_DESC,
        DATE_ASC,
        AMOUNT_DESC,
        AMOUNT_ASC
    }

    @Getter
    @Setter
    public static class TransactionSearchRequest {
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
        private LocalDate startDate;
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
        private LocalDate endDate;
        private Long categoryId;
        private LedgerFlowType flowType;
        @Size(max = 100)
        private String keyword;
        @Min(1)
        private int page = 1;
        @Min(1)
        @Max(100)
        private int size = 20;
        private LedgerTransactionSort sort = LedgerTransactionSort.DATE_DESC;
    }

    @Getter
    @Setter
    @Builder
    public static class OverviewResponse {
        private BigDecimal totalIncome;
        private BigDecimal totalExpense;
        private BigDecimal netChange;
        @Builder.Default
        private List<CategoryBreakdown> categoryBreakdown = new ArrayList<>();
        @Builder.Default
        private List<DailySummary> dailySummaries = new ArrayList<>();
        @Builder.Default
        private List<TransactionResponse> recentTransactions = new ArrayList<>();
    }

    @Getter
    @Setter
    @Builder
    public static class CategoryBreakdown {
        private Long categoryId;
        private String categoryName;
        private BigDecimal totalAmount;
        private double percentage;
    }

    @Getter
    @Setter
    @Builder
    public static class DailySummary {
        private LocalDate date;
        private BigDecimal income;
        private BigDecimal expense;
    }
}
