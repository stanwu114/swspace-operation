package com.swcom.dto;

import com.swcom.entity.enums.MemoryType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AIMemoryRequest {

    private UUID conversationId;

    @NotNull(message = "Memory type is required")
    private MemoryType memoryType;

    @NotBlank(message = "Content is required")
    private String content;

    private Map<String, Object> metadata;
}
