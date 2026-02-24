package com.swcom.repository;

import com.swcom.entity.Contract;
import com.swcom.entity.enums.ContractStatus;
import com.swcom.entity.enums.ContractType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ContractRepository extends JpaRepository<Contract, UUID> {

    @Query("SELECT c FROM Contract c " +
           "LEFT JOIN FETCH c.project " +
           "ORDER BY c.createdAt DESC")
    List<Contract> findAllWithProject();

    @Query("SELECT c FROM Contract c " +
           "LEFT JOIN FETCH c.project " +
           "LEFT JOIN FETCH c.bidInfo " +
           "LEFT JOIN FETCH c.paymentNodes " +
           "WHERE c.id = :id")
    Optional<Contract> findByIdWithDetails(@Param("id") UUID id);

    @Query("SELECT c FROM Contract c " +
           "LEFT JOIN FETCH c.project " +
           "WHERE c.contractType = :type")
    List<Contract> findByTypeWithProject(@Param("type") ContractType type);

    @Query("SELECT c FROM Contract c " +
           "LEFT JOIN FETCH c.project " +
           "WHERE c.status = :status")
    List<Contract> findByStatusWithProject(@Param("status") ContractStatus status);

    @Query("SELECT c FROM Contract c " +
           "LEFT JOIN FETCH c.project " +
           "WHERE c.project.id = :projectId")
    List<Contract> findByProjectIdWithProject(@Param("projectId") UUID projectId);

    List<Contract> findByContractType(ContractType contractType);

    List<Contract> findByStatus(ContractStatus status);
}
