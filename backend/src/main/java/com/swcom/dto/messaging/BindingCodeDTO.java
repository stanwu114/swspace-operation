package com.swcom.dto.messaging;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BindingCodeDTO {

    private UUID employeeId;
    private String bindingCode;
    private LocalDateTime expiresAt;
    private String deepLinkUrl;
}
