package com.foongdoll.server.ledger.repository;

import com.foongdoll.server.ledger.domain.LedgerFlowType;
import com.foongdoll.server.ledger.domain.LedgerTransaction;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;

public final class LedgerTransactionSpecifications {

    private LedgerTransactionSpecifications() {
    }

    public static Specification<LedgerTransaction> between(LocalDate start, LocalDate end) {
        return (root, query, builder) -> {
            if (start == null && end == null) {
                return builder.conjunction();
            }
            if (start == null) {
                return builder.lessThanOrEqualTo(root.get("transactionDate"), end);
            }
            if (end == null) {
                return builder.greaterThanOrEqualTo(root.get("transactionDate"), start);
            }
            return builder.between(root.get("transactionDate"), start, end);
        };
    }

    public static Specification<LedgerTransaction> hasCategory(Long categoryId) {
        return (root, query, builder) -> {
            if (categoryId == null) {
                return builder.conjunction();
            }
            return builder.equal(root.get("category").get("id"), categoryId);
        };
    }

    public static Specification<LedgerTransaction> hasFlowType(LedgerFlowType flowType) {
        return (root, query, builder) -> {
            if (flowType == null) {
                return builder.conjunction();
            }
            return builder.equal(root.get("flowType"), flowType);
        };
    }

    public static Specification<LedgerTransaction> containsKeyword(String keyword) {
        return (root, query, builder) -> {
            if (keyword == null || keyword.isBlank()) {
                return builder.conjunction();
            }
            String like = "%" + keyword.trim() + "%";
            return builder.or(
                    builder.like(root.get("memo"), like),
                    builder.like(root.get("wallet"), like)
            );
        };
    }
}
