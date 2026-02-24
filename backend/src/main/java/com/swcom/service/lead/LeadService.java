package com.swcom.service.lead;

import com.swcom.dto.*;
import com.swcom.entity.*;
import com.swcom.entity.enums.LeadStatus;
import com.swcom.repository.*;
import jakarta.persistence.EntityNotFoundException;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class LeadService {

    private final LeadRepository leadRepository;
    private final LeadTrackingLogRepository logRepository;
    private final EmployeeRepository employeeRepository;

    // ==================== Lead CRUD ====================

    public List<LeadDTO> getAll() {
        return leadRepository.findAllWithOwner().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<LeadDTO> search(LeadStatus status, UUID ownerId, String customerName, String tag) {
        if (status == null && ownerId == null && (customerName == null || customerName.isBlank()) && (tag == null || tag.isBlank())) {
            return getAll();
        }

        Specification<Lead> spec = buildSpecification(status, ownerId, customerName, tag);
        return leadRepository.findAll(spec).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public LeadDTO getById(UUID id) {
        Lead lead = leadRepository.findByIdWithOwner(id)
                .orElseThrow(() -> new EntityNotFoundException("Lead not found with id: " + id));
        return toDTO(lead);
    }

    @Transactional
    public LeadDTO create(LeadForm form) {
        Lead lead = Lead.builder()
                .leadName(form.getLeadName())
                .sourceChannel(form.getSourceChannel())
                .customerName(form.getCustomerName())
                .contactPerson(form.getContactPerson())
                .contactPhone(form.getContactPhone())
                .estimatedAmount(form.getEstimatedAmount())
                .description(form.getDescription())
                .tags(tagsToString(form.getTags()))
                .status(form.getStatus() != null ? form.getStatus() : LeadStatus.NEW)
                .build();

        if (form.getOwnerId() != null) {
            Employee owner = employeeRepository.findById(form.getOwnerId())
                    .orElseThrow(() -> new EntityNotFoundException("Owner not found"));
            lead.setOwner(owner);
        }

        Lead saved = leadRepository.save(lead);
        log.info("Created lead: {} ({})", saved.getLeadName(), saved.getId());
        return toDTO(saved);
    }

    @Transactional
    public LeadDTO update(UUID id, LeadForm form) {
        Lead lead = leadRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Lead not found with id: " + id));

        lead.setLeadName(form.getLeadName());
        lead.setSourceChannel(form.getSourceChannel());
        lead.setCustomerName(form.getCustomerName());
        lead.setContactPerson(form.getContactPerson());
        lead.setContactPhone(form.getContactPhone());
        lead.setEstimatedAmount(form.getEstimatedAmount());
        lead.setDescription(form.getDescription());
        lead.setTags(tagsToString(form.getTags()));

        if (form.getStatus() != null) {
            lead.setStatus(form.getStatus());
        }

        if (form.getOwnerId() != null) {
            Employee owner = employeeRepository.findById(form.getOwnerId())
                    .orElseThrow(() -> new EntityNotFoundException("Owner not found"));
            lead.setOwner(owner);
        } else {
            lead.setOwner(null);
        }

        Lead saved = leadRepository.save(lead);
        log.info("Updated lead: {} ({})", saved.getLeadName(), saved.getId());
        return toDTO(saved);
    }

    @Transactional
    public LeadDTO updateStatus(UUID id, LeadStatus status) {
        Lead lead = leadRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Lead not found with id: " + id));
        
        lead.setStatus(status);
        Lead saved = leadRepository.save(lead);
        log.info("Updated lead status: {} -> {}", saved.getLeadName(), status);
        return toDTO(saved);
    }

    @Transactional
    public void delete(UUID id) {
        Lead lead = leadRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Lead not found with id: " + id));
        leadRepository.delete(lead);
        log.info("Deleted lead: {} ({})", lead.getLeadName(), id);
    }

    // ==================== Lead Tracking Log CRUD ====================

    public List<LeadTrackingLogDTO> getLogs(UUID leadId) {
        if (!leadRepository.existsById(leadId)) {
            throw new EntityNotFoundException("Lead not found with id: " + leadId);
        }
        return logRepository.findByLeadIdWithCreator(leadId).stream()
                .map(this::toLogDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public LeadTrackingLogDTO createLog(UUID leadId, LeadTrackingLogForm form) {
        Lead lead = leadRepository.findById(leadId)
                .orElseThrow(() -> new EntityNotFoundException("Lead not found with id: " + leadId));

        LeadTrackingLog trackingLog = LeadTrackingLog.builder()
                .lead(lead)
                .logDate(form.getLogDate())
                .logTitle(form.getLogTitle())
                .logContent(form.getLogContent())
                .build();

        LeadTrackingLog saved = logRepository.save(trackingLog);
        log.info("Created tracking log for lead: {} ({})", lead.getLeadName(), saved.getId());
        return toLogDTO(saved);
    }

    @Transactional
    public LeadTrackingLogDTO updateLog(UUID leadId, UUID logId, LeadTrackingLogForm form) {
        if (!leadRepository.existsById(leadId)) {
            throw new EntityNotFoundException("Lead not found with id: " + leadId);
        }

        LeadTrackingLog trackingLog = logRepository.findById(logId)
                .orElseThrow(() -> new EntityNotFoundException("Tracking log not found with id: " + logId));

        if (!trackingLog.getLead().getId().equals(leadId)) {
            throw new IllegalArgumentException("Tracking log does not belong to the specified lead");
        }

        trackingLog.setLogDate(form.getLogDate());
        trackingLog.setLogTitle(form.getLogTitle());
        trackingLog.setLogContent(form.getLogContent());

        LeadTrackingLog saved = logRepository.save(trackingLog);
        log.info("Updated tracking log: {}", saved.getId());
        return toLogDTO(saved);
    }

    @Transactional
    public void deleteLog(UUID leadId, UUID logId) {
        if (!leadRepository.existsById(leadId)) {
            throw new EntityNotFoundException("Lead not found with id: " + leadId);
        }

        LeadTrackingLog trackingLog = logRepository.findById(logId)
                .orElseThrow(() -> new EntityNotFoundException("Tracking log not found with id: " + logId));

        if (!trackingLog.getLead().getId().equals(leadId)) {
            throw new IllegalArgumentException("Tracking log does not belong to the specified lead");
        }

        logRepository.delete(trackingLog);
        log.info("Deleted tracking log: {}", logId);
    }

    // ==================== Helper Methods ====================

    public List<String> getAllTags() {
        return leadRepository.findAllDistinctTags().stream()
                .flatMap(tags -> Arrays.stream(tags.split(",")))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .distinct()
                .sorted()
                .collect(Collectors.toList());
    }

    private Specification<Lead> buildSpecification(LeadStatus status, UUID ownerId, String customerName, String tag) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (ownerId != null) {
                predicates.add(cb.equal(root.get("owner").get("id"), ownerId));
            }
            if (customerName != null && !customerName.isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("customerName")), 
                        "%" + customerName.toLowerCase() + "%"));
            }
            if (tag != null && !tag.isBlank()) {
                predicates.add(cb.like(root.get("tags"), "%" + tag + "%"));
            }

            query.orderBy(cb.desc(root.get("createdAt")));
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private String tagsToString(List<String> tags) {
        if (tags == null || tags.isEmpty()) {
            return null;
        }
        return String.join(",", tags);
    }

    private List<String> stringToTags(String tags) {
        if (tags == null || tags.isBlank()) {
            return new ArrayList<>();
        }
        return Arrays.stream(tags.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());
    }

    private LeadDTO toDTO(Lead lead) {
        long logCount = logRepository.countByLeadId(lead.getId());

        return LeadDTO.builder()
                .id(lead.getId())
                .leadName(lead.getLeadName())
                .sourceChannel(lead.getSourceChannel())
                .customerName(lead.getCustomerName())
                .contactPerson(lead.getContactPerson())
                .contactPhone(lead.getContactPhone())
                .estimatedAmount(lead.getEstimatedAmount())
                .description(lead.getDescription())
                .tags(stringToTags(lead.getTags()))
                .status(lead.getStatus())
                .ownerId(lead.getOwner() != null ? lead.getOwner().getId() : null)
                .ownerName(lead.getOwner() != null ? lead.getOwner().getName() : null)
                .logCount((int) logCount)
                .createdAt(lead.getCreatedAt())
                .updatedAt(lead.getUpdatedAt())
                .build();
    }

    private LeadTrackingLogDTO toLogDTO(LeadTrackingLog log) {
        return LeadTrackingLogDTO.builder()
                .id(log.getId())
                .leadId(log.getLead().getId())
                .logDate(log.getLogDate())
                .logTitle(log.getLogTitle())
                .logContent(log.getLogContent())
                .createdById(log.getCreatedBy() != null ? log.getCreatedBy().getId() : null)
                .createdByName(log.getCreatedBy() != null ? log.getCreatedBy().getName() : null)
                .createdAt(log.getCreatedAt())
                .build();
    }
}
