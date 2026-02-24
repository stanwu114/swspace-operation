package com.swcom.repository;

import com.swcom.entity.AIMemory;
import com.swcom.entity.enums.MemoryType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AIMemoryRepository extends JpaRepository<AIMemory, UUID> {

    List<AIMemory> findByMemoryTypeOrderByCreatedAtDesc(MemoryType memoryType);

    List<AIMemory> findByConversationIdOrderByCreatedAtDesc(UUID conversationId);

    List<AIMemory> findAllByOrderByCreatedAtDesc();

    void deleteByConversationId(UUID conversationId);
}
