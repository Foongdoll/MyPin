package com.foongdoll.server.ledger.repository;

import com.foongdoll.server.ledger.domain.LedgerTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.time.LocalDate;
import java.util.List;

public interface LedgerTransactionRepository extends JpaRepository<LedgerTransaction, Long>, JpaSpecificationExecutor<LedgerTransaction> {

    List<LedgerTransaction> findByTransactionDateBetween(LocalDate start, LocalDate end);

    List<LedgerTransaction> findByCategoryIdAndTransactionDateBetween(Long categoryId, LocalDate start, LocalDate end);

    List<LedgerTransaction> findTop5ByTransactionDateBetweenOrderByTransactionDateDescCreatedAtDesc(LocalDate start, LocalDate end);

    List<LedgerTransaction> findTop5ByCategoryIdAndTransactionDateBetweenOrderByTransactionDateDescCreatedAtDesc(Long categoryId, LocalDate start, LocalDate end);

    boolean existsByCategoryId(Long categoryId);
}
