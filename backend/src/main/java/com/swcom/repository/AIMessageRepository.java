package com.swcom.repository;

import com.swcom.entity.AIMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AIMessageRepository extends JpaRepository<AIMessage, UUID> {

    List<AIMessage> findByConversationIdOrderByMessageTimeAsc(UUID conversationId);

    List<AIMessage> findTop20ByConversationIdOrderByMessageTimeDesc(UUID conversationId);

    long countByConversationId(UUID conversationId);

    @Modifying
    @Query("DELETE FROM AIMessage m WHERE m.conversation.id = :conversationId")
    void deleteByConversationId(@Param("conversationId") UUID conversationId);
}
