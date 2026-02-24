package com.swcom.entity;

import com.swcom.entity.enums.ConnectionStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "ai_employee_config")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AIEmployeeConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false, unique = true)
    private Employee employee;

    @Column(name = "api_url", nullable = false, length = 500)
    private String apiUrl;

    @Column(name = "api_key", nullable = false, length = 500)
    private String apiKey;

    @Column(name = "model_name", length = 100)
    private String modelName;

    @Column(name = "role_prompt", columnDefinition = "TEXT")
    private String rolePrompt;

    @Enumerated(EnumType.STRING)
    @Column(name = "connection_status", length = 20)
    @Builder.Default
    private ConnectionStatus connectionStatus = ConnectionStatus.UNKNOWN;

    @Column(name = "last_test_time")
    private LocalDateTime lastTestTime;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "available_models", columnDefinition = "jsonb")
    private List<String> availableModels;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
