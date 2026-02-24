package com.swcom.dto.expense;

import com.swcom.entity.enums.ExpenseCategory;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExpenseDTO {
    private UUID id;
    private LocalDate expenseDate;
    private ExpenseCategory category;
    private String categoryDisplayName;
    private BigDecimal amount;
    private BigDecimal taxRate;
    private BigDecimal taxAmount;
    private BigDecimal amountWithTax;
    private UUID projectId;
    private String projectName;
    private String description;
    private UUID createdById;
    private String createdByName;
    private int attachmentCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
