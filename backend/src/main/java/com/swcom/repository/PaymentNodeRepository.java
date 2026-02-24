package com.swcom.repository;

import com.swcom.entity.PaymentNode;
import com.swcom.entity.enums.PaymentNodeStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Repository
public interface PaymentNodeRepository extends JpaRepository<PaymentNode, UUID> {

    List<PaymentNode> findByContractIdOrderByNodeOrderAsc(UUID contractId);

    List<PaymentNode> findByStatus(PaymentNodeStatus status);

    @Query("SELECT SUM(p.plannedAmount) FROM PaymentNode p WHERE p.contract.id = :contractId")
    BigDecimal getTotalPlannedAmount(@Param("contractId") UUID contractId);

    @Query("SELECT SUM(p.actualAmount) FROM PaymentNode p WHERE p.contract.id = :contractId AND p.actualAmount IS NOT NULL")
    BigDecimal getTotalActualAmount(@Param("contractId") UUID contractId);

    @Query("SELECT COUNT(p) FROM PaymentNode p WHERE p.contract.id = :contractId AND p.status = :status")
    long countByContractIdAndStatus(@Param("contractId") UUID contractId, @Param("status") PaymentNodeStatus status);
}
