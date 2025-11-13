package com.foongdoll.server.ledger.service;

import com.foongdoll.server.ledger.domain.LedgerCategory;
import com.foongdoll.server.ledger.domain.LedgerCategoryField;
import com.foongdoll.server.ledger.domain.LedgerFlowType;
import com.foongdoll.server.ledger.domain.LedgerTransaction;
import com.foongdoll.server.ledger.model.LedgerDtos;
import com.foongdoll.server.ledger.repository.LedgerCategoryRepository;
import com.foongdoll.server.ledger.repository.LedgerTransactionRepository;
import com.foongdoll.server.ledger.repository.LedgerTransactionSpecifications;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class LedgerService {

    private final LedgerCategoryRepository categoryRepository;
    private final LedgerTransactionRepository transactionRepository;

    @Transactional(readOnly = true)
    public List<LedgerDtos.CategoryResponse> getCategories() {
        return categoryRepository.findAll(Sort.by(Sort.Direction.ASC, "name"))
                .stream()
                .map(this::toCategoryResponse)
                .toList();
    }

    public LedgerDtos.CategoryResponse createCategory(LedgerDtos.CategoryRequest request) {
        LedgerCategory category = LedgerCategory.builder()
                .name(request.getName().trim())
                .description(request.getDescription())
                .defaultFlowType(request.getDefaultFlowType())
                .color(request.getColor())
                .fields(mapFields(request.getFields()))
                .build();
        return toCategoryResponse(categoryRepository.save(category));
    }

    public LedgerDtos.CategoryResponse updateCategory(Long id, LedgerDtos.CategoryRequest request) {
        LedgerCategory category = categoryRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("카테고리를 찾을 수 없습니다."));
        category.setName(request.getName().trim());
        category.setDescription(request.getDescription());
        category.setDefaultFlowType(request.getDefaultFlowType());
        category.setColor(request.getColor());
        category.setFields(mapFields(request.getFields()));
        return toCategoryResponse(categoryRepository.save(category));
    }

    public void deleteCategory(Long id) {
        if (transactionRepository.existsByCategoryId(id)) {
            throw new IllegalStateException("카테고리에 연결된 거래가 있어 삭제할 수 없습니다.");
        }
        categoryRepository.deleteById(id);
    }

    public LedgerDtos.TransactionResponse createTransaction(LedgerDtos.TransactionRequest request) {
        LedgerCategory category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new EntityNotFoundException("카테고리를 찾을 수 없습니다."));
        LedgerTransaction transaction = LedgerTransaction.builder()
                .category(category)
                .flowType(request.getFlowType() != null ? request.getFlowType() : category.getDefaultFlowType())
                .transactionDate(request.getTransactionDate())
                .amount(request.getAmount())
                .memo(request.getMemo())
                .wallet(request.getWallet())
                .metadata(normalizeMetadata(category, request.getMetadata()))
                .build();
        return toTransactionResponse(transactionRepository.save(transaction));
    }

    public LedgerDtos.TransactionResponse updateTransaction(Long id, LedgerDtos.TransactionRequest request) {
        LedgerTransaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("거래를 찾을 수 없습니다."));
        LedgerCategory category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new EntityNotFoundException("카테고리를 찾을 수 없습니다."));
        transaction.setCategory(category);
        transaction.setFlowType(request.getFlowType() != null ? request.getFlowType() : category.getDefaultFlowType());
        transaction.setTransactionDate(request.getTransactionDate());
        transaction.setAmount(request.getAmount());
        transaction.setMemo(request.getMemo());
        transaction.setWallet(request.getWallet());
        transaction.setMetadata(normalizeMetadata(category, request.getMetadata()));
        return toTransactionResponse(transactionRepository.save(transaction));
    }

    public void deleteTransaction(Long id) {
        transactionRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public LedgerDtos.TransactionListResponse getTransactions(LedgerDtos.TransactionSearchRequest searchRequest) {
        LocalDate[] range = ensureRange(searchRequest.getStartDate(), searchRequest.getEndDate());
        Pageable pageable = PageRequest.of(
                Math.max(0, searchRequest.getPage() - 1),
                searchRequest.getSize(),
                resolveSort(searchRequest.getSort())
        );
        Specification<LedgerTransaction> specification = Specification
                .where(LedgerTransactionSpecifications.between(range[0], range[1]))
                .and(LedgerTransactionSpecifications.hasCategory(searchRequest.getCategoryId()))
                .and(LedgerTransactionSpecifications.hasFlowType(searchRequest.getFlowType()))
                .and(LedgerTransactionSpecifications.containsKeyword(searchRequest.getKeyword()));

        Page<LedgerTransaction> page = transactionRepository.findAll(specification, pageable);
        List<LedgerDtos.TransactionResponse> items = page.getContent()
                .stream()
                .map(this::toTransactionResponse)
                .toList();

        List<LedgerTransaction> totalsSource = transactionRepository.findAll(specification);
        BigDecimal totalIncome = totalsSource.stream()
                .filter(tx -> tx.getFlowType() == LedgerFlowType.INCOME)
                .map(LedgerTransaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalExpense = totalsSource.stream()
                .filter(tx -> tx.getFlowType() == LedgerFlowType.EXPENSE)
                .map(LedgerTransaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return LedgerDtos.TransactionListResponse.builder()
                .items(items)
                .total(page.getTotalElements())
                .totalIncome(totalIncome)
                .totalExpense(totalExpense)
                .build();
    }

    @Transactional(readOnly = true)
    public LedgerDtos.OverviewResponse getOverview(LocalDate start, LocalDate end, Long categoryId) {
        LocalDate[] range = ensureRange(start, end);
        List<LedgerTransaction> transactions = categoryId == null
                ? transactionRepository.findByTransactionDateBetween(range[0], range[1])
                : transactionRepository.findByCategoryIdAndTransactionDateBetween(categoryId, range[0], range[1]);

        BigDecimal totalIncome = transactions.stream()
                .filter(tx -> tx.getFlowType() == LedgerFlowType.INCOME)
                .map(LedgerTransaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalExpense = transactions.stream()
                .filter(tx -> tx.getFlowType() == LedgerFlowType.EXPENSE)
                .map(LedgerTransaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<Long, BigDecimal> expenseByCategory = transactions.stream()
                .filter(tx -> tx.getFlowType() == LedgerFlowType.EXPENSE)
                .collect(Collectors.groupingBy(tx -> tx.getCategory().getId(),
                        LinkedHashMap::new,
                        Collectors.reducing(BigDecimal.ZERO, LedgerTransaction::getAmount, BigDecimal::add)));

        Map<Long, LedgerCategory> categoryMap = transactions.stream()
                .map(LedgerTransaction::getCategory)
                .collect(Collectors.toMap(LedgerCategory::getId, c -> c, (left, right) -> left, LinkedHashMap::new));

        List<LedgerDtos.CategoryBreakdown> breakdowns = expenseByCategory.entrySet().stream()
                .map(entry -> {
                    LedgerCategory category = categoryMap.get(entry.getKey());
                    double percentage = totalExpense.compareTo(BigDecimal.ZERO) == 0
                            ? 0
                            : entry.getValue().multiply(BigDecimal.valueOf(100))
                            .divide(totalExpense, 2, RoundingMode.HALF_UP)
                            .doubleValue();
                    return LedgerDtos.CategoryBreakdown.builder()
                            .categoryId(entry.getKey())
                            .categoryName(category != null ? category.getName() : "기타")
                            .totalAmount(entry.getValue())
                            .percentage(percentage)
                            .build();
                })
                .sorted(Comparator.comparing(LedgerDtos.CategoryBreakdown::getTotalAmount).reversed())
                .toList();

        Map<LocalDate, LedgerDtos.DailySummary> dailyTotals = new LinkedHashMap<>();
        transactions.forEach(tx -> {
            LedgerDtos.DailySummary summary = dailyTotals.computeIfAbsent(tx.getTransactionDate(),
                    date -> LedgerDtos.DailySummary.builder()
                            .date(date)
                            .income(BigDecimal.ZERO)
                            .expense(BigDecimal.ZERO)
                            .build());
            if (tx.getFlowType() == LedgerFlowType.INCOME) {
                summary.setIncome(summary.getIncome().add(tx.getAmount()));
            } else {
                summary.setExpense(summary.getExpense().add(tx.getAmount()));
            }
        });

        List<LedgerTransaction> recent = categoryId == null
                ? transactionRepository.findTop5ByTransactionDateBetweenOrderByTransactionDateDescCreatedAtDesc(range[0], range[1])
                : transactionRepository.findTop5ByCategoryIdAndTransactionDateBetweenOrderByTransactionDateDescCreatedAtDesc(categoryId, range[0], range[1]);

        return LedgerDtos.OverviewResponse.builder()
                .totalIncome(totalIncome)
                .totalExpense(totalExpense)
                .netChange(totalIncome.subtract(totalExpense))
                .categoryBreakdown(breakdowns)
                .dailySummaries(dailyTotals.values().stream()
                        .sorted(Comparator.comparing(LedgerDtos.DailySummary::getDate))
                        .toList())
                .recentTransactions(recent.stream().map(this::toTransactionResponse).toList())
                .build();
    }

    private Sort resolveSort(LedgerDtos.LedgerTransactionSort sort) {
        return switch (sort) {
            case DATE_ASC -> Sort.by(Sort.Direction.ASC, "transactionDate", "id");
            case DATE_DESC -> Sort.by(Sort.Direction.DESC, "transactionDate", "id");
            case AMOUNT_ASC -> Sort.by(Sort.Direction.ASC, "amount");
            case AMOUNT_DESC -> Sort.by(Sort.Direction.DESC, "amount");
        };
    }

    private LedgerDtos.CategoryResponse toCategoryResponse(LedgerCategory category) {
        return LedgerDtos.CategoryResponse.builder()
                .id(category.getId())
                .name(category.getName())
                .description(category.getDescription())
                .defaultFlowType(category.getDefaultFlowType())
                .color(category.getColor())
                .fields(category.getFields().stream()
                        .map(field -> LedgerDtos.CategoryFieldDto.builder()
                                .key(field.getKey())
                                .label(field.getLabel())
                                .fieldType(field.getFieldType())
                                .required(field.isRequired())
                                .options(field.getOptions() != null ? List.copyOf(field.getOptions()) : List.of())
                                .build())
                        .toList())
                .createdAt(category.getCreatedAt())
                .updatedAt(category.getUpdatedAt())
                .build();
    }

    private LedgerDtos.TransactionResponse toTransactionResponse(LedgerTransaction transaction) {
        return LedgerDtos.TransactionResponse.builder()
                .id(transaction.getId())
                .flowType(transaction.getFlowType())
                .transactionDate(transaction.getTransactionDate())
                .amount(transaction.getAmount())
                .memo(transaction.getMemo())
                .wallet(transaction.getWallet())
                .metadata(transaction.getMetadata())
                .category(toCategoryResponse(transaction.getCategory()))
                .createdAt(transaction.getCreatedAt())
                .updatedAt(transaction.getUpdatedAt())
                .build();
    }

    private List<LedgerCategoryField> mapFields(List<LedgerDtos.CategoryFieldDto> fieldDtos) {
        if (fieldDtos == null) {
            return new ArrayList<>();
        }
        Set<String> keys = new HashSet<>();
        List<LedgerCategoryField> fields = new ArrayList<>();
        for (LedgerDtos.CategoryFieldDto dto : fieldDtos) {
            String key = dto.getKey().trim();
            if (!keys.add(key)) {
                throw new IllegalArgumentException("필드 키가 중복되었습니다: " + key);
            }
            fields.add(LedgerCategoryField.builder()
                    .key(key)
                    .label(dto.getLabel().trim())
                    .fieldType(dto.getFieldType())
                    .required(dto.isRequired())
                    .options(dto.getOptions() != null ? List.copyOf(dto.getOptions()) : List.of())
                    .build());
        }
        return fields;
    }

    private Map<String, Object> normalizeMetadata(LedgerCategory category, Map<String, Object> metadata) {
        if (metadata == null) {
            metadata = Collections.emptyMap();
        }
        Map<String, LedgerCategoryField> fieldMap = category.getFields().stream()
                .collect(Collectors.toMap(LedgerCategoryField::getKey, f -> f));
        Map<String, Object> normalized = new LinkedHashMap<>();
        metadata.forEach((key, value) -> {
            if (fieldMap.containsKey(key) && value != null) {
                normalized.put(key, value);
            }
        });
        category.getFields().stream()
                .filter(LedgerCategoryField::isRequired)
                .forEach(field -> {
                    if (!normalized.containsKey(field.getKey())) {
                        throw new IllegalArgumentException("필수 항목을 입력해주세요: " + field.getLabel());
                    }
                });
        return normalized;
    }

    private LocalDate[] ensureRange(LocalDate start, LocalDate end) {
        if (start == null && end == null) {
            YearMonth current = YearMonth.now();
            return new LocalDate[]{current.atDay(1), current.atEndOfMonth()};
        }
        if (start == null) {
            return new LocalDate[]{end.minusMonths(1), end};
        }
        if (end == null) {
            return new LocalDate[]{start, start.plusMonths(1)};
        }
        if (end.isBefore(start)) {
            throw new IllegalArgumentException("종료일이 시작일보다 빠를 수 없습니다.");
        }
        return new LocalDate[]{start, end};
    }
}
