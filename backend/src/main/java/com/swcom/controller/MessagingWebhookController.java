package com.swcom.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.swcom.config.MessagingProperties;
import com.swcom.dto.messaging.IncomingMessage;
import com.swcom.service.messaging.MessageRoutingService;
import com.swcom.service.messaging.TelegramAdapter;
import com.swcom.service.messaging.WeChatAdapter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/webhook")
@Slf4j
@ConditionalOnProperty(name = "messaging.enabled", havingValue = "true", matchIfMissing = true)
public class MessagingWebhookController {

    private final MessageRoutingService routingService;
    private final Optional<TelegramAdapter> telegramAdapter;
    private final Optional<WeChatAdapter> weChatAdapter;
    private final MessagingProperties messagingProperties;
    private final ObjectMapper objectMapper;

    public MessagingWebhookController(MessageRoutingService routingService,
                                       Optional<TelegramAdapter> telegramAdapter,
                                       Optional<WeChatAdapter> weChatAdapter,
                                       MessagingProperties messagingProperties,
                                       ObjectMapper objectMapper) {
        this.routingService = routingService;
        this.telegramAdapter = telegramAdapter;
        this.weChatAdapter = weChatAdapter;
        this.messagingProperties = messagingProperties;
        this.objectMapper = objectMapper;
    }

    /**
     * Telegram webhook endpoint
     */
    @PostMapping("/telegram")
    public ResponseEntity<String> telegramWebhook(
            @RequestHeader(value = "X-Telegram-Bot-Api-Secret-Token", required = false) String secretToken,
            @RequestBody Map<String, Object> payload) {

        if (telegramAdapter.isEmpty()) {
            return ResponseEntity.badRequest().body("Telegram 适配器未启用");
        }

        // Validate webhook signature
        if (!telegramAdapter.get().validateWebhookSignature(secretToken, null)) {
            log.warn("Telegram webhook 签名验证失败");
            return ResponseEntity.status(403).body("Forbidden");
        }

        try {
            IncomingMessage message = telegramAdapter.get().parseIncomingMessage(payload);
            if (message != null) {
                routingService.handleIncomingMessage(message);
            }
        } catch (Exception e) {
            log.error("处理 Telegram webhook 失败", e);
        }

        return ResponseEntity.ok("OK");
    }

    /**
     * WeChat webhook verification endpoint (GET)
     */
    @GetMapping("/wechat")
    public ResponseEntity<String> wechatVerify(
            @RequestParam("signature") String signature,
            @RequestParam("timestamp") String timestamp,
            @RequestParam("nonce") String nonce,
            @RequestParam("echostr") String echostr) {

        if (weChatAdapter.isEmpty()) {
            return ResponseEntity.badRequest().body("WeChat 适配器未启用");
        }

        if (weChatAdapter.get().verifySignature(signature, timestamp, nonce)) {
            return ResponseEntity.ok(echostr);
        }
        return ResponseEntity.status(403).body("签名验证失败");
    }

    /**
     * WeChat webhook message endpoint (POST)
     */
    @PostMapping(value = "/wechat", consumes = {MediaType.TEXT_XML_VALUE, MediaType.APPLICATION_XML_VALUE},
            produces = MediaType.TEXT_XML_VALUE)
    public ResponseEntity<String> wechatMessage(@RequestBody String xmlPayload) {

        if (weChatAdapter.isEmpty()) {
            return ResponseEntity.badRequest().body("WeChat 适配器未启用");
        }

        try {
            IncomingMessage message = weChatAdapter.get().parseIncomingMessage(xmlPayload);
            if (message != null) {
                routingService.handleIncomingMessage(message);
            }
        } catch (Exception e) {
            log.error("处理 WeChat webhook 失败", e);
        }

        return ResponseEntity.ok("success");
    }
}
