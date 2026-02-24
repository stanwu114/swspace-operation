package com.swcom.dto;

import com.swcom.entity.enums.ProjectCategory;
import com.swcom.entity.enums.ProjectStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectDTO {
    private UUID id;
    private String projectNo;
    private String projectName;
    private ProjectCategory projectCategory;
    private String objective;
    private String content;
    private UUID leaderId;
    private String leaderName;
    private LocalDate startDate;
    private String clientName;
    private String clientContact;
    private ProjectStatus status;
    private String subcontractEntity;
    private BigDecimal totalCost;
    private int documentCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
