package com.swcom.repository;

import com.swcom.entity.ExternalMessageLog;
import com.swcom.entity.enums.PlatformType;
import com.swcom.entity.enums.ProcessingStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface ExternalMessageLogRepository extends JpaRepository<ExternalMessageLog, UUID> {

    Page<ExternalMessageLog> findByPlatformTypeOrderByCreatedAtDesc(PlatformType platformType, Pageable pageable);

    List<ExternalMessageLog> findByBindingIdOrderByCreatedAtDesc(UUID bindingId);

    @Query("SELECT m FROM ExternalMessageLog m WHERE m.processingStatus = :status ORDER BY m.createdAt ASC")
    List<ExternalMessageLog> findByProcessingStatus(@Param("status") ProcessingStatus status);

    @Query("SELECT COUNT(m) FROM ExternalMessageLog m WHERE m.binding.id = :bindingId AND m.createdAt > :since")
    long countByBindingIdSince(@Param("bindingId") UUID bindingId, @Param("since") LocalDateTime since);

    Page<ExternalMessageLog> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
