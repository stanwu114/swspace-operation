package com.swcom.controller;

import com.swcom.dto.ApiResponse;
import com.swcom.dto.DepartmentDTO;
import com.swcom.dto.DepartmentForm;
import com.swcom.service.organization.DepartmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/departments")
@RequiredArgsConstructor
@Tag(name = "Department", description = "Department management APIs")
public class DepartmentController {

    private final DepartmentService departmentService;

    @GetMapping("/tree")
    @Operation(summary = "Get department tree", description = "Get all departments in tree structure")
    public ResponseEntity<ApiResponse<List<DepartmentDTO>>> getTree() {
        List<DepartmentDTO> tree = departmentService.getTree();
        return ResponseEntity.ok(ApiResponse.success(tree));
    }

    @GetMapping
    @Operation(summary = "Get all departments", description = "Get all departments as flat list")
    public ResponseEntity<ApiResponse<List<DepartmentDTO>>> getList() {
        List<DepartmentDTO> list = departmentService.getList();
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get department by ID", description = "Get a single department by its ID")
    public ResponseEntity<ApiResponse<DepartmentDTO>> getById(@PathVariable UUID id) {
        DepartmentDTO department = departmentService.getById(id);
        return ResponseEntity.ok(ApiResponse.success(department));
    }

    @PostMapping
    @Operation(summary = "Create department", description = "Create a new department")
    public ResponseEntity<ApiResponse<DepartmentDTO>> create(@Valid @RequestBody DepartmentForm form) {
        DepartmentDTO created = departmentService.create(form);
        return ResponseEntity.ok(ApiResponse.success("Department created successfully", created));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update department", description = "Update an existing department")
    public ResponseEntity<ApiResponse<DepartmentDTO>> update(
            @PathVariable UUID id,
            @Valid @RequestBody DepartmentForm form) {
        DepartmentDTO updated = departmentService.update(id, form);
        return ResponseEntity.ok(ApiResponse.success("Department updated successfully", updated));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete department", description = "Delete a department by its ID")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        departmentService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Department deleted successfully", null));
    }
}
