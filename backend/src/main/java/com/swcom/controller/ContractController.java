package com.swcom.controller;

import com.swcom.dto.*;
import com.swcom.entity.enums.ContractStatus;
import com.swcom.entity.enums.ContractType;
import com.swcom.service.contract.ContractService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/contracts")
@RequiredArgsConstructor
@Tag(name = "Contract", description = "Contract management APIs")
public class ContractController {

    private final ContractService contractService;

    @GetMapping
    @Operation(summary = "Get all contracts", description = "Get all contracts with optional filters")
    public ResponseEntity<ApiResponse<List<ContractDTO>>> getList(
            @RequestParam(required = false) ContractType type,
            @RequestParam(required = false) ContractStatus status,
            @RequestParam(required = false) UUID projectId) {
        List<ContractDTO> list = contractService.getList(type, status, projectId);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get contract by ID", description = "Get a single contract with all details")
    public ResponseEntity<ApiResponse<ContractDTO>> getById(@PathVariable UUID id) {
        ContractDTO contract = contractService.getById(id);
        return ResponseEntity.ok(ApiResponse.success(contract));
    }

    @PostMapping
    @Operation(summary = "Create contract", description = "Create a new contract")
    public ResponseEntity<ApiResponse<ContractDTO>> create(@Valid @RequestBody ContractForm form) {
        ContractDTO created = contractService.create(form);
        return ResponseEntity.ok(ApiResponse.success("Contract created successfully", created));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update contract", description = "Update an existing contract")
    public ResponseEntity<ApiResponse<ContractDTO>> update(
            @PathVariable UUID id,
            @Valid @RequestBody ContractForm form) {
        ContractDTO updated = contractService.update(id, form);
        return ResponseEntity.ok(ApiResponse.success("Contract updated successfully", updated));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete contract", description = "Delete a contract by its ID")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        contractService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Contract deleted successfully", null));
    }

    @PutMapping("/{id}/status")
    @Operation(summary = "Update contract status", description = "Update contract status")
    public ResponseEntity<ApiResponse<ContractDTO>> updateStatus(
            @PathVariable UUID id,
            @RequestBody StatusRequest request) {
        ContractDTO updated = contractService.updateStatus(id, request.getStatus());
        return ResponseEntity.ok(ApiResponse.success("Contract status updated successfully", updated));
    }

    @PostMapping("/{id}/file")
    @Operation(summary = "Upload contract file", description = "Upload contract document file")
    public ResponseEntity<ApiResponse<ContractDTO>> uploadFile(
            @PathVariable UUID id,
            @RequestParam("file") MultipartFile file) throws IOException {
        ContractDTO updated = contractService.uploadContractFile(id, file);
        return ResponseEntity.ok(ApiResponse.success("Contract file uploaded successfully", updated));
    }

    // Payment Node endpoints
    @GetMapping("/{id}/payment-nodes")
    @Operation(summary = "Get payment nodes", description = "Get all payment nodes for a contract")
    public ResponseEntity<ApiResponse<List<PaymentNodeDTO>>> getPaymentNodes(@PathVariable UUID id) {
        List<PaymentNodeDTO> nodes = contractService.getPaymentNodes(id);
        return ResponseEntity.ok(ApiResponse.success(nodes));
    }

    @PostMapping("/{id}/payment-nodes")
    @Operation(summary = "Add payment node", description = "Add a payment node to a contract")
    public ResponseEntity<ApiResponse<PaymentNodeDTO>> addPaymentNode(
            @PathVariable UUID id,
            @Valid @RequestBody PaymentNodeForm form) {
        PaymentNodeDTO node = contractService.addPaymentNode(id, form);
        return ResponseEntity.ok(ApiResponse.success("Payment node added successfully", node));
    }

    @PutMapping("/{id}/payment-nodes/{nodeId}")
    @Operation(summary = "Update payment node", description = "Update a payment node")
    public ResponseEntity<ApiResponse<PaymentNodeDTO>> updatePaymentNode(
            @PathVariable UUID id,
            @PathVariable UUID nodeId,
            @Valid @RequestBody PaymentNodeForm form) {
        PaymentNodeDTO node = contractService.updatePaymentNode(id, nodeId, form);
        return ResponseEntity.ok(ApiResponse.success("Payment node updated successfully", node));
    }

    @PostMapping("/{id}/payment-nodes/{nodeId}/complete")
    @Operation(summary = "Complete payment node", description = "Mark a payment node as completed")
    public ResponseEntity<ApiResponse<PaymentNodeDTO>> completePaymentNode(
            @PathVariable UUID id,
            @PathVariable UUID nodeId,
            @RequestBody CompletePaymentRequest request) {
        PaymentNodeDTO node = contractService.completePaymentNode(id, nodeId, request.getActualAmount(), request.getActualDate());
        return ResponseEntity.ok(ApiResponse.success("Payment node completed", node));
    }

    @DeleteMapping("/{id}/payment-nodes/{nodeId}")
    @Operation(summary = "Delete payment node", description = "Delete a payment node")
    public ResponseEntity<ApiResponse<Void>> deletePaymentNode(
            @PathVariable UUID id,
            @PathVariable UUID nodeId) {
        contractService.deletePaymentNode(id, nodeId);
        return ResponseEntity.ok(ApiResponse.success("Payment node deleted successfully", null));
    }

    // Bid Info endpoints
    @GetMapping("/{id}/bid-info")
    @Operation(summary = "Get bid info", description = "Get bid information for a contract")
    public ResponseEntity<ApiResponse<BidInfoDTO>> getBidInfo(@PathVariable UUID id) {
        BidInfoDTO bidInfo = contractService.getBidInfo(id);
        return ResponseEntity.ok(ApiResponse.success(bidInfo));
    }

    @PostMapping("/{id}/bid-info")
    @Operation(summary = "Save bid info", description = "Save bid information for a contract")
    public ResponseEntity<ApiResponse<BidInfoDTO>> saveBidInfo(
            @PathVariable UUID id,
            @RequestBody BidInfoForm form) {
        BidInfoDTO bidInfo = contractService.saveBidInfo(id, form);
        return ResponseEntity.ok(ApiResponse.success("Bid info saved successfully", bidInfo));
    }

    @lombok.Data
    public static class StatusRequest {
        private ContractStatus status;
    }

    @lombok.Data
    public static class CompletePaymentRequest {
        private BigDecimal actualAmount;
        private LocalDate actualDate;
    }
}
