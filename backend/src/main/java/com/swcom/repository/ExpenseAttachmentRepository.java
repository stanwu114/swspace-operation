package com.swcom.repository;

import com.swcom.entity.ExpenseAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ExpenseAttachmentRepository extends JpaRepository<ExpenseAttachment, UUID> {

    List<ExpenseAttachment> findByExpenseId(UUID expenseId);

    void deleteByExpenseId(UUID expenseId);
}
