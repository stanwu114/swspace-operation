package com.swcom.dto.messaging;

import com.swcom.entity.enums.PlatformType;
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
public class UserBindingDTO {

    private UUID id;
    private UUID employeeId;
    private String employeeName;
    private PlatformType platformType;
    private String platformUserId;
    private String platformUsername;
    private String bindingStatus;
    private LocalDateTime boundAt;
    private LocalDateTime createdAt;
}
