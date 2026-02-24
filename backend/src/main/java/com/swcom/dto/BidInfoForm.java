package com.swcom.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BidInfoForm {
    private String bidUnit;
    private LocalDate bidAnnounceDate;
    private LocalDate bidSubmitDate;
    private LocalDate winDate;
}
