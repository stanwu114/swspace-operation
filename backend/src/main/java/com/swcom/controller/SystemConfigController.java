package com.swcom.controller;

import com.swcom.dto.AIModelConfigDTO;
import com.swcom.dto.ApiResponse;
import com.swcom.service.SystemConfigService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/system-config")
@RequiredArgsConstructor
public class SystemConfigController {

    private final SystemConfigService systemConfigService;

    /**
     * Get AI model configuration
     */
    @GetMapping("/ai-model")
    public ResponseEntity<ApiResponse<AIModelConfigDTO>> getAIModelConfig() {
        return systemConfigService.getAIModelConfig()
                .map(config -> {
                    // Mask API key for security
                    AIModelConfigDTO masked = AIModelConfigDTO.builder()
                            .apiUrl(config.getApiUrl())
                            .apiKey(maskApiKey(config.getApiKey()))
                            .modelName(config.getModelName())
                            .temperature(config.getTemperature())
                            .build();
                    return ResponseEntity.ok(ApiResponse.success(masked));
                })
                .orElse(ResponseEntity.ok(ApiResponse.success(null)));
    }

    /**
     * Save AI model configuration
     */
    @PostMapping("/ai-model")
    public ResponseEntity<ApiResponse<AIModelConfigDTO>> saveAIModelConfig(@RequestBody AIModelConfigDTO config) {
        if (config.getApiUrl() == null || config.getApiUrl().isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.badRequest("API URL is required"));
        }
        if (config.getApiKey() == null || config.getApiKey().isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.badRequest("API Key is required"));
        }
        if (config.getModelName() == null || config.getModelName().isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.badRequest("Model name is required"));
        }

        AIModelConfigDTO saved = systemConfigService.saveAIModelConfig(config);
        
        // Mask API key in response
        AIModelConfigDTO masked = AIModelConfigDTO.builder()
                .apiUrl(saved.getApiUrl())
                .apiKey(maskApiKey(saved.getApiKey()))
                .modelName(saved.getModelName())
                .temperature(saved.getTemperature())
                .build();
        
        return ResponseEntity.ok(ApiResponse.success(masked));
    }

    /**
     * Check if AI model is configured
     */
    @GetMapping("/ai-model/status")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAIModelStatus() {
        boolean configured = systemConfigService.isAIModelConfigured();
        return ResponseEntity.ok(ApiResponse.success(Map.of(
                "configured", configured,
                "message", configured ? "AI model is configured" : "AI model is not configured"
        )));
    }

    private String maskApiKey(String apiKey) {
        if (apiKey == null || apiKey.length() <= 8) {
            return "****";
        }
        return apiKey.substring(0, 4) + "****" + apiKey.substring(apiKey.length() - 4);
    }
}
