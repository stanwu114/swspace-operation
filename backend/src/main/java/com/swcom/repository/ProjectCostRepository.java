package com.swcom.repository;

import com.swcom.entity.ProjectCost;
import com.swcom.entity.enums.CostType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Repository
public interface ProjectCostRepository extends JpaRepository<ProjectCost, UUID> {

    List<ProjectCost> findByProjectIdOrderByCostDateDesc(UUID projectId);

    List<ProjectCost> findByProjectIdAndCostType(UUID projectId, CostType costType);

    @Query("SELECT COALESCE(SUM(c.amount), 0) FROM ProjectCost c WHERE c.project.id = :projectId")
    BigDecimal getTotalCostByProjectId(@Param("projectId") UUID projectId);

    @Query("SELECT COALESCE(SUM(c.amount), 0) FROM ProjectCost c WHERE c.project.id = :projectId AND c.costType = :costType")
    BigDecimal getTotalCostByProjectIdAndType(@Param("projectId") UUID projectId, @Param("costType") CostType costType);
}
