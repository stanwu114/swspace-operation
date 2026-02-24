package com.swcom.repository;

import com.swcom.entity.Lead;
import com.swcom.entity.enums.LeadStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface LeadRepository extends JpaRepository<Lead, UUID>, JpaSpecificationExecutor<Lead> {

    @Query("SELECT l FROM Lead l LEFT JOIN FETCH l.owner ORDER BY l.createdAt DESC")
    List<Lead> findAllWithOwner();

    @Query("SELECT l FROM Lead l LEFT JOIN FETCH l.owner WHERE l.id = :id")
    Optional<Lead> findByIdWithOwner(@Param("id") UUID id);

    @Query("SELECT l FROM Lead l LEFT JOIN FETCH l.owner WHERE l.status = :status ORDER BY l.createdAt DESC")
    List<Lead> findByStatusWithOwner(@Param("status") LeadStatus status);

    @Query("SELECT l FROM Lead l LEFT JOIN FETCH l.owner WHERE l.owner.id = :ownerId ORDER BY l.createdAt DESC")
    List<Lead> findByOwnerIdWithOwner(@Param("ownerId") UUID ownerId);

    long countByStatus(LeadStatus status);

    @Query("SELECT DISTINCT l.tags FROM Lead l WHERE l.tags IS NOT NULL AND l.tags <> ''")
    List<String> findAllDistinctTags();
}
