package com.swcom.repository;

import com.swcom.entity.Department;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DepartmentRepository extends JpaRepository<Department, UUID> {

    List<Department> findByParentIsNullOrderBySortOrderAsc();

    List<Department> findByParentIdOrderBySortOrderAsc(UUID parentId);

    @Query("SELECT d FROM Department d LEFT JOIN FETCH d.children WHERE d.parent IS NULL ORDER BY d.sortOrder")
    List<Department> findAllWithChildren();

    boolean existsByName(String name);

    boolean existsByNameAndIdNot(String name, UUID id);
}
