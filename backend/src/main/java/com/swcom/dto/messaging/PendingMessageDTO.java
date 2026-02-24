package com.swcom.dto.messaging;

import com.swcom.entity.enums.PlatformType;
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
public class PendingMessageDTO {
    private UUID id;
    private PlatformType platformType;
    private String platformUserId;
    private UUID employeeId;
    private String employeeName;
    private String content;
    private String messageType;
    private String filePath;
    private String fileName;
    private String fileType;
    private LocalDateTime createdAt;
}
