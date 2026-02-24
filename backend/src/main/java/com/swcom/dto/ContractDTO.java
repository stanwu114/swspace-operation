package com.swcom.dto;

import com.swcom.entity.enums.ContractStatus;
import com.swcom.entity.enums.ContractType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContractDTO {
    private UUID id;
    private String contractNo;
    private String partyA;
    private String partyB;
    private ContractType contractType;
    private BigDecimal amount;
    private UUID projectId;
    private String projectName;
    private String subcontractEntity;
    private LocalDate signingDate;
    private String contractFilePath;
    private ContractStatus status;
    private BidInfoDTO bidInfo;
    private List<PaymentNodeDTO> paymentNodes;
    private BigDecimal paidAmount;
    private int completedNodes;
    private int totalNodes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
