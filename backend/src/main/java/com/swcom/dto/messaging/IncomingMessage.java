package com.swcom.dto.messaging;

import com.swcom.entity.enums.PlatformType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IncomingMessage {

    private PlatformType platformType;
    private String platformUserId;
    private String platformUsername;
    private String messageText;
    private String messageType;  // TEXT, IMAGE, DOCUMENT
    private Object rawPayload;
    
    // 文件相关字段
    private String fileId;       // Telegram 文件ID
    private String fileName;     // 文件名
    private String fileMimeType; // MIME类型
    private Long fileSize;       // 文件大小
    private String filePath;     // 下载后的本地路径
}
