import { get, post, del, uploadFile } from './api';
import {
  AIConversation,
  AIMessage,
  AIMemory,
  ChatRequest,
  MemoryType,
} from '../types';

export const aiAssistantApi = {
  // Conversations
  getConversations: (moduleName?: string) =>
    get<AIConversation[]>('/ai-assistant/conversations', moduleName ? { moduleName } : undefined),
  getConversation: (id: string) => get<AIConversation>(`/ai-assistant/conversations/${id}`),
  getConversationByContext: (moduleName: string, contextId: string) =>
    get<AIConversation>(`/ai-assistant/conversations/context`, { moduleName, contextId }),

  // Messages
  getMessages: (conversationId: string) =>
    get<AIMessage[]>(`/ai-assistant/conversations/${conversationId}/messages`),

  // Delete Conversations
  deleteConversation: (id: string) =>
    del<void>(`/ai-assistant/conversations/${id}`),
  deleteAllConversations: () =>
    del<void>('/ai-assistant/conversations'),

  // Chat
  sendMessage: (data: ChatRequest) =>
    post<AIMessage>('/ai-assistant/chat', data),
  
  // Streaming chat endpoint URL (for EventSource)
  getChatStreamUrl: (conversationId?: string) =>
    `/api/ai-assistant/chat/stream${conversationId ? `?conversationId=${conversationId}` : ''}`,

  // File Analysis
  analyzeFile: (file: File, prompt?: string) =>
    uploadFile<{ analysis: string; extractedText?: string }>('/ai-assistant/analyze-file', file, prompt ? { prompt } : undefined),

  // Auto Fill
  autoFill: (moduleName: string, contextId: string, formFields: string[]) =>
    post<Record<string, unknown>>('/ai-assistant/auto-fill', { moduleName, contextId, formFields }),

  // Execute Action
  executeAction: (action: string, params: Record<string, unknown>) =>
    post<{ success: boolean; result?: unknown; message?: string }>('/ai-assistant/execute-action', { action, params }),

  // Memory
  getMemories: (memoryType?: MemoryType) =>
    get<AIMemory[]>('/ai-assistant/memories', memoryType ? { memoryType } : undefined),

  saveMemory: (data: { conversationId?: string; memoryType: MemoryType; content: string; metadata?: Record<string, unknown> }) =>
    post<AIMemory>('/ai-assistant/memories', data),

  deleteMemory: (id: string) =>
    del<void>(`/ai-assistant/memories/${id}`),

  deleteAllMemories: () =>
    del<void>('/ai-assistant/memories'),
  // Save raw messages to a conversation (no AI processing)
  saveRawMessages: (data: { moduleName: string; messages: Array<{ role: string; content: string }> }) =>
    post<AIConversation>('/ai-assistant/conversations/save-messages', data),
};
