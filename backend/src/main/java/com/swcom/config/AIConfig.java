package com.swcom.config;

import com.swcom.dto.AIModelConfigDTO;
import com.swcom.service.SystemConfigService;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.ai.openai.OpenAiChatOptions;
import org.springframework.ai.openai.api.OpenAiApi;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Lazy;

import java.util.Optional;

@Configuration
@SuppressWarnings("null")
public class AIConfig {

    @Value("${spring.ai.openai.api-key:}")
    private String defaultApiKey;

    @Value("${spring.ai.openai.base-url:https://api.openai.com}")
    private String defaultBaseUrl;

    @Autowired
    @Lazy
    private SystemConfigService systemConfigService;

    @Bean
    public ChatClient.Builder chatClientBuilder(OpenAiChatModel chatModel) {
        return ChatClient.builder(chatModel);
    }

    @Bean
    @SuppressWarnings("deprecation")
    public OpenAiChatModel openAiChatModel() {
        OpenAiApi openAiApi = new OpenAiApi(defaultBaseUrl, defaultApiKey);
        OpenAiChatOptions options = OpenAiChatOptions.builder()
                .model("gpt-4o-mini")
                .temperature(0.7)
                .build();
        return new OpenAiChatModel(openAiApi, options);
    }

    /**
     * Create a custom ChatClient for a specific AI employee configuration
     */
    @SuppressWarnings("deprecation")
    public ChatClient createCustomChatClient(String apiUrl, String apiKey, String modelName, Double temperature) {
        // Normalize API URL: remove trailing /v1 if present (OpenAiApi adds it automatically)
        String normalizedUrl = apiUrl;
        if (normalizedUrl.endsWith("/v1")) {
            normalizedUrl = normalizedUrl.substring(0, normalizedUrl.length() - 3);
        }
        if (normalizedUrl.endsWith("/v1/")) {
            normalizedUrl = normalizedUrl.substring(0, normalizedUrl.length() - 4);
        }
        // Also remove trailing slash
        if (normalizedUrl.endsWith("/")) {
            normalizedUrl = normalizedUrl.substring(0, normalizedUrl.length() - 1);
        }
        
        OpenAiApi openAiApi = new OpenAiApi(normalizedUrl, apiKey);
        OpenAiChatOptions options = OpenAiChatOptions.builder()
                .model(modelName != null ? modelName : "gpt-4o-mini")
                .temperature(temperature != null ? temperature : 0.7)
                .build();
        OpenAiChatModel chatModel = new OpenAiChatModel(openAiApi, options);
        return ChatClient.builder(chatModel).build();
    }

    /**
     * Get ChatClient using database configuration (preferred) or fall back to environment variables
     */
    public Optional<ChatClient> getDynamicChatClient() {
        // Try to get config from database first
        Optional<AIModelConfigDTO> dbConfig = systemConfigService.getAIModelConfig();
        
        if (dbConfig.isPresent()) {
            AIModelConfigDTO config = dbConfig.get();
            if (config.getApiUrl() != null && !config.getApiUrl().isBlank()
                    && config.getApiKey() != null && !config.getApiKey().isBlank()) {
                return Optional.of(createCustomChatClient(
                        config.getApiUrl(),
                        config.getApiKey(),
                        config.getModelName(),
                        config.getTemperature()
                ));
            }
        }
        
        // Fall back to environment variable config
        if (defaultApiKey != null && !defaultApiKey.isBlank() && !defaultApiKey.equals("sk-placeholder")) {
            return Optional.of(createCustomChatClient(defaultBaseUrl, defaultApiKey, "gpt-4o-mini", 0.7));
        }
        
        return Optional.empty();
    }
}
