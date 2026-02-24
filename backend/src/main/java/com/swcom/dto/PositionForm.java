package com.swcom.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PositionForm {
    
    @NotBlank(message = "Position name is required")
    @Size(max = 100, message = "Position name must be less than 100 characters")
    private String name;
    
    @NotNull(message = "Department ID is required")
    private UUID departmentId;
    
    private String responsibilities;
    
    private Integer sortOrder;
}
