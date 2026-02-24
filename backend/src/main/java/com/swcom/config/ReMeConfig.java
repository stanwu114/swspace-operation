package com.swcom.config;

import io.agentscope.core.memory.reme.ReMeClient;
import io.agentscope.core.memory.reme.ReMeLongTermMemory;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

@Configuration
@Slf4j
public class ReMeConfig {

    @Value("${reme.api-url:http://localhost:8002}")
    private String remeApiUrl;

    @Value("${reme.timeout:60}")
    private int remeTimeoutSeconds;

    @Value("${reme.user-id:default-user}")
    private String defaultUserId;

    @Bean
    @ConditionalOnProperty(name = "reme.enabled", havingValue = "true", matchIfMissing = false)
    public ReMeClient reMeClient() {
        log.info("初始化 ReMeClient，连接地址: {}", remeApiUrl);
        return new ReMeClient(remeApiUrl, Duration.ofSeconds(remeTimeoutSeconds));
    }

    @Bean
    @ConditionalOnProperty(name = "reme.enabled", havingValue = "true", matchIfMissing = false)
    public ReMeLongTermMemory reMeLongTermMemory() {
        log.info("初始化 ReMeLongTermMemory，用户ID: {}, API: {}", defaultUserId, remeApiUrl);
        return ReMeLongTermMemory.builder()
                .apiBaseUrl(remeApiUrl)
                .timeout(Duration.ofSeconds(remeTimeoutSeconds))
                .userId(defaultUserId)
                .build();
    }
}
