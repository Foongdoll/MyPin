package com.foongdoll.server.ledger.repository;

import com.foongdoll.server.ledger.domain.LedgerCategory;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LedgerCategoryRepository extends JpaRepository<LedgerCategory, Long> {
}
