package com.swcom.dto;

import com.swcom.entity.enums.PaymentNodeStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentNodeDTO {
    private UUID id;
    private UUID contractId;
    private String nodeName;
    private Integer nodeOrder;
    private BigDecimal plannedAmount;
    private LocalDate plannedDate;
    private BigDecimal actualAmount;
    private LocalDate actualDate;
    private PaymentNodeStatus status;
    private String remarks;
}
