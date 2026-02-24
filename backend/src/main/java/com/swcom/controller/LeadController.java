package com.swcom.controller;

import com.swcom.dto.*;
import com.swcom.entity.enums.LeadStatus;
import com.swcom.service.lead.LeadService;
import jakarta.validation.Valid;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/leads")
@RequiredArgsConstructor
public class LeadController {

    private final LeadService leadService;

    // ==================== Lead Endpoints ====================

    @GetMapping
    public ResponseEntity<ApiResponse<List<LeadDTO>>> getLeads(
            @RequestParam(required = false) LeadStatus status,
            @RequestParam(required = false) UUID ownerId,
            @RequestParam(required = false) String customerName,
            @RequestParam(required = false) String tag) {
        List<LeadDTO> leads = leadService.search(status, ownerId, customerName, tag);
        return ResponseEntity.ok(ApiResponse.success(leads));
    }

    @GetMapping("/tags")
    public ResponseEntity<ApiResponse<List<String>>> getAllTags() {
        List<String> tags = leadService.getAllTags();
        return ResponseEntity.ok(ApiResponse.success(tags));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<LeadDTO>> getLeadById(@PathVariable UUID id) {
        LeadDTO lead = leadService.getById(id);
        return ResponseEntity.ok(ApiResponse.success(lead));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<LeadDTO>> createLead(@Valid @RequestBody LeadForm form) {
        LeadDTO lead = leadService.create(form);
        return ResponseEntity.ok(ApiResponse.success(lead));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<LeadDTO>> updateLead(
            @PathVariable UUID id, @Valid @RequestBody LeadForm form) {
        LeadDTO lead = leadService.update(id, form);
        return ResponseEntity.ok(ApiResponse.success(lead));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<LeadDTO>> updateLeadStatus(
            @PathVariable UUID id, @RequestBody StatusRequest request) {
        LeadDTO lead = leadService.updateStatus(id, request.getStatus());
        return ResponseEntity.ok(ApiResponse.success(lead));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteLead(@PathVariable UUID id) {
        leadService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    // ==================== Tracking Log Endpoints ====================

    @GetMapping("/{id}/logs")
    public ResponseEntity<ApiResponse<List<LeadTrackingLogDTO>>> getLeadLogs(@PathVariable UUID id) {
        List<LeadTrackingLogDTO> logs = leadService.getLogs(id);
        return ResponseEntity.ok(ApiResponse.success(logs));
    }

    @PostMapping("/{id}/logs")
    public ResponseEntity<ApiResponse<LeadTrackingLogDTO>> createLeadLog(
            @PathVariable UUID id, @Valid @RequestBody LeadTrackingLogForm form) {
        LeadTrackingLogDTO log = leadService.createLog(id, form);
        return ResponseEntity.ok(ApiResponse.success(log));
    }

    @PutMapping("/{id}/logs/{logId}")
    public ResponseEntity<ApiResponse<LeadTrackingLogDTO>> updateLeadLog(
            @PathVariable UUID id, @PathVariable UUID logId,
            @Valid @RequestBody LeadTrackingLogForm form) {
        LeadTrackingLogDTO log = leadService.updateLog(id, logId, form);
        return ResponseEntity.ok(ApiResponse.success(log));
    }

    @DeleteMapping("/{id}/logs/{logId}")
    public ResponseEntity<ApiResponse<Void>> deleteLeadLog(
            @PathVariable UUID id, @PathVariable UUID logId) {
        leadService.deleteLog(id, logId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @Data
    public static class StatusRequest {
        private LeadStatus status;
    }
}
