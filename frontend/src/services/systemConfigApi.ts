import { get, post } from './api';

export interface AIModelConfig {
  apiUrl: string;
  apiKey: string;
  modelName: string;
  temperature?: number;
}

export interface AIModelStatus {
  configured: boolean;
  message: string;
}

export const systemConfigApi = {
  // Get AI model configuration
  getAIModelConfig: () => get<AIModelConfig | null>('/system-config/ai-model'),

  // Save AI model configuration
  saveAIModelConfig: (config: AIModelConfig) => post<AIModelConfig>('/system-config/ai-model', config),

  // Get AI model configuration status
  getAIModelStatus: () => get<AIModelStatus>('/system-config/ai-model/status'),
};
