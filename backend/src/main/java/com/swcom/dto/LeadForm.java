package com.swcom.dto;

import com.swcom.entity.enums.LeadStatus;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeadForm {

    @NotBlank(message = "线索名称不能为空")
    @Size(max = 200, message = "线索名称不能超过200个字符")
    private String leadName;

    @Size(max = 100, message = "来源渠道不能超过100个字符")
    private String sourceChannel;

    @NotBlank(message = "客户名称不能为空")
    @Size(max = 200, message = "客户名称不能超过200个字符")
    private String customerName;

    @Size(max = 100, message = "联系人不能超过100个字符")
    private String contactPerson;

    @Size(max = 50, message = "联系电话不能超过50个字符")
    private String contactPhone;

    @PositiveOrZero(message = "预估金额必须为正数或零")
    private BigDecimal estimatedAmount;

    private String description;

    private List<String> tags;

    private LeadStatus status;

    private UUID ownerId;
}
