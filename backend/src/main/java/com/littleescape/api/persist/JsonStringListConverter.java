package com.littleescape.api.persist;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

import java.util.Collections;
import java.util.List;

@Converter
public class JsonStringListConverter implements AttributeConverter<List<String>, String> {
  private static final ObjectMapper om = new ObjectMapper();
  private static final TypeReference<List<String>> T = new TypeReference<>() {};

  @Override
  public String convertToDatabaseColumn(List<String> attribute) {
    try {
      return om.writeValueAsString(attribute == null ? Collections.emptyList() : attribute);
    } catch (Exception e) {
      throw new IllegalArgumentException("Failed to serialize json", e);
    }
  }

  @Override
  public List<String> convertToEntityAttribute(String dbData) {
    try {
      if (dbData == null || dbData.isBlank()) return Collections.emptyList();
      return om.readValue(dbData, T);
    } catch (Exception e) {
      throw new IllegalArgumentException("Failed to deserialize json", e);
    }
  }
}
