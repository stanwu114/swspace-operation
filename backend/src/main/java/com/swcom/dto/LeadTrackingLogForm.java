package com.swcom.dto;

import jakarta.validation.constraints.*;
import lombok.*;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeadTrackingLogForm {

    @NotNull(message = "日期不能为空")
    private LocalDate logDate;

    @NotBlank(message = "标题不能为空")
    @Size(max = 200, message = "标题不能超过200个字符")
    private String logTitle;

    @NotBlank(message = "内容不能为空")
    private String logContent;
}
