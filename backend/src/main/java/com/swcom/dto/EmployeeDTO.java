package com.swcom.dto;

import com.swcom.entity.enums.EmployeeStatus;
import com.swcom.entity.enums.EmployeeType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeDTO {
    private UUID id;
    private String name;
    private EmployeeType employeeType;
    private String phone;
    private String sourceCompany;
    private UUID positionId;
    private String positionName;
    private UUID departmentId;
    private String departmentName;
    private BigDecimal dailyCost;
    private EmployeeStatus status;
    private AIEmployeeConfigDTO aiConfig;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
