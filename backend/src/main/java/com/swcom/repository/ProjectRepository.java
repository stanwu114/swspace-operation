package com.swcom.repository;

import com.swcom.entity.Project;
import com.swcom.entity.enums.ProjectCategory;
import com.swcom.entity.enums.ProjectStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProjectRepository extends JpaRepository<Project, UUID> {

    @Query("SELECT p FROM Project p LEFT JOIN FETCH p.leader ORDER BY p.createdAt DESC")
    List<Project> findAllWithLeader();

    @Query("SELECT p FROM Project p LEFT JOIN FETCH p.leader WHERE p.projectCategory = :category ORDER BY p.createdAt DESC")
    List<Project> findByCategoryWithLeader(@Param("category") ProjectCategory category);

    @Query("SELECT p FROM Project p LEFT JOIN FETCH p.leader WHERE p.status = :status ORDER BY p.createdAt DESC")
    List<Project> findByStatusWithLeader(@Param("status") ProjectStatus status);

    @Query("SELECT p FROM Project p LEFT JOIN FETCH p.leader WHERE p.leader.id = :leaderId ORDER BY p.createdAt DESC")
    List<Project> findByLeaderIdWithLeader(@Param("leaderId") UUID leaderId);

    @Query("SELECT p FROM Project p LEFT JOIN FETCH p.leader WHERE p.id = :id")
    Optional<Project> findByIdWithDetails(@Param("id") UUID id);

    Optional<Project> findByProjectNo(String projectNo);

    long countByStatus(ProjectStatus status);

    long countByProjectCategory(ProjectCategory category);
}
