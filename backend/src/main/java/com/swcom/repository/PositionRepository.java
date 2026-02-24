package com.swcom.repository;

import com.swcom.entity.Position;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PositionRepository extends JpaRepository<Position, UUID> {

    @Query("SELECT p FROM Position p LEFT JOIN FETCH p.department ORDER BY p.sortOrder")
    List<Position> findAllWithDepartment();

    @Query("SELECT p FROM Position p LEFT JOIN FETCH p.department WHERE p.department.id = :departmentId ORDER BY p.sortOrder")
    List<Position> findByDepartmentIdWithDepartment(@Param("departmentId") UUID departmentId);

    List<Position> findByDepartmentIdOrderBySortOrderAsc(UUID departmentId);

    boolean existsByNameAndDepartmentId(String name, UUID departmentId);
}
