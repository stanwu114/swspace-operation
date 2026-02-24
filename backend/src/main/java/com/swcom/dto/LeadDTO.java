package com.swcom.dto;

import com.swcom.entity.enums.LeadStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeadDTO {
    private UUID id;
    private String leadName;
    private String sourceChannel;
    private String customerName;
    private String contactPerson;
    private String contactPhone;
    private BigDecimal estimatedAmount;
    private String description;
    private List<String> tags;
    private LeadStatus status;
    private UUID ownerId;
    private String ownerName;
    private int logCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
