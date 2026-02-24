package com.swcom.dto;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeadTrackingLogDTO {
    private UUID id;
    private UUID leadId;
    private LocalDate logDate;
    private String logTitle;
    private String logContent;
    private UUID createdById;
    private String createdByName;
    private LocalDateTime createdAt;
}
