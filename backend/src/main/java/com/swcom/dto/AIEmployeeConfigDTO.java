package com.swcom.dto;

import com.swcom.entity.enums.ConnectionStatus;
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
public class AIEmployeeConfigDTO {
    private UUID id;
    private UUID employeeId;
    private String apiUrl;
    private String modelName;
    private String rolePrompt;
    private ConnectionStatus connectionStatus;
    private LocalDateTime lastTestTime;
    private List<String> availableModels;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
