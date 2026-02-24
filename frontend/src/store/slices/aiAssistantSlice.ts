import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { AIConversation, AIMessage, ChatRequest, MessageAttachment } from '../../types';
import { aiAssistantApi } from '../../services/aiAssistantApi';
import { getAllTools } from '../../services/tools/toolDefinitions';
import { executeTool } from '../../services/tools/toolExecutor';
import { SYSTEM_PROMPT } from '../../services/tools/systemPrompt';

interface AIModelConfig {
  apiUrl: string;
  apiKey: string;
  modelName: string;
  temperature: number;
}

interface AIAssistantState {
  conversations: AIConversation[];
  currentConversation: AIConversation | null;
  messages: AIMessage[];
  isOpen: boolean;
  isLoading: boolean;
  isStreaming: boolean;
  currentModule: string;
  currentContextId: string | null;
  error: string | null;
  toolStatus: string | null;
}

const initialState: AIAssistantState = {
  conversations: [],
  currentConversation: null,
  messages: [],
  isOpen: false,
  isLoading: false,
  isStreaming: false,
  currentModule: 'dashboard',
  currentContextId: null,
  error: null,
  toolStatus: null,
};

// 获取 AI 配置
const getAIConfig = (): AIModelConfig | null => {
  try {
    const savedConfig = localStorage.getItem('ai_model_config');
    if (savedConfig) {
      return JSON.parse(savedConfig);
    }
  } catch {
    // ignore
  }
  return null;
};

// 工具名称到中文描述映射
const toolNameLabels: Record<string, string> = {
  list_positions: '查询岗位列表',
  create_position: '创建岗位',
  update_position: '更新岗位',
  delete_position: '删除岗位',
  list_departments: '查询部门列表',
  get_department_tree: '查询部门架构',
  create_department: '创建部门',
  update_department: '更新部门',
  delete_department: '删除部门',
  list_employees: '查询员工列表',
  create_employee: '创建员工',
  update_employee: '更新员工',
  delete_employee: '删除员工',
  update_employee_status: '更新员工状态',
  list_projects: '查询项目列表',
  create_project: '创建项目',
  update_project: '更新项目',
  delete_project: '删除项目',
  update_project_status: '更新项目状态',
  list_contracts: '查询合同列表',
  create_contract: '创建合同',
  update_contract: '更新合同',
  delete_contract: '删除合同',
  list_ai_tasks: '查询AI任务列表',
  create_ai_task: '创建AI任务',
  update_ai_task: '更新AI任务',
  delete_ai_task: '删除AI任务',
  execute_ai_task: '执行AI任务',
  list_expenses: '查询费用列表',
  create_expense: '创建费用记录',
  update_expense: '更新费用记录',
  delete_expense: '删除费用记录',
};

// OpenAI API 消息类型（使用 Record 以兼容 thinking-enabled 模型的额外字段如 reasoning_content）
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type APIMessage = Record<string, any>;

// 调用 OpenAI 兼容 API
async function callOpenAI(
  config: AIModelConfig,
  messages: APIMessage[],
  tools: ReturnType<typeof getAllTools>,
) {
  const chatUrl = config.apiUrl.endsWith('/')
    ? `${config.apiUrl}chat/completions`
    : `${config.apiUrl}/chat/completions`;

  const response = await fetch(chatUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.modelName,
      messages,
      tools,
      tool_choice: 'auto',
      temperature: parseFloat(String(config.temperature)) || 0.7,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API 调用失败: ${errorText.substring(0, 200)}`);
  }

  return response.json();
}

// 构建 Vision API 多模态用户消息内容
function buildUserContent(message: string, attachments?: MessageAttachment[]): string | Array<Record<string, unknown>> {
  const imageAttachments = attachments?.filter(a => a.base64);
  if (!imageAttachments || imageAttachments.length === 0) {
    return message || '(空消息)';
  }
  // OpenAI Vision format: content as array of text + image_url objects
  const textContent = message || '请分析以下图片内容';
  const parts: Array<Record<string, unknown>> = [
    { type: 'text', text: textContent },
  ];
  for (const att of imageAttachments) {
    parts.push({
      type: 'image_url',
      image_url: { url: att.base64 },
    });
  }
  return parts;
}

// Async thunks
export const fetchConversations = createAsyncThunk(
  'aiAssistant/fetchConversations',
  async (moduleName?: string) => await aiAssistantApi.getConversations(moduleName)
);

export const fetchMessages = createAsyncThunk(
  'aiAssistant/fetchMessages',
  async (conversationId: string) => await aiAssistantApi.getMessages(conversationId)
);

export const sendMessage = createAsyncThunk(
  'aiAssistant/sendMessage',
  async (data: ChatRequest, { getState, dispatch, rejectWithValue }) => {
    const config = getAIConfig();

    if (!config || !config.apiUrl || !config.apiKey || !config.modelName) {
      return rejectWithValue('请先在系统设置中配置 AI 模型');
    }

    try {
      // 获取历史消息用于上下文 (不包含 base64 附件数据，太大)
      const state = getState() as { aiAssistant: AIAssistantState };
      const allMessages = state.aiAssistant.messages;

      // 跳过最后一条 user 消息（它是刚通过 addMessage 加入的当前消息，
      // 会以增强内容的形式作为新消息单独发送，避免重复）
      let historySlice = allMessages;
      if (historySlice.length > 0 && historySlice[historySlice.length - 1].role === 'USER') {
        historySlice = historySlice.slice(0, -1);
      }

      const historyMessages: APIMessage[] = historySlice
        .filter(msg => msg.content && msg.content.trim() !== '')
        .map(msg => ({
          role: msg.role.toLowerCase() as 'user' | 'assistant',
          content: msg.content,
        }));

      // 构建用户消息内容（支持多模态）
      const userContent = buildUserContent(data.message, data.attachments);

      // 构建初始消息数组
      const messages: APIMessage[] = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...historyMessages,
        { role: 'user', content: userContent },
      ];

      const tools = getAllTools();
      const MAX_ITERATIONS = 8;
      let finalContent = '';

      for (let i = 0; i < MAX_ITERATIONS; i++) {
        const result = await callOpenAI(config, messages, tools);
        const choice = result.choices?.[0];

        if (!choice) {
          throw new Error('AI 未返回有效响应');
        }

        const assistantMessage = choice.message;

        // 检查是否有 tool_calls
        if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
          // 将 assistant 原始消息完整追加到对话历史
          // 对于 thinking-enabled 模型（如 DeepSeek），必须保留 reasoning_content 字段
          // 即使模型未返回该字段，也需要显式设置为空字符串，否则 API 会报错
          const msgToPush: APIMessage = { ...assistantMessage };
          if (!('reasoning_content' in msgToPush) || msgToPush.reasoning_content === undefined) {
            msgToPush.reasoning_content = '';
          }
          messages.push(msgToPush);

          // 逐个执行 tool_calls
          for (const toolCall of assistantMessage.tool_calls) {
            const toolName = toolCall.function.name;
            const toolLabel = toolNameLabels[toolName] || toolName;

            // 更新 UI 状态
            dispatch(setToolStatus(`正在${toolLabel}...`));

            let args: Record<string, unknown> = {};
            try {
              args = JSON.parse(toolCall.function.arguments);
            } catch {
              // 参数解析失败
            }

            // 自动注入附件路径：当 AI 调用 create_expense 但未传 attachmentPath 时，
            // 从当前消息附件中自动补充，确保发票文件被关联到费用记录
            if (toolName === 'create_expense' && !args.attachmentPath && data.attachments?.length) {
              const fileAtt = data.attachments.find(a => a.filePath);
              if (fileAtt?.filePath) {
                args.attachmentPath = fileAtt.filePath;
              }
            }

            const toolResult = await executeTool(toolName, args);

            // 将工具结果作为 tool 角色消息追加
            messages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: JSON.stringify(toolResult),
            });
          }

          // 继续循环，让 AI 处理工具结果
          continue;
        }

        // 没有 tool_calls，这是最终回复
        finalContent = assistantMessage.content || '操作已完成。';
        break;
      }

      // 清除工具执行状态
      dispatch(setToolStatus(null));

      if (!finalContent) {
        finalContent = '操作过于复杂，请尝试简化您的请求。';
      }

      // 构造返回的消息对象
      const aiMessage: AIMessage = {
        id: Date.now().toString(),
        conversationId: '',
        role: 'ASSISTANT',
        content: finalContent,
        attachments: null,
        tokensUsed: null,
        messageTime: new Date().toISOString(),
      };

      // 保存用户消息和助手回复到后端记忆
      try {
        await fetch('/api/ai-assistant/memories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            memoryType: 'CONTEXT',
            content: `用户: ${data.message}\n助手: ${finalContent}`,
            metadata: {
              userMessage: data.message,
              assistantResponse: finalContent,
              model: config.modelName,
              timestamp: new Date().toISOString(),
            },
          }),
        });
      } catch {
        console.warn('Failed to save memory to backend');
      }

      return aiMessage;
    } catch (error) {
      dispatch(setToolStatus(null));
      const errorMessage = error instanceof Error ? error.message : '发送消息失败';
      return rejectWithValue(errorMessage);
    }
  }
);

export const analyzeFile = createAsyncThunk(
  'aiAssistant/analyzeFile',
  async ({ file, prompt }: { file: File; prompt?: string }) =>
    await aiAssistantApi.analyzeFile(file, prompt)
);

export const autoFillForm = createAsyncThunk(
  'aiAssistant/autoFillForm',
  async ({ moduleName, contextId, formFields }: { moduleName: string; contextId: string; formFields: string[] }) =>
    await aiAssistantApi.autoFill(moduleName, contextId, formFields)
);

const aiAssistantSlice = createSlice({
  name: 'aiAssistant',
  initialState,
  reducers: {
    toggleAssistant: (state) => {
      state.isOpen = !state.isOpen;
    },
    openAssistant: (state) => {
      state.isOpen = true;
    },
    closeAssistant: (state) => {
      state.isOpen = false;
    },
    setCurrentModule: (state, action: PayloadAction<string>) => {
      state.currentModule = action.payload;
    },
    setCurrentContextId: (state, action: PayloadAction<string | null>) => {
      state.currentContextId = action.payload;
    },
    setCurrentConversation: (state, action: PayloadAction<AIConversation | null>) => {
      state.currentConversation = action.payload;
    },
    addMessage: (state, action: PayloadAction<AIMessage>) => {
      state.messages.push(action.payload);
    },
    setStreaming: (state, action: PayloadAction<boolean>) => {
      state.isStreaming = action.payload;
    },
    updateLastMessage: (state, action: PayloadAction<string>) => {
      if (state.messages.length > 0) {
        const lastMessage = state.messages[state.messages.length - 1];
        if (lastMessage.role === 'ASSISTANT') {
          lastMessage.content += action.payload;
        }
      }
    },
    clearMessages: (state) => {
      state.messages = [];
      state.currentConversation = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    setToolStatus: (state, action: PayloadAction<string | null>) => {
      state.toolStatus = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.conversations = action.payload;
      })
      .addCase(fetchMessages.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.isLoading = false;
        state.messages = action.payload;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch messages';
      })
      .addCase(sendMessage.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.isLoading = false;
        state.toolStatus = null;
        state.messages.push(action.payload);
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.isLoading = false;
        state.toolStatus = null;
        state.error = (action.payload as string) || action.error.message || 'Failed to send message';
      })
      .addCase(analyzeFile.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(analyzeFile.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(analyzeFile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to analyze file';
      });
  },
});

export const {
  toggleAssistant,
  openAssistant,
  closeAssistant,
  setCurrentModule,
  setCurrentContextId,
  setCurrentConversation,
  addMessage,
  setStreaming,
  updateLastMessage,
  clearMessages,
  clearError,
  setToolStatus,
} = aiAssistantSlice.actions;

export default aiAssistantSlice.reducer;
