package com.swcom.service.organization;

import com.swcom.dto.DepartmentDTO;
import com.swcom.dto.DepartmentForm;
import com.swcom.entity.Department;
import com.swcom.repository.DepartmentRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@SuppressWarnings("null")
public class DepartmentService {

    private final DepartmentRepository departmentRepository;

    public List<DepartmentDTO> getTree() {
        List<Department> rootDepartments = departmentRepository.findByParentIsNullOrderBySortOrderAsc();
        return rootDepartments.stream()
                .map(this::toDTOWithChildren)
                .collect(Collectors.toList());
    }

    public List<DepartmentDTO> getList() {
        return departmentRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public DepartmentDTO getById(UUID id) {
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Department not found with id: " + id));
        return toDTO(department);
    }

    @Transactional
    public DepartmentDTO create(DepartmentForm form) {
        Department department = Department.builder()
                .name(form.getName())
                .description(form.getDescription())
                .sortOrder(form.getSortOrder() != null ? form.getSortOrder() : 0)
                .build();

        if (form.getParentId() != null) {
            Department parent = departmentRepository.findById(form.getParentId())
                    .orElseThrow(() -> new EntityNotFoundException("Parent department not found with id: " + form.getParentId()));
            department.setParent(parent);
        }

        Department saved = departmentRepository.save(department);
        log.info("Created department: {}", saved.getName());
        return toDTO(saved);
    }

    @Transactional
    public DepartmentDTO update(UUID id, DepartmentForm form) {
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Department not found with id: " + id));

        department.setName(form.getName());
        department.setDescription(form.getDescription());
        if (form.getSortOrder() != null) {
            department.setSortOrder(form.getSortOrder());
        }

        if (form.getParentId() != null) {
            if (form.getParentId().equals(id)) {
                throw new IllegalArgumentException("Department cannot be its own parent");
            }
            Department parent = departmentRepository.findById(form.getParentId())
                    .orElseThrow(() -> new EntityNotFoundException("Parent department not found with id: " + form.getParentId()));
            department.setParent(parent);
        } else {
            department.setParent(null);
        }

        Department saved = departmentRepository.save(department);
        log.info("Updated department: {}", saved.getName());
        return toDTO(saved);
    }

    @Transactional
    public void delete(UUID id) {
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Department not found with id: " + id));
        departmentRepository.delete(department);
        log.info("Deleted department: {}", department.getName());
    }

    private DepartmentDTO toDTO(Department department) {
        return DepartmentDTO.builder()
                .id(department.getId())
                .name(department.getName())
                .parentId(department.getParent() != null ? department.getParent().getId() : null)
                .description(department.getDescription())
                .sortOrder(department.getSortOrder())
                .createdAt(department.getCreatedAt())
                .updatedAt(department.getUpdatedAt())
                .build();
    }

    private DepartmentDTO toDTOWithChildren(Department department) {
        DepartmentDTO dto = toDTO(department);
        if (department.getChildren() != null && !department.getChildren().isEmpty()) {
            dto.setChildren(department.getChildren().stream()
                    .map(this::toDTOWithChildren)
                    .collect(Collectors.toList()));
        }
        return dto;
    }
}
