package com.swcom.service.ai;

import com.swcom.dto.AIMemoryDTO;
import com.swcom.entity.AIMemory;
import com.swcom.entity.enums.MemoryType;
import com.swcom.repository.AIConversationRepository;
import com.swcom.repository.AIMemoryRepository;
import io.agentscope.core.memory.reme.ReMeClient;
import io.agentscope.core.memory.reme.ReMeAddRequest;
import io.agentscope.core.memory.reme.ReMeAddResponse;
import io.agentscope.core.memory.reme.ReMeMessage;
import io.agentscope.core.memory.reme.ReMeSearchRequest;
import io.agentscope.core.memory.reme.ReMeSearchResponse;
import io.agentscope.core.memory.reme.ReMeTrajectory;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

/**
 * ReMe 记忆管理服务
 * 同时使用 AgentScope ReMe（语义长期记忆）和 JPA（结构化记忆存储）
 */
@Service
@Slf4j
public class ReMeMemoryService {

    private final AIMemoryRepository memoryRepository;
    private final AIConversationRepository conversationRepository;

    @Autowired(required = false)
    private ReMeClient reMeClient;

    @Value("${reme.enabled:false}")
    private boolean remeEnabled;

    @Value("${reme.workspace-id:swcom-qoder}")
    private String workspaceId;

    @Value("${reme.search-top-k:5}")
    private int searchTopK;

    public ReMeMemoryService(AIMemoryRepository memoryRepository,
                             AIConversationRepository conversationRepository) {
        this.memoryRepository = memoryRepository;
        this.conversationRepository = conversationRepository;
    }

    /**
     * 记录对话到 ReMe 长期记忆
     * 同时保存到 JPA 数据库
     */
    @Transactional
    public AIMemoryDTO recordConversation(String userMessage, String assistantResponse,
                                          UUID conversationId, Map<String, Object> metadata) {
        // 1. 保存到 JPA 数据库（结构化存储）
        AIMemory memory = AIMemory.builder()
                .memoryType(MemoryType.CONTEXT)
                .content(String.format("用户: %s\n助手: %s", userMessage, assistantResponse))
                .metadata(metadata != null ? metadata : new HashMap<>())
                .build();

        if (conversationId != null) {
            conversationRepository.findById(conversationId).ifPresent(memory::setConversation);
        }

        AIMemory saved = memoryRepository.save(memory);

        // 2. 如果 ReMe 已启用，异步提交到 ReMe 进行语义记忆提取
        if (remeEnabled && reMeClient != null) {
            try {
                ReMeMessage userMsg = ReMeMessage.builder()
                        .role("user")
                        .content(userMessage)
                        .build();
                ReMeMessage assistantMsg = ReMeMessage.builder()
                        .role("assistant")
                        .content(assistantResponse)
                        .build();

                ReMeTrajectory trajectory = ReMeTrajectory.builder()
                        .messages(List.of(userMsg, assistantMsg))
                        .build();

                ReMeAddRequest request = ReMeAddRequest.builder()
                        .workspaceId(workspaceId)
                        .trajectories(List.of(trajectory))
                        .build();

                reMeClient.add(request)
                        .subscribe(
                                response -> log.info("ReMe 记忆已记录: success={}, answer={}",
                                        response.getSuccess(), response.getAnswer()),
                                error -> log.warn("ReMe 记忆记录失败: {}", error.getMessage())
                        );
            } catch (Exception e) {
                log.warn("提交 ReMe 记忆时出错: {}", e.getMessage());
            }
        }

        return toMemoryDTO(saved);
    }

    /**
     * 从 ReMe 检索与查询相关的记忆
     * 返回语义相关的历史记忆列表
     */
    public List<String> retrieveRelevantMemories(String query) {
        if (!remeEnabled || reMeClient == null) {
            log.debug("ReMe 未启用，跳过语义记忆检索");
            return Collections.emptyList();
        }

        try {
            ReMeSearchRequest request = ReMeSearchRequest.builder()
                    .workspaceId(workspaceId)
                    .query(query)
                    .topK(searchTopK)
                    .build();

            ReMeSearchResponse response = reMeClient.search(request).block();

            if (response != null && Boolean.TRUE.equals(response.getSuccess())) {
                List<String> memories = response.getMemories();
                if (memories != null && !memories.isEmpty()) {
                    log.info("ReMe 检索到 {} 条相关记忆", memories.size());
                    return memories;
                }
            }
        } catch (Exception e) {
            log.warn("ReMe 记忆检索失败: {}", e.getMessage());
        }

        return Collections.emptyList();
    }

    /**
     * 获取所有 JPA 存储的记忆
     */
    public List<AIMemoryDTO> getAllMemories() {
        return memoryRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::toMemoryDTO)
                .collect(Collectors.toList());
    }

    /**
     * 按类型获取记忆
     */
    public List<AIMemoryDTO> getMemoriesByType(MemoryType memoryType) {
        return memoryRepository.findByMemoryTypeOrderByCreatedAtDesc(memoryType).stream()
                .map(this::toMemoryDTO)
                .collect(Collectors.toList());
    }

    /**
     * 保存自定义记忆
     */
    @Transactional
    public AIMemoryDTO saveMemory(UUID conversationId, MemoryType memoryType,
                                  String content, Map<String, Object> metadata) {
        AIMemory memory = AIMemory.builder()
                .memoryType(memoryType)
                .content(content)
                .metadata(metadata)
                .build();

        if (conversationId != null) {
            conversationRepository.findById(conversationId).ifPresent(memory::setConversation);
        }

        AIMemory saved = memoryRepository.save(memory);
        return toMemoryDTO(saved);
    }

    @Transactional
    public void deleteMemory(UUID memoryId) {
        memoryRepository.deleteById(memoryId);
    }

    @Transactional
    public void deleteAllMemories() {
        memoryRepository.deleteAll();
    }

    /**
     * 检查 ReMe 服务连接状态
     */
    public Map<String, Object> getStatus() {
        Map<String, Object> status = new LinkedHashMap<>();
        status.put("remeEnabled", remeEnabled);
        status.put("remeClientAvailable", reMeClient != null);
        status.put("workspaceId", workspaceId);

        if (remeEnabled && reMeClient != null) {
            try {
                // 尝试一次简单查询测试连接
                ReMeSearchRequest testRequest = ReMeSearchRequest.builder()
                        .workspaceId(workspaceId)
                        .query("test")
                        .topK(1)
                        .build();
                ReMeSearchResponse response = reMeClient.search(testRequest).block();
                status.put("connected", response != null);
            } catch (Exception e) {
                status.put("connected", false);
                status.put("error", e.getMessage());
            }
        }

        long totalMemories = memoryRepository.count();
        status.put("totalJpaMemories", totalMemories);

        return status;
    }

    private AIMemoryDTO toMemoryDTO(AIMemory memory) {
        return AIMemoryDTO.builder()
                .id(memory.getId())
                .conversationId(memory.getConversation() != null ? memory.getConversation().getId() : null)
                .memoryType(memory.getMemoryType())
                .content(memory.getContent())
                .metadata(memory.getMetadata())
                .createdAt(memory.getCreatedAt())
                .updatedAt(memory.getUpdatedAt())
                .build();
    }
}
