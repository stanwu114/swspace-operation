package com.swcom.controller;

import com.swcom.dto.AIConversationDTO;
import com.swcom.dto.AIMemoryDTO;
import com.swcom.dto.AIMemoryRequest;
import com.swcom.dto.AIMessageDTO;
import com.swcom.dto.ApiResponse;
import com.swcom.dto.ChatRequest;
import com.swcom.dto.SaveMessagesRequest;
import com.swcom.entity.enums.MemoryType;
import com.swcom.service.ai.AIAssistantService;
import com.swcom.service.ai.ReMeMemoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/ai-assistant")
@RequiredArgsConstructor
@Tag(name = "AI Assistant", description = "AI Assistant chat APIs")
public class AIAssistantController {

    private final AIAssistantService aiAssistantService;
    private final ReMeMemoryService reMeMemoryService;

    @GetMapping("/conversations")
    @Operation(summary = "Get conversations", description = "Get all conversations, optionally filtered by module")
    public ResponseEntity<ApiResponse<List<AIConversationDTO>>> getConversations(
            @RequestParam(required = false) String moduleName) {
        List<AIConversationDTO> conversations = aiAssistantService.getConversations(moduleName);
        return ResponseEntity.ok(ApiResponse.success(conversations));
    }

    @GetMapping("/conversations/{id}")
    @Operation(summary = "Get conversation", description = "Get a single conversation by ID")
    public ResponseEntity<ApiResponse<AIConversationDTO>> getConversation(@PathVariable UUID id) {
        AIConversationDTO conversation = aiAssistantService.getConversation(id);
        return ResponseEntity.ok(ApiResponse.success(conversation));
    }

    @GetMapping("/conversations/{id}/messages")
    @Operation(summary = "Get messages", description = "Get all messages in a conversation")
    public ResponseEntity<ApiResponse<List<AIMessageDTO>>> getMessages(@PathVariable UUID id) {
        List<AIMessageDTO> messages = aiAssistantService.getMessages(id);
        return ResponseEntity.ok(ApiResponse.success(messages));
    }

    @DeleteMapping("/conversations/{id}")
    @Operation(summary = "Delete conversation", description = "Delete a conversation and all its messages")
    public ResponseEntity<ApiResponse<Void>> deleteConversation(@PathVariable UUID id) {
        aiAssistantService.deleteConversation(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @DeleteMapping("/conversations")
    @Operation(summary = "Delete all conversations", description = "Delete all conversations and messages")
    public ResponseEntity<ApiResponse<Void>> deleteAllConversations() {
        aiAssistantService.deleteAllConversations();
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PostMapping("/chat")
    @Operation(summary = "Send message", description = "Send a message to the AI assistant")
    public ResponseEntity<ApiResponse<AIMessageDTO>> sendMessage(@Valid @RequestBody ChatRequest request) {
        AIMessageDTO response = aiAssistantService.sendMessage(request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/conversations/save-messages")
    @Operation(summary = "Save raw messages", description = "Save messages to a conversation without AI processing")
    public ResponseEntity<ApiResponse<AIConversationDTO>> saveMessages(@RequestBody SaveMessagesRequest request) {
        AIConversationDTO result = aiAssistantService.saveRawMessages(request);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    // ========== Memory Endpoints ==========

    @GetMapping("/memories")
    @Operation(summary = "Get all memories", description = "Get all AI memories, optionally filtered by type")
    public ResponseEntity<ApiResponse<List<AIMemoryDTO>>> getMemories(
            @RequestParam(required = false) MemoryType memoryType) {
        List<AIMemoryDTO> memories;
        if (memoryType != null) {
            memories = aiAssistantService.getMemoriesByType(memoryType);
        } else {
            memories = aiAssistantService.getAllMemories();
        }
        return ResponseEntity.ok(ApiResponse.success(memories));
    }

    @PostMapping("/memories")
    @Operation(summary = "Save memory", description = "Save a new AI memory")
    public ResponseEntity<ApiResponse<AIMemoryDTO>> saveMemory(@Valid @RequestBody AIMemoryRequest request) {
        AIMemoryDTO memory = aiAssistantService.saveMemory(
                request.getConversationId(),
                request.getMemoryType(),
                request.getContent(),
                request.getMetadata()
        );
        return ResponseEntity.ok(ApiResponse.success(memory));
    }

    @DeleteMapping("/memories/{id}")
    @Operation(summary = "Delete memory", description = "Delete a specific AI memory")
    public ResponseEntity<ApiResponse<Void>> deleteMemory(@PathVariable UUID id) {
        aiAssistantService.deleteMemory(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @DeleteMapping("/memories")
    @Operation(summary = "Delete all memories", description = "Delete all AI memories")
    public ResponseEntity<ApiResponse<Void>> deleteAllMemories() {
        aiAssistantService.deleteAllMemories();
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    // ========== ReMe Status Endpoint ==========

    @GetMapping("/memories/status")
    @Operation(summary = "Get ReMe status", description = "Get ReMe memory service connection status")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getMemoryStatus() {
        Map<String, Object> status = reMeMemoryService.getStatus();
        return ResponseEntity.ok(ApiResponse.success(status));
    }
}
