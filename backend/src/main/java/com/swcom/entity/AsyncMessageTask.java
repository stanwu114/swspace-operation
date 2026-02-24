package com.swcom.entity;

import com.swcom.entity.enums.AsyncTaskStatus;
import com.swcom.entity.enums.AsyncTaskType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "async_message_task")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AsyncMessageTask {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "message_log_id")
    private ExternalMessageLog messageLog;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "binding_id")
    private ExternalUserBinding binding;

    @Enumerated(EnumType.STRING)
    @Column(name = "task_type", nullable = false, length = 50)
    private AsyncTaskType taskType;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    @Builder.Default
    private AsyncTaskStatus status = AsyncTaskStatus.PENDING;

    @Column
    @Builder.Default
    private Integer priority = 5;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "input_data", columnDefinition = "jsonb")
    private Map<String, Object> inputData;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "output_data", columnDefinition = "jsonb")
    private Map<String, Object> outputData;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "retry_count")
    @Builder.Default
    private Integer retryCount = 0;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
