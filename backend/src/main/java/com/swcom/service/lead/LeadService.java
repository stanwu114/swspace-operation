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

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@SuppressWarnings("null")
public class LeadService {

    private final LeadRepository leadRepository;
    private final LeadTrackingLogRepository logRepository;
    private final EmployeeRepository employeeRepository;

    // ==================== Lead CRUD ====================

    public List<LeadDTO> getAll() {
        List<Lead> leads = leadRepository.findAllWithOwner();
        return toDTOList(leads);
    }

    public List<LeadDTO> search(LeadStatus status, UUID ownerId, String customerName, String tag) {
        if (status == null && ownerId == null && (customerName == null || customerName.isBlank()) && (tag == null || tag.isBlank())) {
            return getAll();
        }

        Specification<Lead> spec = buildSpecification(status, ownerId, customerName, tag);
        List<Lead> leads = leadRepository.findAll(spec);
        return toDTOList(leads);
    }

    public LeadDTO getById(UUID id) {
        Lead lead = leadRepository.findByIdWithOwner(id)
                .orElseThrow(() -> new EntityNotFoundException("Lead not found with id: " + id));
        return toDTO(lead, logRepository.countByLeadId(lead.getId()));
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
        log.debug("Created lead: {} ({})", saved.getLeadName(), saved.getId());
        return toDTO(saved, 0);
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
        log.debug("Updated lead: {} ({})", saved.getLeadName(), saved.getId());
        return toDTO(saved, logRepository.countByLeadId(saved.getId()));
    }

    @Transactional
    public LeadDTO updateStatus(UUID id, LeadStatus status) {
        Lead lead = leadRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Lead not found with id: " + id));

        lead.setStatus(status);
        Lead saved = leadRepository.save(lead);
        log.debug("Updated lead status: {} -> {}", saved.getLeadName(), status);
        return toDTO(saved, logRepository.countByLeadId(saved.getId()));
    }

    @Transactional
    public void delete(UUID id) {
        Lead lead = leadRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Lead not found with id: " + id));
        leadRepository.delete(lead);
        log.debug("Deleted lead: {} ({})", lead.getLeadName(), id);
    }

    // ==================== Lead Tracking Log CRUD ====================

    public List<LeadTrackingLogDTO> getLogs(UUID leadId) {
        validateLeadExists(leadId);
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
        log.debug("Created tracking log for lead: {} ({})", lead.getLeadName(), saved.getId());
        return toLogDTO(saved);
    }

    @Transactional
    public LeadTrackingLogDTO updateLog(UUID leadId, UUID logId, LeadTrackingLogForm form) {
        validateLeadExists(leadId);

        LeadTrackingLog trackingLog = logRepository.findById(logId)
                .orElseThrow(() -> new EntityNotFoundException("Tracking log not found with id: " + logId));

        if (!trackingLog.getLead().getId().equals(leadId)) {
            throw new IllegalArgumentException("Tracking log does not belong to the specified lead");
        }

        trackingLog.setLogDate(form.getLogDate());
        trackingLog.setLogTitle(form.getLogTitle());
        trackingLog.setLogContent(form.getLogContent());

        LeadTrackingLog saved = logRepository.save(trackingLog);
        log.debug("Updated tracking log: {}", saved.getId());
        return toLogDTO(saved);
    }

    @Transactional
    public void deleteLog(UUID leadId, UUID logId) {
        validateLeadExists(leadId);

        LeadTrackingLog trackingLog = logRepository.findById(logId)
                .orElseThrow(() -> new EntityNotFoundException("Tracking log not found with id: " + logId));

        if (!trackingLog.getLead().getId().equals(leadId)) {
            throw new IllegalArgumentException("Tracking log does not belong to the specified lead");
        }

        logRepository.delete(trackingLog);
        log.debug("Deleted tracking log: {}", logId);
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

    private void validateLeadExists(UUID leadId) {
        if (!leadRepository.existsById(leadId)) {
            throw new EntityNotFoundException("Lead not found with id: " + leadId);
        }
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
                String exactTag = tag.trim();
                Predicate tagPredicate = cb.or(
                        cb.equal(root.get("tags"), exactTag),
                        cb.like(root.get("tags"), exactTag + ",%"),
                        cb.like(root.get("tags"), "%," + exactTag + ",%"),
                        cb.like(root.get("tags"), "%," + exactTag)
                );
                predicates.add(tagPredicate);
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

    /**
     * Batch convert leads to DTOs, fetching logCounts in a single query.
     */
    private List<LeadDTO> toDTOList(List<Lead> leads) {
        if (leads.isEmpty()) {
            return new ArrayList<>();
        }

        List<UUID> leadIds = leads.stream().map(Lead::getId).collect(Collectors.toList());
        Map<UUID, Long> logCountMap = new HashMap<>();
        for (Object[] row : logRepository.countByLeadIds(leadIds)) {
            logCountMap.put((UUID) row[0], (Long) row[1]);
        }

        return leads.stream()
                .map(lead -> toDTO(lead, logCountMap.getOrDefault(lead.getId(), 0L)))
                .collect(Collectors.toList());
    }

    private LeadDTO toDTO(Lead lead, long logCount) {
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
