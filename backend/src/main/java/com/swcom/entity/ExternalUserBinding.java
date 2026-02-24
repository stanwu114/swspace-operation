package com.swcom.entity;

import com.swcom.entity.enums.BindingStatus;
import com.swcom.entity.enums.PlatformType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "external_user_binding",
        uniqueConstraints = @UniqueConstraint(columnNames = {"platform_type", "platform_user_id"}))
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExternalUserBinding {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Enumerated(EnumType.STRING)
    @Column(name = "platform_type", nullable = false, length = 30)
    private PlatformType platformType;

    @Column(name = "platform_user_id", nullable = false, length = 100)
    private String platformUserId;

    @Column(name = "platform_username", length = 255)
    private String platformUsername;

    @Column(name = "binding_code", length = 10)
    private String bindingCode;

    @Enumerated(EnumType.STRING)
    @Column(name = "binding_status", length = 20)
    @Builder.Default
    private BindingStatus bindingStatus = BindingStatus.PENDING;

    @Column(name = "bound_at")
    private LocalDateTime boundAt;

    @Column(name = "code_expires_at")
    private LocalDateTime codeExpiresAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
