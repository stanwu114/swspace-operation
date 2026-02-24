package com.swcom.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "bid_info")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BidInfo {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contract_id", nullable = false, unique = true)
    private Contract contract;

    @Column(name = "bid_unit", length = 200)
    private String bidUnit;

    @Column(name = "bid_announce_date")
    private LocalDate bidAnnounceDate;

    @Column(name = "bid_announce_doc_path", length = 500)
    private String bidAnnounceDocPath;

    @Column(name = "bid_submit_date")
    private LocalDate bidSubmitDate;

    @Column(name = "bid_submit_doc_path", length = 500)
    private String bidSubmitDocPath;

    @Column(name = "win_date")
    private LocalDate winDate;

    @Column(name = "win_doc_path", length = 500)
    private String winDocPath;
}
