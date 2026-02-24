package com.swcom.service.messaging;

import com.swcom.dto.messaging.IncomingMessage;
import com.swcom.entity.enums.PlatformType;

/**
 * Platform adapter interface for external messaging platforms.
 * Each platform (Telegram, WeChat, etc.) implements this interface.
 */
public interface MessagePlatformAdapter {

    PlatformType getPlatformType();

    void sendMessage(String platformUserId, String text);

    IncomingMessage parseIncomingMessage(Object rawPayload);

    boolean validateWebhookSignature(String signature, String body);
}
