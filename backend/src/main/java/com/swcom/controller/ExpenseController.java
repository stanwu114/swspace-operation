package com.swcom.controller;

import com.swcom.dto.ApiResponse;
import com.swcom.dto.expense.*;
import com.swcom.entity.enums.ExpenseCategory;
import com.swcom.service.expense.ExpenseService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import jakarta.servlet.http.HttpServletResponse;

@RestController
@RequestMapping("/api/expenses")
@RequiredArgsConstructor
@Tag(name = "Expense", description = "Expense management APIs")
public class ExpenseController {

    private final ExpenseService expenseService;

    @GetMapping
    @Operation(summary = "Get all expenses", description = "Get all expenses with optional filters")
    public ResponseEntity<ApiResponse<List<ExpenseDTO>>> getList(
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate,
            @RequestParam(required = false) ExpenseCategory category,
            @RequestParam(required = false) UUID projectId) {
        
        ExpenseSearchParams params = ExpenseSearchParams.builder()
                .startDate(startDate)
                .endDate(endDate)
                .category(category)
                .projectId(projectId)
                .build();
        
        List<ExpenseDTO> list = expenseService.search(params);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get expense by ID", description = "Get a single expense with all details")
    public ResponseEntity<ApiResponse<ExpenseDTO>> getById(@PathVariable UUID id) {
        ExpenseDTO expense = expenseService.getById(id);
        return ResponseEntity.ok(ApiResponse.success(expense));
    }

    @PostMapping
    @Operation(summary = "Create expense", description = "Create a new expense record")
    public ResponseEntity<ApiResponse<ExpenseDTO>> create(@Valid @RequestBody ExpenseForm form) {
        ExpenseDTO created = expenseService.create(form);
        return ResponseEntity.ok(ApiResponse.success("费用记录创建成功", created));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update expense", description = "Update an existing expense record")
    public ResponseEntity<ApiResponse<ExpenseDTO>> update(
            @PathVariable UUID id,
            @Valid @RequestBody ExpenseForm form) {
        ExpenseDTO updated = expenseService.update(id, form);
        return ResponseEntity.ok(ApiResponse.success("费用记录更新成功", updated));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete expense", description = "Delete an expense by its ID")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        expenseService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("费用记录删除成功", null));
    }

    // Attachment endpoints
    @GetMapping("/{id}/attachments")
    @Operation(summary = "Get expense attachments", description = "Get all attachments for an expense")
    public ResponseEntity<ApiResponse<List<ExpenseAttachmentDTO>>> getAttachments(@PathVariable UUID id) {
        List<ExpenseAttachmentDTO> attachments = expenseService.getAttachments(id);
        return ResponseEntity.ok(ApiResponse.success(attachments));
    }

    @PostMapping("/{id}/attachments")
    @Operation(summary = "Upload attachment", description = "Upload an attachment to an expense")
    public ResponseEntity<ApiResponse<ExpenseAttachmentDTO>> uploadAttachment(
            @PathVariable UUID id,
            @RequestParam("file") MultipartFile file) throws IOException {
        ExpenseAttachmentDTO attachment = expenseService.uploadAttachment(id, file);
        return ResponseEntity.ok(ApiResponse.success("附件上传成功", attachment));
    }

    @DeleteMapping("/{id}/attachments/{attachmentId}")
    @Operation(summary = "Delete attachment", description = "Delete an attachment from an expense")
    public ResponseEntity<ApiResponse<Void>> deleteAttachment(
            @PathVariable UUID id,
            @PathVariable UUID attachmentId) throws IOException {
        expenseService.deleteAttachment(id, attachmentId);
        return ResponseEntity.ok(ApiResponse.success("附件删除成功", null));
    }

    @GetMapping("/{id}/attachments/{attachmentId}/download")
    @Operation(summary = "Download attachment", description = "Download an expense attachment file")
    public void downloadAttachment(
            @PathVariable UUID id,
            @PathVariable UUID attachmentId,
            HttpServletResponse response) throws IOException {
        ExpenseAttachmentDTO att = expenseService.getAttachment(id, attachmentId);
        Path filePath = Paths.get(att.getFilePath());
        if (!Files.exists(filePath)) {
            response.sendError(HttpServletResponse.SC_NOT_FOUND);
            return;
        }
        String contentType = att.getFileType() != null ? att.getFileType() : "application/octet-stream";
        String encodedName = URLEncoder.encode(att.getFileName(), StandardCharsets.UTF_8).replace("+", "%20");

        // 直接设置 Header 绕过 Spring CharacterEncodingFilter 的 charset 强制追加
        response.setHeader("Content-Type", contentType);
        response.setHeader(HttpHeaders.CONTENT_DISPOSITION,
                "inline; filename=\"" + att.getFileName() + "\"; filename*=UTF-8''" + encodedName);
        response.setContentLengthLong(Files.size(filePath));
        Files.copy(filePath, response.getOutputStream());
        response.getOutputStream().flush();
    }

    // Export endpoint
    @PostMapping("/export")
    @Operation(summary = "Export expenses to Excel", description = "Export selected expenses to Excel file")
    public ResponseEntity<byte[]> exportToExcel(@RequestBody(required = false) ExpenseExportRequest request) throws IOException {
        List<UUID> ids = request != null ? request.getIds() : null;
        byte[] excelBytes = expenseService.exportToExcel(ids);
        
        String filename = "费用明细_" + LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd")) + ".xlsx";
        String encodedFilename = URLEncoder.encode(filename, StandardCharsets.UTF_8).replace("+", "%20");
        
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"expenses.xlsx\"; filename*=UTF-8''" + encodedFilename)
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(excelBytes);
    }

    // AI tool endpoint: create expense from invoice with attachment
    @PostMapping("/from-invoice")
    @Operation(summary = "Create expense from invoice", description = "Create expense record from AI tool with optional attachment path")
    public ResponseEntity<ApiResponse<ExpenseDTO>> createFromInvoice(@RequestBody Map<String, Object> request) {
        String expenseDate = (String) request.get("expenseDate");
        String category = (String) request.get("category");
        Number amountNum = (Number) request.get("amount");
        BigDecimal amount = amountNum != null ? new BigDecimal(amountNum.toString()) : BigDecimal.ZERO;
        Number taxRateNum = (Number) request.get("taxRate");
        BigDecimal taxRate = taxRateNum != null ? new BigDecimal(taxRateNum.toString()) : BigDecimal.ZERO;
        String projectRef = (String) request.get("projectRef");
        String description = (String) request.get("description");
        String attachmentPath = (String) request.get("attachmentPath");

        ExpenseDTO created = expenseService.createByProjectRef(
                expenseDate, category, amount, taxRate, projectRef, description, attachmentPath);
        return ResponseEntity.ok(ApiResponse.success("费用记录创建成功", created));
    }
}
