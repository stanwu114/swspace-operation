package com.swcom.dto;

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
public class BidInfoDTO {
    private UUID id;
    private UUID contractId;
    private String bidUnit;
    private LocalDate bidAnnounceDate;
    private String bidAnnounceDocPath;
    private LocalDate bidSubmitDate;
    private String bidSubmitDocPath;
    private LocalDate winDate;
    private String winDocPath;
}
