package com.swcom.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AIConversationDTO {
    private UUID id;
    private String moduleName;
    private UUID contextId;
    private String title;
    private String conversationSummary;
    private int messageCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
