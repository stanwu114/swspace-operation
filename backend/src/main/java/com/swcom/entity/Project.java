package com.swcom.entity;

import com.swcom.entity.enums.ProjectCategory;
import com.swcom.entity.enums.ProjectStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "project")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Project {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "project_no", nullable = false, unique = true, length = 50)
    private String projectNo;

    @Column(name = "project_name", nullable = false, length = 200)
    private String projectName;

    @Enumerated(EnumType.STRING)
    @Column(name = "project_category", nullable = false, length = 50)
    private ProjectCategory projectCategory;

    @Column(columnDefinition = "TEXT")
    private String objective;

    @Column(columnDefinition = "TEXT")
    private String content;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "leader_id")
    private Employee leader;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "client_name", length = 200)
    private String clientName;

    @Column(name = "client_contact", length = 100)
    private String clientContact;

    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    @Builder.Default
    private ProjectStatus status = ProjectStatus.ACTIVE;

    @Column(name = "subcontract_entity", length = 200)
    private String subcontractEntity;

    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<ProjectDocument> documents = new ArrayList<>();

    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<ProjectCost> costs = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
