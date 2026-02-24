package com.swcom.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatRequest {
    
    private UUID conversationId;
    
    @NotBlank(message = "Module name is required")
    private String moduleName;
    
    private UUID contextId;
    
    @NotBlank(message = "Message is required")
    private String message;
    
    private List<String> attachments;
}
