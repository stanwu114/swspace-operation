package com.swcom.dto;

import com.swcom.entity.enums.ProjectCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectForm {
    
    @NotBlank(message = "Project name is required")
    @Size(max = 200, message = "Project name must be less than 200 characters")
    private String projectName;
    
    @NotNull(message = "Project category is required")
    private ProjectCategory projectCategory;
    
    private String objective;
    
    private String content;
    
    private UUID leaderId;
    
    private LocalDate startDate;
    
    @Size(max = 200, message = "Client name must be less than 200 characters")
    private String clientName;
    
    @Size(max = 100, message = "Client contact must be less than 100 characters")
    private String clientContact;
    
    @Size(max = 200, message = "Subcontract entity must be less than 200 characters")
    private String subcontractEntity;
}
