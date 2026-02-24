package com.swcom.service.organization;

import com.swcom.dto.PositionDTO;
import com.swcom.dto.PositionForm;
import com.swcom.entity.Department;
import com.swcom.entity.Position;
import com.swcom.repository.DepartmentRepository;
import com.swcom.repository.PositionRepository;
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
public class PositionService {

    private final PositionRepository positionRepository;
    private final DepartmentRepository departmentRepository;

    public List<PositionDTO> getList(UUID departmentId) {
        List<Position> positions;
        if (departmentId != null) {
            positions = positionRepository.findByDepartmentIdWithDepartment(departmentId);
        } else {
            positions = positionRepository.findAllWithDepartment();
        }
        return positions.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public PositionDTO getById(UUID id) {
        Position position = positionRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Position not found with id: " + id));
        return toDTO(position);
    }

    @Transactional
    public PositionDTO create(PositionForm form) {
        Department department = departmentRepository.findById(form.getDepartmentId())
                .orElseThrow(() -> new EntityNotFoundException("Department not found with id: " + form.getDepartmentId()));

        Position position = Position.builder()
                .name(form.getName())
                .department(department)
                .responsibilities(form.getResponsibilities())
                .sortOrder(form.getSortOrder() != null ? form.getSortOrder() : 0)
                .build();

        Position saved = positionRepository.save(position);
        log.info("Created position: {}", saved.getName());
        return toDTO(saved);
    }

    @Transactional
    public PositionDTO update(UUID id, PositionForm form) {
        Position position = positionRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Position not found with id: " + id));

        Department department = departmentRepository.findById(form.getDepartmentId())
                .orElseThrow(() -> new EntityNotFoundException("Department not found with id: " + form.getDepartmentId()));

        position.setName(form.getName());
        position.setDepartment(department);
        position.setResponsibilities(form.getResponsibilities());
        if (form.getSortOrder() != null) {
            position.setSortOrder(form.getSortOrder());
        }

        Position saved = positionRepository.save(position);
        log.info("Updated position: {}", saved.getName());
        return toDTO(saved);
    }

    @Transactional
    public void delete(UUID id) {
        Position position = positionRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Position not found with id: " + id));
        positionRepository.delete(position);
        log.info("Deleted position: {}", position.getName());
    }

    private PositionDTO toDTO(Position position) {
        return PositionDTO.builder()
                .id(position.getId())
                .name(position.getName())
                .departmentId(position.getDepartment() != null ? position.getDepartment().getId() : null)
                .departmentName(position.getDepartment() != null ? position.getDepartment().getName() : null)
                .responsibilities(position.getResponsibilities())
                .sortOrder(position.getSortOrder())
                .createdAt(position.getCreatedAt())
                .updatedAt(position.getUpdatedAt())
                .build();
    }
}
