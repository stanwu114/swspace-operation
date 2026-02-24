package com.swcom.entity.enums;

public enum ProcessingStatus {
    RECEIVED,
    PENDING,    // 待前端处理
    PROCESSING,
    COMPLETED,
    FAILED
}
