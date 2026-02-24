package com.swcom.repository;

import com.swcom.entity.LeadTrackingLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface LeadTrackingLogRepository extends JpaRepository<LeadTrackingLog, UUID> {

    @Query("SELECT l FROM LeadTrackingLog l LEFT JOIN FETCH l.createdBy WHERE l.lead.id = :leadId ORDER BY l.logDate DESC, l.createdAt DESC")
    List<LeadTrackingLog> findByLeadIdWithCreator(@Param("leadId") UUID leadId);

    @Query("SELECT l FROM LeadTrackingLog l LEFT JOIN FETCH l.createdBy WHERE l.id = :id")
    Optional<LeadTrackingLog> findByIdWithCreator(@Param("id") UUID id);

    long countByLeadId(UUID leadId);

    @Query("SELECT l.lead.id, COUNT(l.id) FROM LeadTrackingLog l WHERE l.lead.id IN :leadIds GROUP BY l.lead.id")
    List<Object[]> countByLeadIds(@Param("leadIds") List<UUID> leadIds);
}
