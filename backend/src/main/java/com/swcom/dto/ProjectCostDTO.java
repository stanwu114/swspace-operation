package com.swcom.dto;

import com.swcom.entity.enums.CostType;
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
public class ProjectCostDTO {
    private UUID id;
    private UUID projectId;
    private CostType costType;
    private BigDecimal amount;
    private String description;
    private LocalDate costDate;
    private LocalDateTime createdAt;
}
