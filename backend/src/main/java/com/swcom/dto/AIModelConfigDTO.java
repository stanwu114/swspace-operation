package com.swcom.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AIModelConfigDTO {
    private String apiUrl;
    private String apiKey;
    private String modelName;
    private Double temperature;
}
