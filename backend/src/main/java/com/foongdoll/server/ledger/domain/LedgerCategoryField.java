package com.foongdoll.server.ledger.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LedgerCategoryField {
    private String key;
    private String label;
    private FieldType fieldType;
    @Builder.Default
    private boolean required = false;
    @Builder.Default
    private List<String> options = new ArrayList<>();

    public enum FieldType {
        TEXT,
        NUMBER,
        DECIMAL,
        DATE,
        SELECT
    }
}
