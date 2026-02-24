package com.swcom.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "messaging")
public class MessagingProperties {

    private boolean enabled = true;

    private TelegramConfig telegram = new TelegramConfig();
    private WeChatConfig wechat = new WeChatConfig();
    private AsyncConfig async = new AsyncConfig();
    private BindingConfig binding = new BindingConfig();

    @Data
    public static class TelegramConfig {
        private boolean enabled = false;
        private String botToken;
        private String webhookSecret;
        private String webhookBaseUrl;
    }

    @Data
    public static class WeChatConfig {
        private boolean enabled = false;
        private String appId;
        private String appSecret;
        private String token;
        private String encodingAesKey;
    }

    @Data
    public static class AsyncConfig {
        private boolean enabled = true;
        private int threadPoolSize = 5;
        private int timeoutThreshold = 5;
    }

    @Data
    public static class BindingConfig {
        private int codeLength = 6;
        private int codeExpiryMinutes = 30;
    }
}
