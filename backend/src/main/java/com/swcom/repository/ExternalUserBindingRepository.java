package com.swcom.repository;

import com.swcom.entity.ExternalUserBinding;
import com.swcom.entity.enums.BindingStatus;
import com.swcom.entity.enums.PlatformType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ExternalUserBindingRepository extends JpaRepository<ExternalUserBinding, UUID> {

    Optional<ExternalUserBinding> findByPlatformTypeAndPlatformUserIdAndBindingStatus(
            PlatformType platformType, String platformUserId, BindingStatus bindingStatus);

    Optional<ExternalUserBinding> findByBindingCodeAndBindingStatus(
            String bindingCode, BindingStatus bindingStatus);

    @Query("SELECT b FROM ExternalUserBinding b LEFT JOIN FETCH b.employee WHERE b.bindingStatus = :status ORDER BY b.createdAt DESC")
    List<ExternalUserBinding> findByBindingStatusWithEmployee(@Param("status") BindingStatus status);

    @Query("SELECT b FROM ExternalUserBinding b LEFT JOIN FETCH b.employee ORDER BY b.createdAt DESC")
    List<ExternalUserBinding> findAllWithEmployee();

    @Query("SELECT b FROM ExternalUserBinding b LEFT JOIN FETCH b.employee WHERE b.employee.id = :employeeId")
    List<ExternalUserBinding> findByEmployeeId(@Param("employeeId") UUID employeeId);

    @Query("SELECT b FROM ExternalUserBinding b WHERE b.bindingCode IS NOT NULL AND b.bindingStatus = 'PENDING' AND b.codeExpiresAt < :now")
    List<ExternalUserBinding> findExpiredPendingBindings(@Param("now") LocalDateTime now);
}
