package com.swcom.dto.messaging;

import com.swcom.entity.enums.PlatformType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlatformConfigDTO {

    private UUID id;
    private PlatformType platformType;
    private String platformName;
    private Map<String, Object> configData;
    private String webhookUrl;
    private Boolean isEnabled;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
