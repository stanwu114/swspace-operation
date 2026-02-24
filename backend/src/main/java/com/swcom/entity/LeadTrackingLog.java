package com.swcom.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "lead_tracking_log")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeadTrackingLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lead_id", nullable = false)
    private Lead lead;

    @Column(name = "log_date", nullable = false)
    private LocalDate logDate;

    @Column(name = "log_title", nullable = false, length = 200)
    private String logTitle;

    @Column(name = "log_content", nullable = false, columnDefinition = "TEXT")
    private String logContent;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private Employee createdBy;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
