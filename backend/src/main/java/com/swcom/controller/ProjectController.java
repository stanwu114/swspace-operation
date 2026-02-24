package com.swcom.controller;

import com.swcom.dto.*;
import com.swcom.entity.enums.ProjectCategory;
import com.swcom.entity.enums.ProjectStatus;
import com.swcom.service.project.ProjectService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
@Tag(name = "Project", description = "Project management APIs")
public class ProjectController {

    private final ProjectService projectService;

    @GetMapping
    @Operation(summary = "Get all projects", description = "Get all projects with optional filters")
    public ResponseEntity<ApiResponse<List<ProjectDTO>>> getList(
            @RequestParam(required = false) ProjectCategory category,
            @RequestParam(required = false) ProjectStatus status,
            @RequestParam(required = false) UUID leaderId) {
        List<ProjectDTO> list = projectService.getList(category, status, leaderId);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get project by ID", description = "Get a single project with all details")
    public ResponseEntity<ApiResponse<ProjectDTO>> getById(@PathVariable UUID id) {
        ProjectDTO project = projectService.getById(id);
        return ResponseEntity.ok(ApiResponse.success(project));
    }

    @PostMapping
    @Operation(summary = "Create project", description = "Create a new project")
    public ResponseEntity<ApiResponse<ProjectDTO>> create(@Valid @RequestBody ProjectForm form) {
        ProjectDTO created = projectService.create(form);
        return ResponseEntity.ok(ApiResponse.success("Project created successfully", created));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update project", description = "Update an existing project")
    public ResponseEntity<ApiResponse<ProjectDTO>> update(
            @PathVariable UUID id,
            @Valid @RequestBody ProjectForm form) {
        ProjectDTO updated = projectService.update(id, form);
        return ResponseEntity.ok(ApiResponse.success("Project updated successfully", updated));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete project", description = "Delete a project by its ID")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        projectService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Project deleted successfully", null));
    }

    @PutMapping("/{id}/status")
    @Operation(summary = "Update project status", description = "Update project status")
    public ResponseEntity<ApiResponse<ProjectDTO>> updateStatus(
            @PathVariable UUID id,
            @RequestBody StatusRequest request) {
        ProjectDTO updated = projectService.updateStatus(id, request.getStatus());
        return ResponseEntity.ok(ApiResponse.success("Project status updated successfully", updated));
    }

    // Document endpoints
    @GetMapping("/{id}/documents")
    @Operation(summary = "Get project documents", description = "Get all documents for a project")
    public ResponseEntity<ApiResponse<List<ProjectDocumentDTO>>> getDocuments(@PathVariable UUID id) {
        List<ProjectDocumentDTO> documents = projectService.getDocuments(id);
        return ResponseEntity.ok(ApiResponse.success(documents));
    }

    @PostMapping("/{id}/documents")
    @Operation(summary = "Upload document", description = "Upload a document to a project")
    public ResponseEntity<ApiResponse<ProjectDocumentDTO>> uploadDocument(
            @PathVariable UUID id,
            @RequestParam("file") MultipartFile file) throws IOException {
        ProjectDocumentDTO document = projectService.uploadDocument(id, file);
        return ResponseEntity.ok(ApiResponse.success("Document uploaded successfully", document));
    }

    @DeleteMapping("/{id}/documents/{documentId}")
    @Operation(summary = "Delete document", description = "Delete a document from a project")
    public ResponseEntity<ApiResponse<Void>> deleteDocument(
            @PathVariable UUID id,
            @PathVariable UUID documentId) throws IOException {
        projectService.deleteDocument(id, documentId);
        return ResponseEntity.ok(ApiResponse.success("Document deleted successfully", null));
    }

    // Cost endpoints
    @GetMapping("/{id}/costs")
    @Operation(summary = "Get project costs", description = "Get all costs for a project")
    public ResponseEntity<ApiResponse<List<ProjectCostDTO>>> getCosts(@PathVariable UUID id) {
        List<ProjectCostDTO> costs = projectService.getCosts(id);
        return ResponseEntity.ok(ApiResponse.success(costs));
    }

    @PostMapping("/{id}/costs")
    @Operation(summary = "Add cost", description = "Add a cost record to a project")
    public ResponseEntity<ApiResponse<ProjectCostDTO>> addCost(
            @PathVariable UUID id,
            @Valid @RequestBody ProjectCostForm form) {
        ProjectCostDTO cost = projectService.addCost(id, form);
        return ResponseEntity.ok(ApiResponse.success("Cost added successfully", cost));
    }

    @DeleteMapping("/{id}/costs/{costId}")
    @Operation(summary = "Delete cost", description = "Delete a cost record from a project")
    public ResponseEntity<ApiResponse<Void>> deleteCost(
            @PathVariable UUID id,
            @PathVariable UUID costId) {
        projectService.deleteCost(id, costId);
        return ResponseEntity.ok(ApiResponse.success("Cost deleted successfully", null));
    }

    @GetMapping("/{id}/costs/total")
    @Operation(summary = "Get total cost", description = "Get total cost for a project")
    public ResponseEntity<ApiResponse<BigDecimal>> getTotalCost(@PathVariable UUID id) {
        BigDecimal total = projectService.getTotalCost(id);
        return ResponseEntity.ok(ApiResponse.success(total));
    }

    @lombok.Data
    public static class StatusRequest {
        private ProjectStatus status;
    }
}
