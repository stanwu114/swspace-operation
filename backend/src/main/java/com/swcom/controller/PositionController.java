package com.swcom.controller;

import com.swcom.dto.ApiResponse;
import com.swcom.dto.PositionDTO;
import com.swcom.dto.PositionForm;
import com.swcom.service.organization.PositionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/positions")
@RequiredArgsConstructor
@Tag(name = "Position", description = "Position management APIs")
public class PositionController {

    private final PositionService positionService;

    @GetMapping
    @Operation(summary = "Get all positions", description = "Get all positions, optionally filtered by department")
    public ResponseEntity<ApiResponse<List<PositionDTO>>> getList(
            @RequestParam(required = false) UUID departmentId) {
        List<PositionDTO> list = positionService.getList(departmentId);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get position by ID", description = "Get a single position by its ID")
    public ResponseEntity<ApiResponse<PositionDTO>> getById(@PathVariable UUID id) {
        PositionDTO position = positionService.getById(id);
        return ResponseEntity.ok(ApiResponse.success(position));
    }

    @PostMapping
    @Operation(summary = "Create position", description = "Create a new position")
    public ResponseEntity<ApiResponse<PositionDTO>> create(@Valid @RequestBody PositionForm form) {
        PositionDTO created = positionService.create(form);
        return ResponseEntity.ok(ApiResponse.success("Position created successfully", created));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update position", description = "Update an existing position")
    public ResponseEntity<ApiResponse<PositionDTO>> update(
            @PathVariable UUID id,
            @Valid @RequestBody PositionForm form) {
        PositionDTO updated = positionService.update(id, form);
        return ResponseEntity.ok(ApiResponse.success("Position updated successfully", updated));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete position", description = "Delete a position by its ID")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        positionService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Position deleted successfully", null));
    }
}
