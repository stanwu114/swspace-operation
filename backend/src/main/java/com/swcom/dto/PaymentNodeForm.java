package com.swcom.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentNodeForm {

    @NotBlank(message = "Node name is required")
    private String nodeName;

    private Integer nodeOrder;

    @NotNull(message = "Planned amount is required")
    @Positive(message = "Planned amount must be positive")
    private BigDecimal plannedAmount;

    @NotNull(message = "Planned date is required")
    private LocalDate plannedDate;

    private String remarks;
}
