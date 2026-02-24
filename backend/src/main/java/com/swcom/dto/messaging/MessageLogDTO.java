package com.swcom.dto.messaging;

import com.swcom.entity.enums.MessageDirection;
import com.swcom.entity.enums.PlatformType;
import com.swcom.entity.enums.ProcessingStatus;
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
public class MessageLogDTO {

    private UUID id;
    private UUID bindingId;
    private PlatformType platformType;
    private UUID conversationId;
    private MessageDirection direction;
    private String messageType;
    private String content;
    private ProcessingStatus processingStatus;
    private String errorMessage;
    private LocalDateTime processedAt;
    private LocalDateTime createdAt;
}
