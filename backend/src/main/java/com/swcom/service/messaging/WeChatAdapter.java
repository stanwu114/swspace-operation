package com.swcom.service.messaging;

import com.fasterxml.jackson.dataformat.xml.XmlMapper;
import com.swcom.config.MessagingProperties;
import com.swcom.dto.messaging.IncomingMessage;
import com.swcom.entity.enums.PlatformType;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Arrays;
import java.util.Map;

@Component
@ConditionalOnProperty(name = "messaging.wechat.enabled", havingValue = "true")
@Slf4j
public class WeChatAdapter implements MessagePlatformAdapter {

    private final MessagingProperties.WeChatConfig wechatConfig;
    private final WebClient webClient;
    private final XmlMapper xmlMapper;
    private volatile String accessToken;
    private volatile long tokenExpiresAt;

    public WeChatAdapter(MessagingProperties messagingProperties) {
        this.wechatConfig = messagingProperties.getWechat();
        this.xmlMapper = new XmlMapper();
        this.webClient = WebClient.builder()
                .baseUrl("https://api.weixin.qq.com")
                .build();
    }

    @Override
    public PlatformType getPlatformType() {
        return PlatformType.WECHAT;
    }

    @Override
    public void sendMessage(String openId, String text) {
        try {
            String token = getAccessToken();
            Map<String, Object> body = Map.of(
                    "touser", openId,
                    "msgtype", "text",
                    "text", Map.of("content", text)
            );

            webClient.post()
                    .uri("/cgi-bin/message/custom/send?access_token=" + token)
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(String.class)
                    .doOnError(e -> log.error("发送微信消息失败: openId={}", openId, e))
                    .subscribe(response -> log.debug("微信消息发送: {}", response));
        } catch (Exception e) {
            log.error("发送微信消息失败: openId={}", openId, e);
        }
    }

    @Override
    @SuppressWarnings("unchecked")
    public IncomingMessage parseIncomingMessage(Object rawPayload) {
        try {
            String xml = (String) rawPayload;
            Map<String, String> map = xmlMapper.readValue(xml, Map.class);

            String fromUser = map.get("FromUserName");
            String msgType = map.getOrDefault("MsgType", "text");
            String content = map.getOrDefault("Content", "");

            return IncomingMessage.builder()
                    .platformType(PlatformType.WECHAT)
                    .platformUserId(fromUser)
                    .platformUsername(fromUser)
                    .messageText(content)
                    .messageType(msgType.toUpperCase())
                    .rawPayload(rawPayload)
                    .build();
        } catch (Exception e) {
            log.error("解析微信消息失败", e);
            return null;
        }
    }

    @Override
    public boolean validateWebhookSignature(String signature, String body) {
        // WeChat uses a different verification, handled in verifySignature
        return true;
    }

    public boolean verifySignature(String signature, String timestamp, String nonce) {
        try {
            String token = wechatConfig.getToken();
            String[] arr = {token, timestamp, nonce};
            Arrays.sort(arr);
            String combined = String.join("", arr);

            MessageDigest md = MessageDigest.getInstance("SHA-1");
            byte[] digest = md.digest(combined.getBytes(StandardCharsets.UTF_8));

            StringBuilder sb = new StringBuilder();
            for (byte b : digest) {
                sb.append(String.format("%02x", b));
            }

            return sb.toString().equals(signature);
        } catch (Exception e) {
            log.error("微信签名验证失败", e);
            return false;
        }
    }

    private synchronized String getAccessToken() {
        if (accessToken != null && System.currentTimeMillis() < tokenExpiresAt) {
            return accessToken;
        }

        try {
            String response = webClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/cgi-bin/token")
                            .queryParam("grant_type", "client_credential")
                            .queryParam("appid", wechatConfig.getAppId())
                            .queryParam("secret", wechatConfig.getAppSecret())
                            .build())
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            if (response != null) {
                com.fasterxml.jackson.databind.ObjectMapper objectMapper = new com.fasterxml.jackson.databind.ObjectMapper();
                var node = objectMapper.readTree(response);
                if (node.has("access_token")) {
                    accessToken = node.get("access_token").asText();
                    int expiresIn = node.get("expires_in").asInt();
                    tokenExpiresAt = System.currentTimeMillis() + (expiresIn - 300) * 1000L; // 提前5分钟刷新
                    return accessToken;
                } else {
                    log.error("获取微信 access_token 失败: {}", response);
                }
            }
        } catch (Exception e) {
            log.error("获取微信 access_token 异常", e);
        }

        return accessToken; // return cached if refresh fails
    }
}
