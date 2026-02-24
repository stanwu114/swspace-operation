package com.swcom.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.swcom.dto.AIModelConfigDTO;
import com.swcom.entity.SystemConfig;
import com.swcom.repository.SystemConfigRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class SystemConfigService {

    private static final String AI_MODEL_CONFIG_KEY = "ai_model_config";
    
    private final SystemConfigRepository configRepository;
    private final ObjectMapper objectMapper;

    /**
     * Get AI model configuration
     */
    public Optional<AIModelConfigDTO> getAIModelConfig() {
        return configRepository.findByConfigKey(AI_MODEL_CONFIG_KEY)
                .map(config -> {
                    try {
                        return objectMapper.readValue(config.getConfigValue(), AIModelConfigDTO.class);
                    } catch (JsonProcessingException e) {
                        log.error("Failed to parse AI model config", e);
                        return null;
                    }
                });
    }

    /**
     * Save AI model configuration
     */
    @Transactional
    public AIModelConfigDTO saveAIModelConfig(AIModelConfigDTO configDTO) {
        try {
            String configValue = objectMapper.writeValueAsString(configDTO);
            
            SystemConfig config = configRepository.findByConfigKey(AI_MODEL_CONFIG_KEY)
                    .orElse(SystemConfig.builder()
                            .configKey(AI_MODEL_CONFIG_KEY)
                            .description("Global AI model configuration")
                            .build());
            
            config.setConfigValue(configValue);
            configRepository.save(config);
            
            log.info("AI model config saved: apiUrl={}, model={}", configDTO.getApiUrl(), configDTO.getModelName());
            return configDTO;
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize AI model config", e);
            throw new RuntimeException("Failed to save AI model config", e);
        }
    }

    /**
     * Check if AI model is configured
     */
    public boolean isAIModelConfigured() {
        return getAIModelConfig()
                .map(config -> config.getApiUrl() != null && !config.getApiUrl().isBlank()
                        && config.getApiKey() != null && !config.getApiKey().isBlank()
                        && config.getModelName() != null && !config.getModelName().isBlank())
                .orElse(false);
    }
}
