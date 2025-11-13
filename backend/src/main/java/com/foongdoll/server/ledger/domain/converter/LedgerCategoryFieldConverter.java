package com.foongdoll.server.ledger.domain.converter;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.foongdoll.server.ledger.domain.LedgerCategoryField;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

import java.util.Collections;
import java.util.List;

@Converter
public class LedgerCategoryFieldConverter implements AttributeConverter<List<LedgerCategoryField>, String> {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper().findAndRegisterModules();
    private static final TypeReference<List<LedgerCategoryField>> TYPE = new TypeReference<>() {};

    @Override
    public String convertToDatabaseColumn(List<LedgerCategoryField> attribute) {
        try {
            return attribute == null ? "[]" : OBJECT_MAPPER.writeValueAsString(attribute);
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException("Failed to serialize ledger category fields", e);
        }
    }

    @Override
    public List<LedgerCategoryField> convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isBlank()) {
            return Collections.emptyList();
        }
        try {
            return OBJECT_MAPPER.readValue(dbData, TYPE);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to deserialize ledger category fields", e);
        }
    }
}
