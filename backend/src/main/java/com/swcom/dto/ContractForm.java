package com.swcom.dto;

import com.swcom.entity.enums.ContractType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
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
public class ContractForm {

    @NotBlank(message = "Party A is required")
    private String partyA;

    @NotBlank(message = "Party B is required")
    private String partyB;

    @NotNull(message = "Contract type is required")
    private ContractType contractType;

    @NotNull(message = "Amount is required")
    @Positive(message = "Amount must be positive")
    private BigDecimal amount;

    private UUID projectId;

    private String subcontractEntity;

    private LocalDate signingDate;
}
