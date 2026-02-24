package com.swcom.service.messaging;

import com.swcom.dto.messaging.IncomingMessage;
import com.swcom.entity.ExternalMessageLog;
import com.swcom.entity.ExternalUserBinding;
import com.swcom.entity.enums.MessageDirection;
import com.swcom.entity.enums.PlatformType;
import com.swcom.entity.enums.ProcessingStatus;
import com.swcom.repository.ExternalMessageLogRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Slf4j
public class MessageRoutingService {

    private final UserBindingService userBindingService;
    private final ExternalMessageLogRepository messageLogRepository;
    private final Map<PlatformType, MessagePlatformAdapter> adapters = new ConcurrentHashMap<>();

    public MessageRoutingService(UserBindingService userBindingService,
                                 ExternalMessageLogRepository messageLogRepository,
                                 List<MessagePlatformAdapter> adapterList) {
        this.userBindingService = userBindingService;
        this.messageLogRepository = messageLogRepository;
        adapterList.forEach(adapter -> adapters.put(adapter.getPlatformType(), adapter));
        log.info("已注册消息平台适配器: {}", adapters.keySet());
    }

    @Transactional
    public void handleIncomingMessage(IncomingMessage message) {
        PlatformType platform = message.getPlatformType();
        String platformUserId = message.getPlatformUserId();
        String text = message.getMessageText();
        String messageType = message.getMessageType();

        log.info("收到外部消息: platform={}, user={}, type={}, text={}", platform, platformUserId, messageType,
                text != null && text.length() > 50 ? text.substring(0, 50) + "..." : text);

        // Log inbound message with file info
        ExternalMessageLog inboundLog = ExternalMessageLog.builder()
                .platformType(platform)
                .direction(MessageDirection.INBOUND)
                .content(text)
                .messageType(messageType)
                .filePath(message.getFilePath())
                .fileName(message.getFileName())
                .fileType(message.getFileMimeType())
                .processingStatus(ProcessingStatus.RECEIVED)
                .build();

        // Check for bind command: /start <code> (deep linking) or /bind <code> (manual)
        if (text != null && text.startsWith("/start ")) {
            String code = text.substring(7).trim();
            if (!code.isEmpty()) {
                handleBindCommand(platform, platformUserId, message.getPlatformUsername(), code, inboundLog);
                return;
            }
        }
        if (text != null && text.equals("/start")) {
            sendReply(platform, platformUserId,
                    "欢迎使用 S&W AI 助手! 请通过管理系统获取绑定链接进行绑定。\n" +
                    "或使用命令: /bind <绑定码>");
            inboundLog.setProcessingStatus(ProcessingStatus.COMPLETED);
            messageLogRepository.save(inboundLog);
            return;
        }
        if (text != null && text.startsWith("/bind ")) {
            String code = text.substring(6).trim();
            handleBindCommand(platform, platformUserId, message.getPlatformUsername(), code, inboundLog);
            return;
        }

        // Find active binding
        Optional<ExternalUserBinding> bindingOpt = userBindingService.findActiveBinding(platform, platformUserId);
        if (bindingOpt.isEmpty()) {
            log.warn("未绑定用户尝试发送消息: platform={}, user={}", platform, platformUserId);
            sendReply(platform, platformUserId, "您尚未绑定员工账号。请先使用 /bind <绑定码> 命令进行绑定。");
            inboundLog.setProcessingStatus(ProcessingStatus.FAILED);
            inboundLog.setErrorMessage("用户未绑定");
            messageLogRepository.save(inboundLog);
            return;
        }

        ExternalUserBinding binding = bindingOpt.get();
        inboundLog.setBinding(binding);
        messageLogRepository.save(inboundLog);

        // Rate limiting check
        long recentCount = messageLogRepository.countByBindingIdSince(
                binding.getId(), LocalDateTime.now().minusMinutes(1));
        if (recentCount > 20) {
            sendReply(platform, platformUserId, "您的消息发送太频繁，请稍后再试。");
            inboundLog.setProcessingStatus(ProcessingStatus.FAILED);
            inboundLog.setErrorMessage("超出速率限制");
            messageLogRepository.save(inboundLog);
            return;
        }

        // 存储消息，标记为待处理（前端将轮询获取并处理）
        inboundLog.setProcessingStatus(ProcessingStatus.PENDING);
        messageLogRepository.save(inboundLog);
        log.info("Telegram 消息已存储，等待前端处理: bindingId={}", binding.getId());
    }

    private void handleBindCommand(PlatformType platform, String platformUserId,
                                   String platformUsername, String code, ExternalMessageLog inboundLog) {
        Optional<ExternalUserBinding> result = userBindingService.validateAndBind(
                code, platform, platformUserId, platformUsername);

        if (result.isPresent()) {
            inboundLog.setBinding(result.get());
            inboundLog.setProcessingStatus(ProcessingStatus.COMPLETED);
            inboundLog.setProcessedAt(LocalDateTime.now());
            messageLogRepository.save(inboundLog);
            sendReply(platform, platformUserId,
                    "绑定成功! 您已绑定为员工: " + result.get().getEmployee().getName() + "\n现在可以直接发送消息与 AI 助手对话。");
        } else {
            inboundLog.setProcessingStatus(ProcessingStatus.FAILED);
            inboundLog.setErrorMessage("绑定码无效或已过期");
            messageLogRepository.save(inboundLog);
            sendReply(platform, platformUserId, "绑定失败: 绑定码无效或已过期，请联系管理员重新生成。");
        }
    }

    private void sendReply(PlatformType platform, String platformUserId, String text) {
        MessagePlatformAdapter adapter = adapters.get(platform);
        if (adapter != null) {
            adapter.sendMessage(platformUserId, text);
        } else {
            log.error("找不到平台适配器: {}", platform);
        }
    }

    /**
     * 发送回复到指定平台（供外部调用）
     */
    public void sendReplyToUser(PlatformType platform, String platformUserId, String text) {
        sendReply(platform, platformUserId, text);
    }
}
