package com.swcom.service.messaging;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.swcom.config.MessagingProperties;
import com.swcom.config.StorageConfig;
import com.swcom.dto.messaging.IncomingMessage;
import com.swcom.entity.MessagingPlatformConfig;
import com.swcom.entity.enums.PlatformType;
import com.swcom.repository.MessagingPlatformConfigRepository;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Component
@ConditionalOnProperty(name = "messaging.telegram.enabled", havingValue = "true")
@Slf4j
public class TelegramAdapter implements MessagePlatformAdapter {

    private final MessagingProperties.TelegramConfig telegramConfig;
    private volatile WebClient webClient;
    private volatile WebClient fileDownloadClient;
    private final ObjectMapper objectMapper;
    private final StorageConfig storageConfig;
    private final MessagingPlatformConfigRepository platformConfigRepository;

    public TelegramAdapter(MessagingProperties messagingProperties, ObjectMapper objectMapper,
                           StorageConfig storageConfig, MessagingPlatformConfigRepository platformConfigRepository) {
        this.telegramConfig = messagingProperties.getTelegram();
        this.objectMapper = objectMapper;
        this.storageConfig = storageConfig;
        this.platformConfigRepository = platformConfigRepository;

        // 先用环境变量 token 初始化（可能为空，@PostConstruct 会从数据库补充）
        String envToken = telegramConfig.getBotToken();
        if (envToken != null && !envToken.isBlank()) {
            initWebClients(envToken);
        }
    }

    @PostConstruct
    public void init() {
        // 如果环境变量没有 token，尝试从数据库加载
        if (webClient == null) {
            loadTokenFromDatabase();
        }
        if (webClient == null) {
            log.warn("TelegramAdapter 初始化时未找到有效的 Bot Token，等待通过 setup 接口配置");
        }
    }

    private void loadTokenFromDatabase() {
        try {
            Optional<MessagingPlatformConfig> configOpt = platformConfigRepository
                    .findByPlatformTypeAndIsEnabledTrue(PlatformType.TELEGRAM);
            if (configOpt.isPresent()) {
                Map<String, Object> configData = configOpt.get().getConfigData();
                if (configData != null && configData.get("botToken") instanceof String dbToken
                        && !dbToken.isBlank()) {
                    initWebClients(dbToken);
                    log.info("已从数据库加载 Telegram Bot Token");
                }
            }
        } catch (Exception e) {
            log.error("从数据库加载 Telegram Bot Token 失败", e);
        }
    }

    private void initWebClients(String botToken) {
        this.webClient = WebClient.builder()
                .baseUrl("https://api.telegram.org/bot" + botToken)
                .build();
        this.fileDownloadClient = WebClient.builder()
                .baseUrl("https://api.telegram.org/file/bot" + botToken)
                .build();
    }

    /**
     * 动态更新 Bot Token（由 setup 接口调用）
     */
    public void reinitializeWithToken(String botToken) {
        if (botToken == null || botToken.isBlank()) {
            log.warn("reinitializeWithToken 收到空 token，忽略");
            return;
        }
        initWebClients(botToken);
        log.info("TelegramAdapter WebClient 已使用新 token 重新初始化");
    }

    @Override
    public PlatformType getPlatformType() {
        return PlatformType.TELEGRAM;
    }

    @Override
    public void sendMessage(String chatId, String text) {
        try {
            // Split long messages (Telegram limit: 4096 chars)
            if (text.length() > 4096) {
                int start = 0;
                while (start < text.length()) {
                    int end = Math.min(start + 4096, text.length());
                    sendSingleMessage(chatId, text.substring(start, end));
                    start = end;
                }
            } else {
                sendSingleMessage(chatId, text);
            }
        } catch (Exception e) {
            log.error("发送 Telegram 消息失败: chatId={}", chatId, e);
        }
    }

    private void sendSingleMessage(String chatId, String text) {
        if (webClient == null) {
            log.error("Telegram WebClient 未初始化（Bot Token 未配置），无法发送消息");
            return;
        }
        try {
            // 先尝试 Markdown 格式发送
            String response = webClient.post()
                    .uri("/sendMessage")
                    .bodyValue(Map.of(
                            "chat_id", chatId,
                            "text", text,
                            "parse_mode", "Markdown"
                    ))
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();
            log.debug("Telegram 消息发送成功 (Markdown): chatId={}", chatId);
        } catch (Exception e) {
            // Markdown 解析失败时降级为纯文本重发
            log.warn("Telegram Markdown 发送失败，降级为纯文本: chatId={}, error={}", chatId, e.getMessage());
            try {
                String response = webClient.post()
                        .uri("/sendMessage")
                        .bodyValue(Map.of(
                                "chat_id", chatId,
                                "text", text
                        ))
                        .retrieve()
                        .bodyToMono(String.class)
                        .block();
                log.debug("Telegram 消息发送成功 (纯文本): chatId={}", chatId);
            } catch (Exception fallbackErr) {
                log.error("Telegram 纯文本消息也发送失败: chatId={}", chatId, fallbackErr);
                throw fallbackErr;
            }
        }
    }

    @Override
    public IncomingMessage parseIncomingMessage(Object rawPayload) {
        try {
            JsonNode root;
            if (rawPayload instanceof String) {
                root = objectMapper.readTree((String) rawPayload);
            } else {
                root = objectMapper.valueToTree(rawPayload);
            }

            JsonNode message = root.path("message");
            if (message.isMissingNode()) {
                message = root.path("edited_message");
            }
            if (message.isMissingNode()) {
                log.warn("Telegram payload 中没有 message 字段");
                return null;
            }

            JsonNode from = message.path("from");
            String chatId = String.valueOf(message.path("chat").path("id").asLong());
            String userId = String.valueOf(from.path("id").asLong());
            String username = from.has("username") ? from.path("username").asText() : from.path("first_name").asText();
            
            // 检测消息类型并提取相关信息
            String messageType = "TEXT";
            String text = "";
            String fileId = null;
            String fileName = null;
            String fileMimeType = null;
            Long fileSize = null;

            if (message.has("photo")) {
                // 照片消息 - 获取最大尺寸的照片
                messageType = "IMAGE";
                JsonNode photos = message.path("photo");
                JsonNode largestPhoto = photos.get(photos.size() - 1);
                fileId = largestPhoto.path("file_id").asText();
                fileSize = largestPhoto.path("file_size").asLong(0);
                fileMimeType = "image/jpeg";
                text = message.has("caption") ? message.path("caption").asText() : "";
            } else if (message.has("document")) {
                // 文档消息
                messageType = "DOCUMENT";
                JsonNode document = message.path("document");
                fileId = document.path("file_id").asText();
                fileName = document.path("file_name").asText(null);
                fileMimeType = document.path("mime_type").asText(null);
                fileSize = document.path("file_size").asLong(0);
                text = message.has("caption") ? message.path("caption").asText() : "";
            } else if (message.has("text")) {
                // 普通文本消息
                text = message.path("text").asText();
            }

            IncomingMessage incomingMessage = IncomingMessage.builder()
                    .platformType(PlatformType.TELEGRAM)
                    .platformUserId(chatId)
                    .platformUsername(username)
                    .messageText(text)
                    .messageType(messageType)
                    .rawPayload(rawPayload)
                    .fileId(fileId)
                    .fileName(fileName)
                    .fileMimeType(fileMimeType)
                    .fileSize(fileSize)
                    .build();
            
            // 如果有文件，下载到本地
            if (fileId != null) {
                String localPath = downloadFile(fileId, fileName, fileMimeType);
                if (localPath != null) {
                    incomingMessage.setFilePath(localPath);
                    log.info("Telegram 文件下载成功: {}", localPath);
                }
            }

            return incomingMessage;
        } catch (Exception e) {
            log.error("解析 Telegram 消息失败", e);
            return null;
        }
    }

    /**
     * 从 Telegram 下载文件到本地
     */
    public String downloadFile(String fileId, String originalFileName, String mimeType) {
        if (webClient == null || fileDownloadClient == null) {
            log.error("Telegram WebClient 未初始化（Bot Token 未配置），无法下载文件");
            return null;
        }
        try {
            // 1. 获取文件路径
            String response = webClient.get()
                    .uri("/getFile?file_id=" + fileId)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();
            
            JsonNode root = objectMapper.readTree(response);
            if (!root.path("ok").asBoolean(false)) {
                log.error("获取 Telegram 文件信息失败: {}", response);
                return null;
            }
            
            String filePath = root.path("result").path("file_path").asText(null);
            if (filePath == null) {
                log.error("Telegram 响应中没有 file_path");
                return null;
            }
            
            // 2. 确定本地文件名
            String extension = "";
            if (originalFileName != null && originalFileName.contains(".")) {
                extension = originalFileName.substring(originalFileName.lastIndexOf("."));
            } else if (mimeType != null) {
                extension = getExtensionFromMimeType(mimeType);
            }
            String localFileName = UUID.randomUUID().toString() + extension;
            
            // 3. 创建目录
            Path uploadPath = Paths.get(storageConfig.getUploadDir(), "telegram");
            Files.createDirectories(uploadPath);
            Path localFile = uploadPath.resolve(localFileName);
            
            // 4. 下载文件
            Flux<DataBuffer> dataBufferFlux = fileDownloadClient.get()
                    .uri("/" + filePath)
                    .retrieve()
                    .bodyToFlux(DataBuffer.class);
            
            DataBufferUtils.write(dataBufferFlux, localFile, StandardOpenOption.CREATE).block();
            
            // 返回相对于 uploadDir 的路径，例如 "telegram/xxx.pdf"
            String relativePath = "telegram/" + localFileName;
            log.info("文件下载完成: {} -> {} (relative: {})", fileId, localFile, relativePath);
            return relativePath;
        } catch (Exception e) {
            log.error("下载 Telegram 文件失败: fileId={}", fileId, e);
            return null;
        }
    }
    
    private String getExtensionFromMimeType(String mimeType) {
        if (mimeType == null) return "";
        return switch (mimeType.toLowerCase()) {
            case "image/jpeg" -> ".jpg";
            case "image/png" -> ".png";
            case "image/gif" -> ".gif";
            case "image/webp" -> ".webp";
            case "application/pdf" -> ".pdf";
            case "application/msword" -> ".doc";
            case "application/vnd.openxmlformats-officedocument.wordprocessingml.document" -> ".docx";
            case "application/vnd.ms-excel" -> ".xls";
            case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" -> ".xlsx";
            default -> "";
        };
    }

    @Override
    public boolean validateWebhookSignature(String secretToken, String body) {
        if (telegramConfig.getWebhookSecret() == null || telegramConfig.getWebhookSecret().isEmpty()) {
            return true; // no secret configured, skip validation
        }
        return telegramConfig.getWebhookSecret().equals(secretToken);
    }

    /**
     * 调用 Telegram getMe API 获取 bot username
     */
    public Optional<String> getBotUsername() {
        if (webClient == null) {
            log.error("Telegram WebClient 未初始化（Bot Token 未配置）");
            return Optional.empty();
        }
        try {
            String response = webClient.get()
                    .uri("/getMe")
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();
            JsonNode root = objectMapper.readTree(response);
            if (root.path("ok").asBoolean(false)) {
                String username = root.path("result").path("username").asText(null);
                if (username != null) {
                    log.info("获取 Telegram bot username: {}", username);
                    return Optional.of(username);
                }
            }
            log.warn("getMe 响应异常: {}", response);
            return Optional.empty();
        } catch (Exception e) {
            log.error("调用 Telegram getMe 失败", e);
            return Optional.empty();
        }
    }

    /**
     * 调用 Telegram setWebhook API 注册 webhook
     */
    public boolean registerWebhook(String webhookUrl) {
        if (webClient == null) {
            log.error("Telegram WebClient 未初始化（Bot Token 未配置），无法注册 webhook");
            return false;
        }
        try {
            Map<String, Object> body = new java.util.HashMap<>();
            body.put("url", webhookUrl);
            if (telegramConfig.getWebhookSecret() != null && !telegramConfig.getWebhookSecret().isEmpty()) {
                body.put("secret_token", telegramConfig.getWebhookSecret());
            }

            String response = webClient.post()
                    .uri("/setWebhook")
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();
            JsonNode root = objectMapper.readTree(response);
            boolean ok = root.path("ok").asBoolean(false);
            if (ok) {
                log.info("Telegram webhook 注册成功: {}", webhookUrl);
            } else {
                log.error("Telegram webhook 注册失败: {}", response);
            }
            return ok;
        } catch (Exception e) {
            log.error("调用 Telegram setWebhook 失败", e);
            return false;
        }
    }
}
