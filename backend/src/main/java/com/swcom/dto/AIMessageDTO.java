package com.swcom.dto;

import com.swcom.entity.enums.MessageRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AIMessageDTO {
    private UUID id;
    private UUID conversationId;
    private MessageRole role;
    private String content;
    private List<String> attachments;
    private Integer tokensUsed;
    private LocalDateTime messageTime;
}
