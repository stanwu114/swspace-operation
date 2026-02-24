package com.swcom.service.ai;

import com.swcom.config.AIConfig;
import com.swcom.dto.AIConversationDTO;
import com.swcom.dto.AIMemoryDTO;
import com.swcom.dto.AIMessageDTO;
import com.swcom.dto.ChatRequest;
import com.swcom.dto.SaveMessagesRequest;
import com.swcom.entity.AIConversation;
import com.swcom.entity.AIMessage;
import com.swcom.entity.enums.MemoryType;
import com.swcom.entity.enums.MessageRole;
import com.swcom.repository.AIConversationRepository;
import com.swcom.repository.AIMessageRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Slf4j
public class AIAssistantService {

    private final AIConfig aiConfig;
    private final AIConversationRepository conversationRepository;
    private final AIMessageRepository messageRepository;
    private final ReMeMemoryService reMeMemoryService;

    public AIAssistantService(AIConfig aiConfig,
                              AIConversationRepository conversationRepository,
                              AIMessageRepository messageRepository,
                              ReMeMemoryService reMeMemoryService) {
        this.aiConfig = aiConfig;
        this.conversationRepository = conversationRepository;
        this.messageRepository = messageRepository;
        this.reMeMemoryService = reMeMemoryService;
    }

    private static final String SYSTEM_PROMPT = """
        You are an intelligent AI assistant for a One-Person Company Management System.
        Your role is to help the user manage their organization, projects, contracts, and AI tasks.
        
        You can assist with:
        - Organization management: departments, positions, employees
        - Project management: tracking projects, documents, costs
        - Contract management: contracts, payment nodes, bidding info
        - AI task configuration and monitoring
        
        Be concise, professional, and helpful. When the user asks about specific data,
        guide them to the appropriate module or offer to help them navigate the system.
        
        Always respond in the same language as the user's message.
        """;

    public List<AIConversationDTO> getConversations(String moduleName) {
        List<AIConversation> conversations;
        if (moduleName != null && !moduleName.isEmpty()) {
            conversations = conversationRepository.findByModuleNameOrderByUpdatedAtDesc(moduleName);
        } else {
            conversations = conversationRepository.findTop10ByOrderByUpdatedAtDesc();
        }
        return conversations.stream()
                .map(this::toConversationDTO)
                .collect(Collectors.toList());
    }

    public AIConversationDTO getConversation(UUID id) {
        AIConversation conversation = conversationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Conversation not found"));
        return toConversationDTO(conversation);
    }

    public List<AIMessageDTO> getMessages(UUID conversationId) {
        List<AIMessage> messages = messageRepository.findByConversationIdOrderByMessageTimeAsc(conversationId);
        return messages.stream()
                .map(this::toMessageDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public AIMessageDTO sendMessage(ChatRequest request) {
        // Get or create conversation
        AIConversation conversation;
        if (request.getConversationId() != null) {
            conversation = conversationRepository.findById(request.getConversationId())
                    .orElseThrow(() -> new RuntimeException("Conversation not found"));
        } else {
            conversation = createConversation(request.getModuleName(), request.getContextId());
        }

        // Save user message
        AIMessage userMessage = AIMessage.builder()
                .conversation(conversation)
                .role(MessageRole.USER)
                .content(request.getMessage())
                .attachments(request.getAttachments())
                .messageTime(LocalDateTime.now())
                .build();
        messageRepository.save(userMessage);

        // Build conversation history for context
        List<AIMessage> recentMessages = messageRepository.findTop20ByConversationIdOrderByMessageTimeDesc(conversation.getId());
        List<Message> chatHistory = buildChatHistory(recentMessages);

        // 检索 ReMe 相关记忆，增强上下文
        List<String> relevantMemories = reMeMemoryService.retrieveRelevantMemories(request.getMessage());
        String enhancedSystemPrompt = SYSTEM_PROMPT;
        if (!relevantMemories.isEmpty()) {
            String memoryContext = String.join("\n", relevantMemories);
            enhancedSystemPrompt = SYSTEM_PROMPT + "\n\n以下是与用户当前问题相关的历史记忆，请参考这些信息来回答：\n" + memoryContext;
        }

        // Call AI
        String aiResponse;
        try {
            Optional<ChatClient> chatClientOpt = aiConfig.getDynamicChatClient();
            if (chatClientOpt.isEmpty()) {
                log.warn("AI model not configured");
                aiResponse = "AI 模型未配置。请在系统设置中配置 AI 大模型后再试。";
            } else {
                ChatClient chatClient = chatClientOpt.get();
                
                List<Message> allMessages = new ArrayList<>();
                allMessages.add(new SystemMessage(enhancedSystemPrompt));
                allMessages.addAll(chatHistory);
                allMessages.add(new UserMessage(request.getMessage()));

                Prompt prompt = new Prompt(allMessages);
                aiResponse = chatClient.prompt(prompt).call().content();
            }
        } catch (Exception e) {
            log.error("Error calling AI service", e);
            aiResponse = "抱歉，AI 服务调用出错。请检查 AI 配置是否正确。错误: " + e.getMessage();
        }

        // Save assistant message
        AIMessage assistantMessage = AIMessage.builder()
                .conversation(conversation)
                .role(MessageRole.ASSISTANT)
                .content(aiResponse)
                .messageTime(LocalDateTime.now())
                .build();
        messageRepository.save(assistantMessage);

        // 通过 ReMe 记录对话到长期记忆
        try {
            reMeMemoryService.recordConversation(
                    request.getMessage(),
                    aiResponse,
                    conversation.getId(),
                    Map.of(
                            "model", "default",
                            "module", request.getModuleName() != null ? request.getModuleName() : "general",
                            "timestamp", LocalDateTime.now().toString()
                    )
            );
        } catch (Exception e) {
            log.warn("记录 ReMe 记忆失败: {}", e.getMessage());
        }

        // Update conversation title if it's new
        if (conversation.getTitle() == null || conversation.getTitle().isEmpty()) {
            String title = request.getMessage().length() > 50 
                    ? request.getMessage().substring(0, 50) + "..." 
                    : request.getMessage();
            conversation.setTitle(title);
            conversationRepository.save(conversation);
        }

        return toMessageDTO(assistantMessage);
    }

    private AIConversation createConversation(String moduleName, UUID contextId) {
        AIConversation conversation = AIConversation.builder()
                .moduleName(moduleName)
                .contextId(contextId)
                .build();
        return conversationRepository.save(conversation);
    }

    private List<Message> buildChatHistory(List<AIMessage> recentMessages) {
        List<Message> history = new ArrayList<>();
        // Reverse to get chronological order (oldest first)
        for (int i = recentMessages.size() - 1; i >= 0; i--) {
            AIMessage msg = recentMessages.get(i);
            if (msg.getRole() == MessageRole.USER) {
                history.add(new UserMessage(msg.getContent()));
            } else if (msg.getRole() == MessageRole.ASSISTANT) {
                history.add(new AssistantMessage(msg.getContent()));
            }
        }
        return history;
    }

    private AIConversationDTO toConversationDTO(AIConversation conversation) {
        long messageCount = messageRepository.countByConversationId(conversation.getId());
        return AIConversationDTO.builder()
                .id(conversation.getId())
                .moduleName(conversation.getModuleName())
                .contextId(conversation.getContextId())
                .title(conversation.getTitle())
                .conversationSummary(conversation.getConversationSummary())
                .messageCount((int) messageCount)
                .createdAt(conversation.getCreatedAt())
                .updatedAt(conversation.getUpdatedAt())
                .build();
    }

    private AIMessageDTO toMessageDTO(AIMessage message) {
        return AIMessageDTO.builder()
                .id(message.getId())
                .conversationId(message.getConversation().getId())
                .role(message.getRole())
                .content(message.getContent())
                .attachments(message.getAttachments())
                .tokensUsed(message.getTokensUsed())
                .messageTime(message.getMessageTime())
                .build();
    }

    // ========== Save Raw Messages (no AI processing) ==========

    @Transactional
    public AIConversationDTO saveRawMessages(SaveMessagesRequest request) {
        String module = request.getModuleName() != null ? request.getModuleName() : "assistant";

        // Get or create conversation for this module
        List<AIConversation> existing = conversationRepository.findByModuleNameOrderByUpdatedAtDesc(module);
        AIConversation conversation = existing.isEmpty()
                ? createConversation(module, null)
                : existing.get(0);

        if (request.getMessages() != null) {
            for (SaveMessagesRequest.RawMessage msg : request.getMessages()) {
                if (msg == null || msg.getRole() == null || msg.getContent() == null) {
                    continue;
                }

                MessageRole role;
                try {
                    role = MessageRole.valueOf(msg.getRole().toUpperCase());
                } catch (IllegalArgumentException e) {
                    log.warn("未知的消息角色: {}, 跳过", msg.getRole());
                    continue;
                }

                AIMessage aiMessage = AIMessage.builder()
                        .conversation(conversation)
                        .role(role)
                        .content(msg.getContent())
                        .messageTime(LocalDateTime.now())
                        .build();
                messageRepository.save(aiMessage);
            }

            // Update conversation title if empty
            if ((conversation.getTitle() == null || conversation.getTitle().isEmpty())
                    && !request.getMessages().isEmpty()) {
                SaveMessagesRequest.RawMessage firstMsg = request.getMessages().get(0);
                if (firstMsg != null && firstMsg.getContent() != null) {
                    String firstContent = firstMsg.getContent();
                    String title = firstContent.length() > 50
                            ? firstContent.substring(0, 50) + "..."
                            : firstContent;
                    conversation.setTitle(title);
                }
            }
        }

        conversationRepository.save(conversation);
        return toConversationDTO(conversation);
    }

    // ========== Conversation Delete ==========

    @Transactional
    public void deleteConversation(UUID conversationId) {
        messageRepository.deleteByConversationId(conversationId);
        conversationRepository.deleteById(conversationId);
        log.info("已删除对话及其消息: {}", conversationId);
    }

    @Transactional
    public void deleteAllConversations() {
        messageRepository.deleteAll();
        conversationRepository.deleteAll();
        log.info("已删除所有对话和消息");
    }

    // ========== Memory Management (delegated to ReMeMemoryService) ==========

    public List<AIMemoryDTO> getAllMemories() {
        return reMeMemoryService.getAllMemories();
    }

    public List<AIMemoryDTO> getMemoriesByType(MemoryType memoryType) {
        return reMeMemoryService.getMemoriesByType(memoryType);
    }

    @Transactional
    public AIMemoryDTO saveMemory(UUID conversationId, MemoryType memoryType, String content, Map<String, Object> metadata) {
        return reMeMemoryService.saveMemory(conversationId, memoryType, content, metadata);
    }

    @Transactional
    public void deleteMemory(UUID memoryId) {
        reMeMemoryService.deleteMemory(memoryId);
    }

    @Transactional
    public void deleteAllMemories() {
        reMeMemoryService.deleteAllMemories();
    }
}
