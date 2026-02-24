package com.swcom.dto.expense;

import com.swcom.entity.enums.ExpenseCategory;
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
public class ExpenseForm {
    
    @NotNull(message = "费用日期不能为空")
    private LocalDate expenseDate;
    
    @NotNull(message = "费用类别不能为空")
    private ExpenseCategory category;
    
    @NotNull(message = "费用金额不能为空")
    @Positive(message = "费用金额必须大于0")
    private BigDecimal amount;
    
    private BigDecimal taxRate;
    
    private UUID projectId;
    
    private String description;
    
    private UUID createdById;
}
