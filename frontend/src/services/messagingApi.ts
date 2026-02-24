import { get, post, put, del } from './api';
import { PlatformConfig, UserBinding, BindingCode, MessageLog } from '../types';

export interface TelegramSetupResult {
  success: boolean;
  botUsername: string | null;
  webhookUrl: string | null;
  message: string;
}

export interface PendingMessage {
  id: string;
  platformType: string;
  platformUserId: string;
  employeeId: string;
  employeeName: string;
  content: string;
  messageType?: string;
  filePath?: string | null;
  fileName?: string | null;
  fileType?: string | null;
  createdAt: string;
}

export const messagingApi = {
  // Platform config
  getPlatforms: () => get<PlatformConfig[]>('/external-messaging/platforms'),

  savePlatform: (data: Partial<PlatformConfig>) =>
    post<PlatformConfig>('/external-messaging/platforms', data),

  togglePlatform: (id: string) =>
    put<PlatformConfig>(`/external-messaging/platforms/${id}/toggle`),

  // Telegram setup: validate token, get bot username, register webhook
  setupTelegram: (data: { botToken: string; webhookSecret?: string; webhookUrl?: string }) =>
    post<TelegramSetupResult>('/external-messaging/platforms/telegram/setup', data),

  // User bindings
  getBindings: (employeeId?: string) =>
    get<UserBinding[]>('/external-messaging/bindings', employeeId ? { employeeId } : undefined),

  generateBindingCode: (employeeId: string) =>
    post<BindingCode>('/external-messaging/bindings/generate', { employeeId }),

  revokeBinding: (id: string) =>
    del<void>(`/external-messaging/bindings/${id}`),

  // Message logs
  getMessages: (page = 0, size = 20) =>
    get<{ content: MessageLog[]; totalElements: number }>('/external-messaging/messages', { page, size }),

  // Pending messages for frontend processing
  getPendingMessages: () =>
    get<PendingMessage[]>('/external-messaging/messages/pending'),

  markMessageProcessing: (id: string) =>
    post<void>(`/external-messaging/messages/${id}/processing`),

  replyToMessage: (id: string, content: string) =>
    post<void>(`/external-messaging/messages/${id}/reply`, { content }),

  // Status
  getStatus: () =>
    get<Record<string, unknown>>('/external-messaging/status'),
};
