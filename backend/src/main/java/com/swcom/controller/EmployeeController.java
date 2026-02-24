package com.swcom.controller;

import com.swcom.dto.*;
import com.swcom.entity.enums.EmployeeStatus;
import com.swcom.entity.enums.EmployeeType;
import com.swcom.service.organization.EmployeeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/employees")
@RequiredArgsConstructor
@Tag(name = "Employee", description = "Employee management APIs")
public class EmployeeController {

    private final EmployeeService employeeService;

    @GetMapping
    @Operation(summary = "Get all employees", description = "Get all employees with optional filters")
    public ResponseEntity<ApiResponse<List<EmployeeDTO>>> getList(
            @RequestParam(required = false) EmployeeType employeeType,
            @RequestParam(required = false) UUID departmentId,
            @RequestParam(required = false) EmployeeStatus status) {
        List<EmployeeDTO> list = employeeService.getList(employeeType, departmentId, status);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get employee by ID", description = "Get a single employee with all details")
    public ResponseEntity<ApiResponse<EmployeeDTO>> getById(@PathVariable UUID id) {
        EmployeeDTO employee = employeeService.getById(id);
        return ResponseEntity.ok(ApiResponse.success(employee));
    }

    @PostMapping
    @Operation(summary = "Create employee", description = "Create a new employee (human or AI)")
    public ResponseEntity<ApiResponse<EmployeeDTO>> create(@Valid @RequestBody EmployeeForm form) {
        EmployeeDTO created = employeeService.create(form);
        return ResponseEntity.ok(ApiResponse.success("Employee created successfully", created));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update employee", description = "Update an existing employee")
    public ResponseEntity<ApiResponse<EmployeeDTO>> update(
            @PathVariable UUID id,
            @Valid @RequestBody EmployeeForm form) {
        EmployeeDTO updated = employeeService.update(id, form);
        return ResponseEntity.ok(ApiResponse.success("Employee updated successfully", updated));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete employee", description = "Delete an employee by its ID")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        employeeService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Employee deleted successfully", null));
    }

    @PutMapping("/{id}/status")
    @Operation(summary = "Update employee status", description = "Update employee status (ACTIVE/INACTIVE)")
    public ResponseEntity<ApiResponse<EmployeeDTO>> updateStatus(
            @PathVariable UUID id,
            @RequestBody StatusUpdateRequest request) {
        EmployeeDTO updated = employeeService.updateStatus(id, request.getStatus());
        return ResponseEntity.ok(ApiResponse.success("Employee status updated successfully", updated));
    }

    // AI Employee Config endpoints
    @GetMapping("/{id}/ai-config")
    @Operation(summary = "Get AI config", description = "Get AI employee configuration")
    public ResponseEntity<ApiResponse<AIEmployeeConfigDTO>> getAIConfig(@PathVariable UUID id) {
        AIEmployeeConfigDTO config = employeeService.getAIConfig(id);
        return ResponseEntity.ok(ApiResponse.success(config));
    }

    @PostMapping("/{id}/ai-config")
    @Operation(summary = "Save AI config", description = "Create or update AI employee configuration")
    public ResponseEntity<ApiResponse<AIEmployeeConfigDTO>> saveAIConfig(
            @PathVariable UUID id,
            @Valid @RequestBody AIEmployeeConfigForm form) {
        AIEmployeeConfigDTO saved = employeeService.saveAIConfig(id, form);
        return ResponseEntity.ok(ApiResponse.success("AI config saved successfully", saved));
    }

    // Inner class for status update request
    @lombok.Data
    public static class StatusUpdateRequest {
        private EmployeeStatus status;
    }
}
