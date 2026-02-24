package com.swcom.repository;

import com.swcom.entity.AIConversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AIConversationRepository extends JpaRepository<AIConversation, UUID> {

    List<AIConversation> findByModuleNameOrderByUpdatedAtDesc(String moduleName);

    @Query("SELECT c FROM AIConversation c WHERE c.moduleName = :moduleName AND c.contextId = :contextId ORDER BY c.updatedAt DESC")
    List<AIConversation> findByModuleNameAndContextId(@Param("moduleName") String moduleName, @Param("contextId") UUID contextId);

    @Query("SELECT c FROM AIConversation c LEFT JOIN FETCH c.messages WHERE c.id = :id")
    Optional<AIConversation> findByIdWithMessages(@Param("id") UUID id);

    List<AIConversation> findTop10ByOrderByUpdatedAtDesc();
}
