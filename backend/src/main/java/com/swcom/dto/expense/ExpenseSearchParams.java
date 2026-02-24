package com.swcom.dto.expense;

import com.swcom.entity.enums.ExpenseCategory;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExpenseSearchParams {
    private LocalDate startDate;
    private LocalDate endDate;
    private ExpenseCategory category;
    private UUID projectId;
}
