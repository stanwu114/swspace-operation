package com.swcom.repository;

import com.swcom.entity.AsyncMessageTask;
import com.swcom.entity.enums.AsyncTaskStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AsyncMessageTaskRepository extends JpaRepository<AsyncMessageTask, UUID> {

    @Query("SELECT t FROM AsyncMessageTask t WHERE t.status = :status ORDER BY t.priority ASC, t.createdAt ASC")
    List<AsyncMessageTask> findByStatusOrderByPriority(@Param("status") AsyncTaskStatus status);

    List<AsyncMessageTask> findByBindingIdOrderByCreatedAtDesc(UUID bindingId);

    Page<AsyncMessageTask> findAllByOrderByCreatedAtDesc(Pageable pageable);

    long countByStatus(AsyncTaskStatus status);
}
