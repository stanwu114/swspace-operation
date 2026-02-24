package com.swcom.repository;

import com.swcom.entity.Employee;
import com.swcom.entity.enums.EmployeeStatus;
import com.swcom.entity.enums.EmployeeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, UUID> {

    @Query("SELECT e FROM Employee e LEFT JOIN FETCH e.department LEFT JOIN FETCH e.position ORDER BY e.createdAt DESC")
    List<Employee> findAllWithRelations();

    @Query("SELECT e FROM Employee e LEFT JOIN FETCH e.department LEFT JOIN FETCH e.position WHERE e.employeeType = :type ORDER BY e.createdAt DESC")
    List<Employee> findByEmployeeTypeWithRelations(@Param("type") EmployeeType type);

    @Query("SELECT e FROM Employee e LEFT JOIN FETCH e.department LEFT JOIN FETCH e.position WHERE e.department.id = :departmentId ORDER BY e.createdAt DESC")
    List<Employee> findByDepartmentIdWithRelations(@Param("departmentId") UUID departmentId);

    @Query("SELECT e FROM Employee e LEFT JOIN FETCH e.department LEFT JOIN FETCH e.position WHERE e.status = :status ORDER BY e.createdAt DESC")
    List<Employee> findByStatusWithRelations(@Param("status") EmployeeStatus status);

    @Query("SELECT e FROM Employee e LEFT JOIN FETCH e.department LEFT JOIN FETCH e.position LEFT JOIN FETCH e.aiConfig WHERE e.id = :id")
    Optional<Employee> findByIdWithAllRelations(@Param("id") UUID id);

    List<Employee> findByEmployeeType(EmployeeType employeeType);

    List<Employee> findByDepartmentId(UUID departmentId);

    List<Employee> findByStatus(EmployeeStatus status);

    long countByEmployeeType(EmployeeType employeeType);

    long countByStatus(EmployeeStatus status);
}
