package com.swcom.service.organization;

import com.swcom.dto.AIEmployeeConfigDTO;
import com.swcom.dto.AIEmployeeConfigForm;
import com.swcom.dto.EmployeeDTO;
import com.swcom.dto.EmployeeForm;
import com.swcom.entity.AIEmployeeConfig;
import com.swcom.entity.Department;
import com.swcom.entity.Employee;
import com.swcom.entity.Position;
import com.swcom.entity.enums.ConnectionStatus;
import com.swcom.entity.enums.EmployeeStatus;
import com.swcom.entity.enums.EmployeeType;
import com.swcom.repository.AIEmployeeConfigRepository;
import com.swcom.repository.DepartmentRepository;
import com.swcom.repository.EmployeeRepository;
import com.swcom.repository.PositionRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final DepartmentRepository departmentRepository;
    private final PositionRepository positionRepository;
    private final AIEmployeeConfigRepository aiEmployeeConfigRepository;

    public List<EmployeeDTO> getList(EmployeeType type, UUID departmentId, EmployeeStatus status) {
        List<Employee> employees;
        
        if (type != null) {
            employees = employeeRepository.findByEmployeeTypeWithRelations(type);
        } else if (departmentId != null) {
            employees = employeeRepository.findByDepartmentIdWithRelations(departmentId);
        } else if (status != null) {
            employees = employeeRepository.findByStatusWithRelations(status);
        } else {
            employees = employeeRepository.findAllWithRelations();
        }
        
        return employees.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public EmployeeDTO getById(UUID id) {
        Employee employee = employeeRepository.findByIdWithAllRelations(id)
                .orElseThrow(() -> new EntityNotFoundException("Employee not found with id: " + id));
        return toDTO(employee);
    }

    @Transactional
    public EmployeeDTO create(EmployeeForm form) {
        Employee employee = Employee.builder()
                .name(form.getName())
                .employeeType(form.getEmployeeType())
                .phone(form.getPhone())
                .sourceCompany(form.getSourceCompany())
                .dailyCost(form.getDailyCost() != null ? form.getDailyCost() : BigDecimal.ZERO)
                .status(EmployeeStatus.ACTIVE)
                .build();

        if (form.getDepartmentId() != null) {
            Department department = departmentRepository.findById(form.getDepartmentId())
                    .orElseThrow(() -> new EntityNotFoundException("Department not found with id: " + form.getDepartmentId()));
            employee.setDepartment(department);
        }

        if (form.getPositionId() != null) {
            Position position = positionRepository.findById(form.getPositionId())
                    .orElseThrow(() -> new EntityNotFoundException("Position not found with id: " + form.getPositionId()));
            employee.setPosition(position);
        }

        Employee saved = employeeRepository.save(employee);
        log.info("Created employee: {} (type: {})", saved.getName(), saved.getEmployeeType());
        return toDTO(saved);
    }

    @Transactional
    public EmployeeDTO update(UUID id, EmployeeForm form) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Employee not found with id: " + id));

        employee.setName(form.getName());
        employee.setEmployeeType(form.getEmployeeType());
        employee.setPhone(form.getPhone());
        employee.setSourceCompany(form.getSourceCompany());
        if (form.getDailyCost() != null) {
            employee.setDailyCost(form.getDailyCost());
        }

        if (form.getDepartmentId() != null) {
            Department department = departmentRepository.findById(form.getDepartmentId())
                    .orElseThrow(() -> new EntityNotFoundException("Department not found with id: " + form.getDepartmentId()));
            employee.setDepartment(department);
        } else {
            employee.setDepartment(null);
        }

        if (form.getPositionId() != null) {
            Position position = positionRepository.findById(form.getPositionId())
                    .orElseThrow(() -> new EntityNotFoundException("Position not found with id: " + form.getPositionId()));
            employee.setPosition(position);
        } else {
            employee.setPosition(null);
        }

        Employee saved = employeeRepository.save(employee);
        log.info("Updated employee: {}", saved.getName());
        return toDTO(saved);
    }

    @Transactional
    public void delete(UUID id) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Employee not found with id: " + id));
        employeeRepository.delete(employee);
        log.info("Deleted employee: {}", employee.getName());
    }

    @Transactional
    public EmployeeDTO updateStatus(UUID id, EmployeeStatus status) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Employee not found with id: " + id));
        employee.setStatus(status);
        Employee saved = employeeRepository.save(employee);
        log.info("Updated employee status: {} -> {}", saved.getName(), status);
        return toDTO(saved);
    }

    // AI Config methods
    public AIEmployeeConfigDTO getAIConfig(UUID employeeId) {
        AIEmployeeConfig config = aiEmployeeConfigRepository.findByEmployeeId(employeeId)
                .orElseThrow(() -> new EntityNotFoundException("AI config not found for employee: " + employeeId));
        return toConfigDTO(config);
    }

    @Transactional
    public AIEmployeeConfigDTO saveAIConfig(UUID employeeId, AIEmployeeConfigForm form) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new EntityNotFoundException("Employee not found with id: " + employeeId));

        if (employee.getEmployeeType() != EmployeeType.AI) {
            throw new IllegalArgumentException("Can only configure AI settings for AI employees");
        }

        AIEmployeeConfig config = aiEmployeeConfigRepository.findByEmployeeId(employeeId)
                .orElse(AIEmployeeConfig.builder()
                        .employee(employee)
                        .connectionStatus(ConnectionStatus.UNKNOWN)
                        .build());

        config.setApiUrl(form.getApiUrl());
        config.setApiKey(form.getApiKey());
        config.setModelName(form.getModelName());
        config.setRolePrompt(form.getRolePrompt());

        AIEmployeeConfig saved = aiEmployeeConfigRepository.save(config);
        log.info("Saved AI config for employee: {}", employee.getName());
        return toConfigDTO(saved);
    }

    private EmployeeDTO toDTO(Employee employee) {
        EmployeeDTO dto = EmployeeDTO.builder()
                .id(employee.getId())
                .name(employee.getName())
                .employeeType(employee.getEmployeeType())
                .phone(employee.getPhone())
                .sourceCompany(employee.getSourceCompany())
                .positionId(employee.getPosition() != null ? employee.getPosition().getId() : null)
                .positionName(employee.getPosition() != null ? employee.getPosition().getName() : null)
                .departmentId(employee.getDepartment() != null ? employee.getDepartment().getId() : null)
                .departmentName(employee.getDepartment() != null ? employee.getDepartment().getName() : null)
                .dailyCost(employee.getDailyCost())
                .status(employee.getStatus())
                .createdAt(employee.getCreatedAt())
                .updatedAt(employee.getUpdatedAt())
                .build();

        if (employee.getAiConfig() != null) {
            dto.setAiConfig(toConfigDTO(employee.getAiConfig()));
        }

        return dto;
    }

    private AIEmployeeConfigDTO toConfigDTO(AIEmployeeConfig config) {
        return AIEmployeeConfigDTO.builder()
                .id(config.getId())
                .employeeId(config.getEmployee().getId())
                .apiUrl(config.getApiUrl())
                .modelName(config.getModelName())
                .rolePrompt(config.getRolePrompt())
                .connectionStatus(config.getConnectionStatus())
                .lastTestTime(config.getLastTestTime())
                .availableModels(config.getAvailableModels())
                .createdAt(config.getCreatedAt())
                .updatedAt(config.getUpdatedAt())
                .build();
    }
}
