package com.swcom.service.expense;

import com.swcom.config.StorageConfig;
import com.swcom.dto.expense.*;
import com.swcom.entity.Employee;
import com.swcom.entity.Expense;
import com.swcom.entity.ExpenseAttachment;
import com.swcom.entity.Project;
import com.swcom.entity.enums.ExpenseCategory;
import com.swcom.repository.EmployeeRepository;
import com.swcom.repository.ExpenseAttachmentRepository;
import com.swcom.repository.ExpenseRepository;
import com.swcom.repository.ProjectRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final ExpenseAttachmentRepository attachmentRepository;
    private final ProjectRepository projectRepository;
    private final EmployeeRepository employeeRepository;
    private final StorageConfig storageConfig;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    /**
     * 获取费用列表（支持条件筛选）
     */
    public List<ExpenseDTO> search(ExpenseSearchParams params) {
        Specification<Expense> spec = buildSpecification(params);
        List<Expense> expenses = expenseRepository.findAll(spec);
        return expenses.stream().map(this::toDTO).collect(Collectors.toList());
    }

    /**
     * 获取所有费用列表
     */
    public List<ExpenseDTO> getAll() {
        return expenseRepository.findAllWithDetails().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * 根据ID获取费用详情
     */
    public ExpenseDTO getById(UUID id) {
        Expense expense = expenseRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new EntityNotFoundException("Expense not found with id: " + id));
        return toDTO(expense);
    }

    /**
     * 创建费用记录
     */
    @Transactional
    public ExpenseDTO create(ExpenseForm form) {
        Expense expense = Expense.builder()
                .expenseDate(form.getExpenseDate())
                .category(form.getCategory())
                .amount(form.getAmount())
                .taxRate(form.getTaxRate() != null ? form.getTaxRate() : BigDecimal.ZERO)
                .description(form.getDescription())
                .build();

        if (form.getProjectId() != null) {
            Project project = projectRepository.findById(form.getProjectId())
                    .orElseThrow(() -> new EntityNotFoundException("Project not found with id: " + form.getProjectId()));
            expense.setProject(project);
        }

        if (form.getCreatedById() != null) {
            Employee employee = employeeRepository.findById(form.getCreatedById())
                    .orElseThrow(() -> new EntityNotFoundException("Employee not found with id: " + form.getCreatedById()));
            expense.setCreatedBy(employee);
        }

        Expense saved = expenseRepository.save(expense);
        log.info("Created expense: {} - {} - {}", saved.getExpenseDate(), saved.getCategory(), saved.getAmount());
        return toDTO(saved);
    }

    /**
     * 根据项目名称或编号创建费用记录（用于AI Tool调用）
     */
    @Transactional
    public ExpenseDTO createByProjectRef(String expenseDate, String category, BigDecimal amount, 
                                          BigDecimal taxRate, String projectRef, String description,
                                          String attachmentPath) {
        ExpenseCategory expenseCategory;
        try {
            expenseCategory = ExpenseCategory.valueOf(category.toUpperCase());
        } catch (IllegalArgumentException e) {
            expenseCategory = ExpenseCategory.OTHER;
        }

        Expense expense = Expense.builder()
                .expenseDate(LocalDate.parse(expenseDate, DATE_FORMATTER))
                .category(expenseCategory)
                .amount(amount)
                .taxRate(taxRate != null ? taxRate : BigDecimal.ZERO)
                .description(description)
                .build();

        // 根据项目名称或编号查找项目
        if (projectRef != null && !projectRef.isBlank()) {
            projectRepository.findByProjectNo(projectRef)
                    .or(() -> projectRepository.findAll().stream()
                            .filter(p -> p.getProjectName().contains(projectRef))
                            .findFirst())
                    .ifPresent(expense::setProject);
        }

        Expense saved = expenseRepository.save(expense);

        // 处理附件
        if (attachmentPath != null && !attachmentPath.isBlank()) {
            try {
                Path sourcePath = Paths.get(storageConfig.getUploadDir())
                        .toAbsolutePath().normalize()
                        .resolve(attachmentPath).normalize();
                if (Files.exists(sourcePath)) {
                    String fileName = sourcePath.getFileName().toString();
                    Path targetDir = Paths.get(storageConfig.getUploadDir(), "expenses", saved.getId().toString());
                    Files.createDirectories(targetDir);
                    Path targetPath = targetDir.resolve(UUID.randomUUID() + "_" + fileName);
                    Files.copy(sourcePath, targetPath);

                    ExpenseAttachment attachment = ExpenseAttachment.builder()
                            .expense(saved)
                            .fileName(fileName)
                            .filePath(targetPath.toString())
                            .fileType(Files.probeContentType(sourcePath))
                            .fileSize(Files.size(sourcePath))
                            .build();
                    attachmentRepository.save(attachment);
                    log.info("Added attachment to expense {}: {}", saved.getId(), fileName);
                }
            } catch (IOException e) {
                log.error("Failed to process attachment: {}", attachmentPath, e);
            }
        }

        log.info("Created expense via AI: {} - {} - {}", saved.getExpenseDate(), saved.getCategory(), saved.getAmount());
        return toDTO(saved);
    }

    /**
     * 更新费用记录
     */
    @Transactional
    public ExpenseDTO update(UUID id, ExpenseForm form) {
        Expense expense = expenseRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Expense not found with id: " + id));

        expense.setExpenseDate(form.getExpenseDate());
        expense.setCategory(form.getCategory());
        expense.setAmount(form.getAmount());
        expense.setTaxRate(form.getTaxRate() != null ? form.getTaxRate() : BigDecimal.ZERO);
        expense.setDescription(form.getDescription());

        if (form.getProjectId() != null) {
            Project project = projectRepository.findById(form.getProjectId())
                    .orElseThrow(() -> new EntityNotFoundException("Project not found with id: " + form.getProjectId()));
            expense.setProject(project);
        } else {
            expense.setProject(null);
        }

        Expense saved = expenseRepository.save(expense);
        log.info("Updated expense: {}", saved.getId());
        return toDTO(saved);
    }

    /**
     * 删除费用记录
     */
    @Transactional
    public void delete(UUID id) {
        Expense expense = expenseRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Expense not found with id: " + id));

        // 删除关联的附件文件
        for (ExpenseAttachment attachment : expense.getAttachments()) {
            try {
                Files.deleteIfExists(Paths.get(attachment.getFilePath()));
            } catch (IOException e) {
                log.warn("Failed to delete attachment file: {}", attachment.getFilePath(), e);
            }
        }

        expenseRepository.delete(expense);
        log.info("Deleted expense: {}", id);
    }

    /**
     * 上传附件
     */
    @Transactional
    public ExpenseAttachmentDTO uploadAttachment(UUID expenseId, MultipartFile file) throws IOException {
        Expense expense = expenseRepository.findById(expenseId)
                .orElseThrow(() -> new EntityNotFoundException("Expense not found with id: " + expenseId));

        String fileName = UUID.randomUUID() + "_" + file.getOriginalFilename();
        Path uploadPath = Paths.get(storageConfig.getUploadDir(), "expenses", expenseId.toString());
        Files.createDirectories(uploadPath);
        Path filePath = uploadPath.resolve(fileName);
        Files.copy(file.getInputStream(), filePath);

        ExpenseAttachment attachment = ExpenseAttachment.builder()
                .expense(expense)
                .fileName(file.getOriginalFilename())
                .filePath(filePath.toString())
                .fileType(file.getContentType())
                .fileSize(file.getSize())
                .build();

        ExpenseAttachment saved = attachmentRepository.save(attachment);
        log.info("Uploaded attachment for expense {}: {}", expenseId, file.getOriginalFilename());
        return toAttachmentDTO(saved);
    }

    /**
     * 删除附件
     */
    @Transactional
    public void deleteAttachment(UUID expenseId, UUID attachmentId) throws IOException {
        ExpenseAttachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new EntityNotFoundException("Attachment not found with id: " + attachmentId));

        Files.deleteIfExists(Paths.get(attachment.getFilePath()));
        attachmentRepository.delete(attachment);
        log.info("Deleted attachment: {}", attachment.getFileName());
    }

    /**
     * 获取附件列表
     */
    public List<ExpenseAttachmentDTO> getAttachments(UUID expenseId) {
        return attachmentRepository.findByExpenseId(expenseId).stream()
                .map(this::toAttachmentDTO)
                .collect(Collectors.toList());
    }

    /**
     * 获取单个附件
     */
    public ExpenseAttachmentDTO getAttachment(UUID expenseId, UUID attachmentId) {
        ExpenseAttachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new EntityNotFoundException("Attachment not found with id: " + attachmentId));
        return toAttachmentDTO(attachment);
    }

    /**
     * 导出Excel
     */
    public byte[] exportToExcel(List<UUID> ids) throws IOException {
        List<Expense> expenses;
        if (ids != null && !ids.isEmpty()) {
            expenses = expenseRepository.findByIdsWithAttachments(ids);
        } else {
            expenses = expenseRepository.findAllWithDetails();
        }

        try (Workbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {

            Sheet sheet = workbook.createSheet("费用明细");

            // 创建表头样式
            CellStyle headerStyle = workbook.createCellStyle();
            headerStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);

            // 创建表头
            Row headerRow = sheet.createRow(0);
            String[] headers = {"费用日期", "费用类别", "费用金额", "税率", "税额", "含税金额", "关联项目", "描述", "附件数量"};
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            // 填充数据
            int rowNum = 1;
            for (Expense expense : expenses) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(expense.getExpenseDate().format(DATE_FORMATTER));
                row.createCell(1).setCellValue(getCategoryDisplayName(expense.getCategory()));
                row.createCell(2).setCellValue(expense.getAmount().doubleValue());
                row.createCell(3).setCellValue(expense.getTaxRate().multiply(new BigDecimal("100")).doubleValue() + "%");
                row.createCell(4).setCellValue(expense.getTaxAmount().doubleValue());
                row.createCell(5).setCellValue(expense.getAmountWithTax().doubleValue());
                row.createCell(6).setCellValue(expense.getProject() != null ? expense.getProject().getProjectName() : "");
                row.createCell(7).setCellValue(expense.getDescription() != null ? expense.getDescription() : "");
                row.createCell(8).setCellValue(expense.getAttachments() != null ? expense.getAttachments().size() : 0);
            }

            // 自动调整列宽
            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(outputStream);
            log.info("Exported {} expenses to Excel", expenses.size());
            return outputStream.toByteArray();
        }
    }

    private Specification<Expense> buildSpecification(ExpenseSearchParams params) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (params.getStartDate() != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("expenseDate"), params.getStartDate()));
            }
            if (params.getEndDate() != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("expenseDate"), params.getEndDate()));
            }
            if (params.getCategory() != null) {
                predicates.add(criteriaBuilder.equal(root.get("category"), params.getCategory()));
            }
            if (params.getProjectId() != null) {
                predicates.add(criteriaBuilder.equal(root.get("project").get("id"), params.getProjectId()));
            }

            query.orderBy(criteriaBuilder.desc(root.get("expenseDate")));
            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }

    private String getCategoryDisplayName(ExpenseCategory category) {
        return switch (category) {
            case TRAVEL -> "差旅费用";
            case BUSINESS -> "商务费用";
            case MANAGEMENT -> "管理费用";
            case OTHER -> "其他费用";
        };
    }

    private ExpenseDTO toDTO(Expense expense) {
        return ExpenseDTO.builder()
                .id(expense.getId())
                .expenseDate(expense.getExpenseDate())
                .category(expense.getCategory())
                .categoryDisplayName(getCategoryDisplayName(expense.getCategory()))
                .amount(expense.getAmount())
                .taxRate(expense.getTaxRate())
                .taxAmount(expense.getTaxAmount())
                .amountWithTax(expense.getAmountWithTax())
                .projectId(expense.getProject() != null ? expense.getProject().getId() : null)
                .projectName(expense.getProject() != null ? expense.getProject().getProjectName() : null)
                .description(expense.getDescription())
                .createdById(expense.getCreatedBy() != null ? expense.getCreatedBy().getId() : null)
                .createdByName(expense.getCreatedBy() != null ? expense.getCreatedBy().getName() : null)
                .attachmentCount(expense.getAttachments() != null ? expense.getAttachments().size() : 0)
                .createdAt(expense.getCreatedAt())
                .updatedAt(expense.getUpdatedAt())
                .build();
    }

    private ExpenseAttachmentDTO toAttachmentDTO(ExpenseAttachment attachment) {
        return ExpenseAttachmentDTO.builder()
                .id(attachment.getId())
                .expenseId(attachment.getExpense().getId())
                .fileName(attachment.getFileName())
                .filePath(attachment.getFilePath())
                .fileType(attachment.getFileType())
                .fileSize(attachment.getFileSize())
                .createdAt(attachment.getCreatedAt())
                .build();
    }
}
