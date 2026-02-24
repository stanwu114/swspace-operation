package com.swcom.repository;

import com.swcom.entity.Expense;
import com.swcom.entity.enums.ExpenseCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ExpenseRepository extends JpaRepository<Expense, UUID>, JpaSpecificationExecutor<Expense> {

    @Query("SELECT e FROM Expense e LEFT JOIN FETCH e.project LEFT JOIN FETCH e.createdBy ORDER BY e.expenseDate DESC")
    List<Expense> findAllWithDetails();

    @Query("SELECT e FROM Expense e LEFT JOIN FETCH e.project LEFT JOIN FETCH e.createdBy WHERE e.id = :id")
    Optional<Expense> findByIdWithDetails(@Param("id") UUID id);

    @Query("SELECT e FROM Expense e LEFT JOIN FETCH e.project LEFT JOIN FETCH e.createdBy " +
           "WHERE e.expenseDate BETWEEN :startDate AND :endDate ORDER BY e.expenseDate DESC")
    List<Expense> findByDateRange(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    @Query("SELECT e FROM Expense e LEFT JOIN FETCH e.project LEFT JOIN FETCH e.createdBy " +
           "WHERE e.category = :category ORDER BY e.expenseDate DESC")
    List<Expense> findByCategory(@Param("category") ExpenseCategory category);

    @Query("SELECT e FROM Expense e LEFT JOIN FETCH e.project LEFT JOIN FETCH e.createdBy " +
           "WHERE e.project.id = :projectId ORDER BY e.expenseDate DESC")
    List<Expense> findByProjectId(@Param("projectId") UUID projectId);

    @Query("SELECT e FROM Expense e LEFT JOIN FETCH e.project LEFT JOIN FETCH e.createdBy LEFT JOIN FETCH e.attachments " +
           "WHERE e.id IN :ids ORDER BY e.expenseDate DESC")
    List<Expense> findByIdsWithAttachments(@Param("ids") List<UUID> ids);

    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM Expense e WHERE e.category = :category")
    java.math.BigDecimal sumAmountByCategory(@Param("category") ExpenseCategory category);

    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM Expense e WHERE e.project.id = :projectId")
    java.math.BigDecimal sumAmountByProjectId(@Param("projectId") UUID projectId);

    long countByCategory(ExpenseCategory category);
}
