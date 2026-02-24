package com.swcom.repository;

import com.swcom.entity.AIEmployeeConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface AIEmployeeConfigRepository extends JpaRepository<AIEmployeeConfig, UUID> {

    Optional<AIEmployeeConfig> findByEmployeeId(UUID employeeId);

    boolean existsByEmployeeId(UUID employeeId);

    void deleteByEmployeeId(UUID employeeId);
}
