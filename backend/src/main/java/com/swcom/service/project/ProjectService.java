package com.swcom.service.project;

import com.swcom.config.StorageConfig;
import com.swcom.dto.*;
import com.swcom.entity.Employee;
import com.swcom.entity.Project;
import com.swcom.entity.ProjectCost;
import com.swcom.entity.ProjectDocument;
import com.swcom.entity.enums.ProjectCategory;
import com.swcom.entity.enums.ProjectStatus;
import com.swcom.repository.EmployeeRepository;
import com.swcom.repository.ProjectCostRepository;
import com.swcom.repository.ProjectDocumentRepository;
import com.swcom.repository.ProjectRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@SuppressWarnings("null")
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final ProjectDocumentRepository documentRepository;
    private final ProjectCostRepository costRepository;
    private final EmployeeRepository employeeRepository;
    private final StorageConfig storageConfig;

    public List<ProjectDTO> getList(ProjectCategory category, ProjectStatus status, UUID leaderId) {
        List<Project> projects;

        if (category != null) {
            projects = projectRepository.findByCategoryWithLeader(category);
        } else if (status != null) {
            projects = projectRepository.findByStatusWithLeader(status);
        } else if (leaderId != null) {
            projects = projectRepository.findByLeaderIdWithLeader(leaderId);
        } else {
            projects = projectRepository.findAllWithLeader();
        }

        return projects.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public ProjectDTO getById(UUID id) {
        Project project = projectRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new EntityNotFoundException("Project not found with id: " + id));
        return toDTO(project);
    }

    @Transactional
    public ProjectDTO create(ProjectForm form) {
        Project project = Project.builder()
                .projectName(form.getProjectName())
                .projectCategory(form.getProjectCategory())
                .objective(form.getObjective())
                .content(form.getContent())
                .startDate(form.getStartDate())
                .clientName(form.getClientName())
                .clientContact(form.getClientContact())
                .subcontractEntity(form.getSubcontractEntity())
                .status(ProjectStatus.ACTIVE)
                .build();

        if (form.getLeaderId() != null) {
            Employee leader = employeeRepository.findById(form.getLeaderId())
                    .orElseThrow(() -> new EntityNotFoundException("Leader not found with id: " + form.getLeaderId()));
            project.setLeader(leader);
        }

        Project saved = projectRepository.save(project);
        log.info("Created project: {} ({})", saved.getProjectName(), saved.getProjectNo());
        return toDTO(saved);
    }

    @Transactional
    public ProjectDTO update(UUID id, ProjectForm form) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Project not found with id: " + id));

        project.setProjectName(form.getProjectName());
        project.setProjectCategory(form.getProjectCategory());
        project.setObjective(form.getObjective());
        project.setContent(form.getContent());
        project.setStartDate(form.getStartDate());
        project.setClientName(form.getClientName());
        project.setClientContact(form.getClientContact());
        project.setSubcontractEntity(form.getSubcontractEntity());

        if (form.getLeaderId() != null) {
            Employee leader = employeeRepository.findById(form.getLeaderId())
                    .orElseThrow(() -> new EntityNotFoundException("Leader not found with id: " + form.getLeaderId()));
            project.setLeader(leader);
        } else {
            project.setLeader(null);
        }

        Project saved = projectRepository.save(project);
        log.info("Updated project: {}", saved.getProjectName());
        return toDTO(saved);
    }

    @Transactional
    public void delete(UUID id) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Project not found with id: " + id));
        projectRepository.delete(project);
        log.info("Deleted project: {}", project.getProjectName());
    }

    @Transactional
    public ProjectDTO updateStatus(UUID id, ProjectStatus status) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Project not found with id: " + id));
        project.setStatus(status);
        Project saved = projectRepository.save(project);
        log.info("Updated project status: {} -> {}", saved.getProjectName(), status);
        return toDTO(saved);
    }

    // Document methods
    public List<ProjectDocumentDTO> getDocuments(UUID projectId) {
        return documentRepository.findByProjectIdOrderByUploadTimeDesc(projectId).stream()
                .map(this::toDocumentDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public ProjectDocumentDTO uploadDocument(UUID projectId, MultipartFile file) throws IOException {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new EntityNotFoundException("Project not found with id: " + projectId));

        String fileName = UUID.randomUUID() + "_" + file.getOriginalFilename();
        Path uploadPath = Paths.get(storageConfig.getUploadDir(), "projects", projectId.toString());
        Files.createDirectories(uploadPath);
        Path filePath = uploadPath.resolve(fileName);
        Files.copy(file.getInputStream(), filePath);

        ProjectDocument document = ProjectDocument.builder()
                .project(project)
                .documentName(file.getOriginalFilename())
                .filePath(filePath.toString())
                .fileType(file.getContentType())
                .fileSize(file.getSize())
                .uploadTime(LocalDateTime.now())
                .build();

        ProjectDocument saved = documentRepository.save(document);
        log.info("Uploaded document for project {}: {}", project.getProjectName(), file.getOriginalFilename());
        return toDocumentDTO(saved);
    }

    @Transactional
    public void deleteDocument(UUID projectId, UUID documentId) throws IOException {
        ProjectDocument document = documentRepository.findById(documentId)
                .orElseThrow(() -> new EntityNotFoundException("Document not found with id: " + documentId));

        // Delete file from filesystem
        Path filePath = Paths.get(document.getFilePath());
        Files.deleteIfExists(filePath);

        documentRepository.delete(document);
        log.info("Deleted document: {}", document.getDocumentName());
    }

    // Cost methods
    public List<ProjectCostDTO> getCosts(UUID projectId) {
        return costRepository.findByProjectIdOrderByCostDateDesc(projectId).stream()
                .map(this::toCostDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public ProjectCostDTO addCost(UUID projectId, ProjectCostForm form) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new EntityNotFoundException("Project not found with id: " + projectId));

        ProjectCost cost = ProjectCost.builder()
                .project(project)
                .costType(form.getCostType())
                .amount(form.getAmount())
                .description(form.getDescription())
                .costDate(form.getCostDate())
                .build();

        ProjectCost saved = costRepository.save(cost);
        log.info("Added cost for project {}: {} - {}", project.getProjectName(), form.getCostType(), form.getAmount());
        return toCostDTO(saved);
    }

    @Transactional
    public void deleteCost(UUID projectId, UUID costId) {
        ProjectCost cost = costRepository.findById(costId)
                .orElseThrow(() -> new EntityNotFoundException("Cost not found with id: " + costId));
        costRepository.delete(cost);
        log.info("Deleted cost: {}", costId);
    }

    public BigDecimal getTotalCost(UUID projectId) {
        return costRepository.getTotalCostByProjectId(projectId);
    }

    private ProjectDTO toDTO(Project project) {
        BigDecimal totalCost = costRepository.getTotalCostByProjectId(project.getId());
        long documentCount = documentRepository.countByProjectId(project.getId());

        return ProjectDTO.builder()
                .id(project.getId())
                .projectNo(project.getProjectNo())
                .projectName(project.getProjectName())
                .projectCategory(project.getProjectCategory())
                .objective(project.getObjective())
                .content(project.getContent())
                .leaderId(project.getLeader() != null ? project.getLeader().getId() : null)
                .leaderName(project.getLeader() != null ? project.getLeader().getName() : null)
                .startDate(project.getStartDate())
                .clientName(project.getClientName())
                .clientContact(project.getClientContact())
                .status(project.getStatus())
                .subcontractEntity(project.getSubcontractEntity())
                .totalCost(totalCost)
                .documentCount((int) documentCount)
                .createdAt(project.getCreatedAt())
                .updatedAt(project.getUpdatedAt())
                .build();
    }

    private ProjectDocumentDTO toDocumentDTO(ProjectDocument document) {
        return ProjectDocumentDTO.builder()
                .id(document.getId())
                .projectId(document.getProject().getId())
                .documentName(document.getDocumentName())
                .filePath(document.getFilePath())
                .fileType(document.getFileType())
                .fileSize(document.getFileSize())
                .uploaderId(document.getUploader() != null ? document.getUploader().getId() : null)
                .uploaderName(document.getUploader() != null ? document.getUploader().getName() : null)
                .uploadTime(document.getUploadTime())
                .build();
    }

    private ProjectCostDTO toCostDTO(ProjectCost cost) {
        return ProjectCostDTO.builder()
                .id(cost.getId())
                .projectId(cost.getProject().getId())
                .costType(cost.getCostType())
                .amount(cost.getAmount())
                .description(cost.getDescription())
                .costDate(cost.getCostDate())
                .createdAt(cost.getCreatedAt())
                .build();
    }
}
