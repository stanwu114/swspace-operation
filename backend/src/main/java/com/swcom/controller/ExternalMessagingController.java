package com.swcom.controller;

import com.swcom.dto.ApiResponse;
import com.swcom.dto.messaging.*;
import com.swcom.config.MessagingProperties;
import com.swcom.entity.ExternalMessageLog;
import com.swcom.entity.MessagingPlatformConfig;
import com.swcom.entity.enums.PlatformType;
import com.swcom.entity.enums.ProcessingStatus;
import com.swcom.repository.AsyncMessageTaskRepository;
import com.swcom.repository.ExternalMessageLogRepository;
import com.swcom.repository.MessagingPlatformConfigRepository;
import com.swcom.service.messaging.UserBindingService;
import com.swcom.service.messaging.MessageRoutingService;
import com.swcom.service.messaging.TelegramAdapter;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/external-messaging")
@Slf4j
@ConditionalOnProperty(name = "messaging.enabled", havingValue = "true", matchIfMissing = true)
public class ExternalMessagingController {

    private final MessagingPlatformConfigRepository platformConfigRepository;
    private final UserBindingService userBindingService;
    private final ExternalMessageLogRepository messageLogRepository;
    private final AsyncMessageTaskRepository taskRepository;
    private final MessagingProperties messagingProperties;
    private final MessageRoutingService messageRoutingService;
    private final ObjectMapper objectMapper;
    private final TelegramAdapter telegramAdapter; // nullable if Telegram not enabled

    public ExternalMessagingController(MessagingPlatformConfigRepository platformConfigRepository,
                                       UserBindingService userBindingService,
                                       ExternalMessageLogRepository messageLogRepository,
                                       AsyncMessageTaskRepository taskRepository,
                                       MessagingProperties messagingProperties,
                                       MessageRoutingService messageRoutingService,
                                       ObjectMapper objectMapper,
                                       @org.springframework.beans.factory.annotation.Autowired(required = false) TelegramAdapter telegramAdapter) {
        this.platformConfigRepository = platformConfigRepository;
        this.userBindingService = userBindingService;
        this.messageLogRepository = messageLogRepository;
        this.taskRepository = taskRepository;
        this.messagingProperties = messagingProperties;
        this.messageRoutingService = messageRoutingService;
        this.objectMapper = objectMapper;
        this.telegramAdapter = telegramAdapter;
    }

    // ========== Platform Config ==========

    @GetMapping("/platforms")
    public ResponseEntity<ApiResponse<List<PlatformConfigDTO>>> getPlatforms() {
        List<PlatformConfigDTO> list = platformConfigRepository.findAll().stream()
                .map(this::toPlatformConfigDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @PostMapping("/platforms")
    public ResponseEntity<ApiResponse<PlatformConfigDTO>> savePlatform(@RequestBody PlatformConfigDTO dto) {
        MessagingPlatformConfig config;
        if (dto.getId() != null) {
            config = platformConfigRepository.findById(dto.getId())
                    .orElseThrow(() -> new RuntimeException("平台配置不存在"));
        } else {
            config = new MessagingPlatformConfig();
        }
        config.setPlatformType(dto.getPlatformType());
        config.setPlatformName(dto.getPlatformName());
        config.setConfigData(dto.getConfigData());
        config.setWebhookUrl(dto.getWebhookUrl());
        config.setIsEnabled(dto.getIsEnabled() != null ? dto.getIsEnabled() : true);
        config = platformConfigRepository.save(config);
        return ResponseEntity.ok(ApiResponse.success(toPlatformConfigDTO(config)));
    }

    @PutMapping("/platforms/{id}/toggle")
    public ResponseEntity<ApiResponse<PlatformConfigDTO>> togglePlatform(@PathVariable UUID id) {
        MessagingPlatformConfig config = platformConfigRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("平台配置不存在"));
        config.setIsEnabled(!config.getIsEnabled());
        config = platformConfigRepository.save(config);
        return ResponseEntity.ok(ApiResponse.success(toPlatformConfigDTO(config)));
    }

    // ========== Telegram Setup ==========

    /**
     * 初始化 Telegram Bot: 验证 token、获取 bot username、注册 webhook。
     * 不依赖 TelegramAdapter bean（首次配置时该 bean 不存在）。
     */
    @PostMapping("/platforms/telegram/setup")
    public ResponseEntity<ApiResponse<Map<String, Object>>> setupTelegram(@RequestBody Map<String, String> request) {
        String botToken = request.get("botToken");
        String webhookSecret = request.get("webhookSecret");
        String requestWebhookUrl = request.get("webhookUrl");

        if (botToken == null || botToken.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.badRequest("Bot Token 不能为空"));
        }

        WebClient client = WebClient.builder()
                .baseUrl("https://api.telegram.org/bot" + botToken)
                .build();

        // Step 1: Call getMe to validate token and get bot username
        String botUsername;
        try {
            String getMeResp = client.get().uri("/getMe").retrieve()
                    .bodyToMono(String.class).block();
            JsonNode getMeRoot = objectMapper.readTree(getMeResp);
            if (!getMeRoot.path("ok").asBoolean(false)) {
                return ResponseEntity.badRequest().body(
                        ApiResponse.badRequest("Bot Token 无效: " + getMeRoot.path("description").asText()));
            }
            botUsername = getMeRoot.path("result").path("username").asText(null);
            if (botUsername == null) {
                return ResponseEntity.badRequest().body(ApiResponse.badRequest("无法获取 Bot Username"));
            }
            log.info("Telegram Bot 验证成功: @{}", botUsername);
        } catch (Exception e) {
            log.error("调用 Telegram getMe 失败", e);
            return ResponseEntity.badRequest().body(
                    ApiResponse.badRequest("调用 Telegram API 失败: " + e.getMessage()));
        }

        // Step 2: Register webhook (prioritize request webhookUrl over env config)
        String webhookBaseUrl = (requestWebhookUrl != null && !requestWebhookUrl.isBlank())
                ? requestWebhookUrl
                : messagingProperties.getTelegram().getWebhookBaseUrl();
        String registeredWebhookUrl = null;
        if (webhookBaseUrl != null && !webhookBaseUrl.isBlank()) {
            String fullWebhookUrl = webhookBaseUrl.replaceAll("/$", "") + "/api/webhook/telegram";
            try {
                Map<String, Object> webhookBody = new HashMap<>();
                webhookBody.put("url", fullWebhookUrl);
                if (webhookSecret != null && !webhookSecret.isBlank()) {
                    webhookBody.put("secret_token", webhookSecret);
                }

                String setWebhookResp = client.post().uri("/setWebhook")
                        .bodyValue(webhookBody).retrieve()
                        .bodyToMono(String.class).block();
                JsonNode whRoot = objectMapper.readTree(setWebhookResp);
                if (whRoot.path("ok").asBoolean(false)) {
                    registeredWebhookUrl = fullWebhookUrl;
                    log.info("Telegram Webhook 注册成功: {}", fullWebhookUrl);
                } else {
                    log.warn("Telegram Webhook 注册失败: {}", setWebhookResp);
                }
            } catch (Exception e) {
                log.error("调用 Telegram setWebhook 失败", e);
            }
        }

        // Step 3: Save bot username into platform config
        try {
            // Use findAll + filter to avoid IncorrectResultSizeDataAccessException
            Optional<MessagingPlatformConfig> existingOpt = platformConfigRepository.findAll().stream()
                    .filter(c -> c.getPlatformType() == PlatformType.TELEGRAM)
                    .findFirst();
            MessagingPlatformConfig config = existingOpt.orElse(new MessagingPlatformConfig());
            config.setPlatformType(PlatformType.TELEGRAM);
            config.setPlatformName("Telegram Bot");
            Map<String, Object> configData = config.getConfigData() != null
                    ? new HashMap<>(config.getConfigData()) : new HashMap<>();
            configData.put("botToken", botToken);
            configData.put("botUsername", botUsername);
            if (webhookSecret != null && !webhookSecret.isBlank()) {
                configData.put("webhookSecret", webhookSecret);
            }
            // Save webhookBaseUrl for display in UI
            if (webhookBaseUrl != null && !webhookBaseUrl.isBlank()) {
                configData.put("webhookBaseUrl", webhookBaseUrl);
            }
            config.setConfigData(configData);
            if (registeredWebhookUrl != null) {
                config.setWebhookUrl(registeredWebhookUrl);
            }
            config.setIsEnabled(true);
            platformConfigRepository.save(config);

            // 动态刷新 TelegramAdapter 的 WebClient，使其立即使用新 token
            if (telegramAdapter != null) {
                telegramAdapter.reinitializeWithToken(botToken);
            }
        } catch (Exception e) {
            log.error("保存 Telegram 平台配置失败", e);
            // Bot verified ok, but DB save failed - still return partial success
        }

        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("botUsername", botUsername);
        result.put("webhookUrl", registeredWebhookUrl);
        result.put("message", registeredWebhookUrl != null
                ? "Bot 验证成功，Webhook 已注册"
                : "Bot 验证成功，但 Webhook Base URL 未配置，需手动注册 Webhook");
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    // ========== User Bindings ==========

    @PostMapping("/bindings/generate")
    public ResponseEntity<ApiResponse<BindingCodeDTO>> generateBindingCode(@RequestBody Map<String, String> request) {
        UUID employeeId = UUID.fromString(request.get("employeeId"));
        BindingCodeDTO code = userBindingService.generateBindingCode(employeeId);
        return ResponseEntity.ok(ApiResponse.success(code));
    }

    @GetMapping("/bindings")
    public ResponseEntity<ApiResponse<List<UserBindingDTO>>> getBindings(
            @RequestParam(required = false) UUID employeeId) {
        List<UserBindingDTO> bindings;
        if (employeeId != null) {
            bindings = userBindingService.getBindingsByEmployee(employeeId);
        } else {
            bindings = userBindingService.getAllBindings();
        }
        return ResponseEntity.ok(ApiResponse.success(bindings));
    }

    @DeleteMapping("/bindings/{id}")
    public ResponseEntity<ApiResponse<Void>> revokeBinding(@PathVariable UUID id) {
        userBindingService.revokeBinding(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    // ========== Message Logs ==========

    @GetMapping("/messages")
    public ResponseEntity<ApiResponse<Page<MessageLogDTO>>> getMessages(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<ExternalMessageLog> logs = messageLogRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(page, size));
        Page<MessageLogDTO> dtos = logs.map(this::toMessageLogDTO);
        return ResponseEntity.ok(ApiResponse.success(dtos));
    }

    // ========== Pending Messages for Frontend Processing ==========

    /**
     * 获取待处理的 Telegram 消息（前端轮询获取）
     */
    @GetMapping("/messages/pending")
    public ResponseEntity<ApiResponse<List<PendingMessageDTO>>> getPendingMessages() {
        List<ExternalMessageLog> pendingLogs = messageLogRepository.findByProcessingStatus(ProcessingStatus.PENDING);
        List<PendingMessageDTO> dtos = pendingLogs.stream()
                .map(this::toPendingMessageDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(dtos));
    }

    /**
     * 标记消息处理中
     */
    @PostMapping("/messages/{id}/processing")
    public ResponseEntity<ApiResponse<Void>> markMessageProcessing(@PathVariable UUID id) {
        ExternalMessageLog log = messageLogRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("消息不存在"));
        log.setProcessingStatus(ProcessingStatus.PROCESSING);
        messageLogRepository.save(log);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    /**
     * 发送回复到 Telegram 并标记消息完成
     */
    @PostMapping("/messages/{id}/reply")
    public ResponseEntity<ApiResponse<Void>> replyToMessage(
            @PathVariable UUID id,
            @RequestBody Map<String, String> request) {
        String replyContent = request.get("content");
        if (replyContent == null || replyContent.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.badRequest("回复内容不能为空"));
        }

        ExternalMessageLog inboundLog = messageLogRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("消息不存在"));

        // 发送回复到 Telegram
        if (inboundLog.getBinding() != null) {
            String platformUserId = inboundLog.getBinding().getPlatformUserId();
            messageRoutingService.sendReplyToUser(
                    inboundLog.getPlatformType(),
                    platformUserId,
                    replyContent
            );

            // 记录出站消息
            ExternalMessageLog outboundLog = ExternalMessageLog.builder()
                    .binding(inboundLog.getBinding())
                    .platformType(inboundLog.getPlatformType())
                    .direction(com.swcom.entity.enums.MessageDirection.OUTBOUND)
                    .content(replyContent)
                    .processingStatus(ProcessingStatus.COMPLETED)
                    .processedAt(java.time.LocalDateTime.now())
                    .build();
            messageLogRepository.save(outboundLog);
        }

        // 标记入站消息完成
        inboundLog.setProcessingStatus(ProcessingStatus.COMPLETED);
        inboundLog.setProcessedAt(java.time.LocalDateTime.now());
        messageLogRepository.save(inboundLog);

        return ResponseEntity.ok(ApiResponse.success(null));
    }

    // ========== Status ==========

    @GetMapping("/status")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getStatus() {
        long totalBindings = userBindingService.getAllBindings().size();
        long totalMessages = messageLogRepository.count();
        long pendingTasks = taskRepository.countByStatus(com.swcom.entity.enums.AsyncTaskStatus.PENDING);
        List<MessagingPlatformConfig> platforms = platformConfigRepository.findByIsEnabledTrue();

        Map<String, Object> status = new HashMap<>();
        status.put("totalBindings", totalBindings);
        status.put("totalMessages", totalMessages);
        status.put("pendingAsyncTasks", pendingTasks);
        status.put("enabledPlatforms", platforms.stream()
                .map(p -> p.getPlatformType().name())
                .collect(Collectors.toList()));
        return ResponseEntity.ok(ApiResponse.success(status));
    }

    // ========== DTO Converters ==========

    private PlatformConfigDTO toPlatformConfigDTO(MessagingPlatformConfig config) {
        return PlatformConfigDTO.builder()
                .id(config.getId())
                .platformType(config.getPlatformType())
                .platformName(config.getPlatformName())
                .configData(config.getConfigData())
                .webhookUrl(config.getWebhookUrl())
                .isEnabled(config.getIsEnabled())
                .createdAt(config.getCreatedAt())
                .updatedAt(config.getUpdatedAt())
                .build();
    }

    private MessageLogDTO toMessageLogDTO(ExternalMessageLog log) {
        return MessageLogDTO.builder()
                .id(log.getId())
                .bindingId(log.getBinding() != null ? log.getBinding().getId() : null)
                .platformType(log.getPlatformType())
                .conversationId(log.getConversation() != null ? log.getConversation().getId() : null)
                .direction(log.getDirection())
                .messageType(log.getMessageType())
                .content(log.getContent())
                .processingStatus(log.getProcessingStatus())
                .errorMessage(log.getErrorMessage())
                .processedAt(log.getProcessedAt())
                .createdAt(log.getCreatedAt())
                .build();
    }

    private PendingMessageDTO toPendingMessageDTO(ExternalMessageLog log) {
        return PendingMessageDTO.builder()
                .id(log.getId())
                .platformType(log.getPlatformType())
                .platformUserId(log.getBinding() != null ? log.getBinding().getPlatformUserId() : null)
                .employeeId(log.getBinding() != null && log.getBinding().getEmployee() != null 
                        ? log.getBinding().getEmployee().getId() : null)
                .employeeName(log.getBinding() != null && log.getBinding().getEmployee() != null 
                        ? log.getBinding().getEmployee().getName() : null)
                .content(log.getContent())
                .messageType(log.getMessageType())
                .filePath(log.getFilePath())
                .fileName(log.getFileName())
                .fileType(log.getFileType())
                .createdAt(log.getCreatedAt())
                .build();
    }
}
