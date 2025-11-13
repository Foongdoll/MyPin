package com.foongdoll.server.ledger.domain;

import com.foongdoll.server.ledger.domain.converter.LedgerMetadataConverter;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@Entity
@Table(
        name = "ledger_transactions",
        indexes = {
                @Index(name = "ix_ledger_tx_date", columnList = "transaction_date"),
                @Index(name = "ix_ledger_tx_category", columnList = "category_id"),
                @Index(name = "ix_ledger_tx_flow", columnList = "flow_type")
        }
)
@Getter
@Setter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class LedgerTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "category_id")
    private LedgerCategory category;

    @Enumerated(EnumType.STRING)
    @Column(name = "flow_type", nullable = false, length = 16)
    private LedgerFlowType flowType;

    @Column(name = "transaction_date", nullable = false)
    private LocalDate transactionDate;

    @Column(nullable = false, precision = 18, scale = 2)
    private BigDecimal amount;

    @Column(length = 255)
    private String memo;

    @Column(length = 80)
    private String wallet;

    @Convert(converter = LedgerMetadataConverter.class)
    @Column(name = "metadata_json", columnDefinition = "LONGTEXT")
    @Builder.Default
    private Map<String, Object> metadata = new LinkedHashMap<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = this.createdAt;
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
