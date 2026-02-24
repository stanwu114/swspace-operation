package com.swcom.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AIEmployeeConfigForm {
    
    @NotBlank(message = "API URL is required")
    @Size(max = 500, message = "API URL must be less than 500 characters")
    private String apiUrl;
    
    @NotBlank(message = "API Key is required")
    @Size(max = 500, message = "API Key must be less than 500 characters")
    private String apiKey;
    
    @Size(max = 100, message = "Model name must be less than 100 characters")
    private String modelName;
    
    private String rolePrompt;
}
