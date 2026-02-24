package com.swcom.dto;

import com.swcom.entity.enums.EmployeeType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeForm {
    
    @NotBlank(message = "Employee name is required")
    @Size(max = 100, message = "Employee name must be less than 100 characters")
    private String name;
    
    @NotNull(message = "Employee type is required")
    private EmployeeType employeeType;
    
    @Size(max = 50, message = "Phone must be less than 50 characters")
    private String phone;
    
    @Size(max = 200, message = "Source company must be less than 200 characters")
    private String sourceCompany;
    
    private UUID positionId;
    
    private UUID departmentId;
    
    private BigDecimal dailyCost;
}
