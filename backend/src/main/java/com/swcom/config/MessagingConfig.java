package com.swcom.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;

@Configuration
@EnableAsync
public class MessagingConfig {

    private final MessagingProperties messagingProperties;

    public MessagingConfig(MessagingProperties messagingProperties) {
        this.messagingProperties = messagingProperties;
    }

    @Bean(name = "messagingTaskExecutor")
    public Executor messagingTaskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(messagingProperties.getAsync().getThreadPoolSize());
        executor.setMaxPoolSize(messagingProperties.getAsync().getThreadPoolSize() * 2);
        executor.setQueueCapacity(100);
        executor.setThreadNamePrefix("messaging-async-");
        executor.initialize();
        return executor;
    }
}
