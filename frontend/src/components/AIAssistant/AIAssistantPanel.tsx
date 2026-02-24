import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  CloseOutlined,
  RobotOutlined,
  UserOutlined,
  SendOutlined,
  PaperClipOutlined,
  MessageOutlined,
  SettingOutlined,
  LoadingOutlined,
  FileOutlined,
  DeleteOutlined,
  FilePdfOutlined,
  ClearOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/useStore';
import { closeAssistant, addMessage, sendMessage, fetchMessages, setCurrentConversation, clearMessages } from '../../store/slices/aiAssistantSlice';
import { AIMessage, MessageAttachment } from '../../types';
import { aiAssistantApi } from '../../services/aiAssistantApi';
import { messagingApi, PendingMessage } from '../../services/messagingApi';
import { processFileForVision, localFileToBase64, uploadFileForVision, isImageType, isPdfType } from '../../utils/fileUtils';
import './AIAssistantPanel.css';

const AIAssistantPanel: React.FC = () => {
  const [inputValue, setInputValue] = useState('');
  const [configError, setConfigError] = useState<string | null>(null);
  const processingTelegramIdsRef = useRef<Set<string>>(new Set());
  const hasLoadedInitialRef = useRef(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<Record<string, string>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { messages, isLoading, currentModule, currentContextId, error, toolStatus } = useAppSelector(
    (state) => state.aiAssistant
  );

  // 检查是否已配置 AI 模型
  useEffect(() => {
    const savedConfig = localStorage.getItem('ai_model_config');
    if (!savedConfig) {
      setConfigError('请先配置 AI 模型');
    } else {
      try {
        const config = JSON.parse(savedConfig);
        if (!config.apiUrl || !config.apiKey || !config.modelName) {
          setConfigError('AI 模型配置不完整');
        } else {
          setConfigError(null);
        }
      } catch {
        setConfigError('AI 模型配置无效');
      }
    }
  }, []);

  // 加载后端会话消息（包括 Telegram 消息）- 仅首次加载
  useEffect(() => {
    if (hasLoadedInitialRef.current) return; // 已加载过，跳过（避免清空后重新加载）
    
    const loadConversation = async () => {
      try {
        const conversations = await aiAssistantApi.getConversations('assistant');
        if (conversations.length > 0) {
          const conv = conversations[0];
          dispatch(setCurrentConversation(conv));
          dispatch(fetchMessages(conv.id));
        }
      } catch (err) {
        console.error('Failed to load conversation:', err);
      }
    };

    // 消息为空时加载历史
    if (messages.length === 0) {
      hasLoadedInitialRef.current = true;
      loadConversation();
    }
  }, [dispatch, messages.length]);

  // 处理单条 Telegram 消息
  const processTelegramMessage = useCallback(async (msg: PendingMessage) => {
    if (processingTelegramIdsRef.current.has(msg.id)) return;
    
    // 立即标记为正在处理 (ref 同步更新，无闭包延迟)
    processingTelegramIdsRef.current.add(msg.id);
    
    try {
      // 标记消息为处理中
      await messagingApi.markMessageProcessing(msg.id);

      const isFileMessage = msg.messageType === 'IMAGE' || msg.messageType === 'DOCUMENT';
      const hasFile = isFileMessage && msg.filePath;

      // 构建附件信息
      let attachments: MessageAttachment[] | undefined;
      let messageText = msg.content || '';

      if (hasFile && msg.filePath) {
        // 处理文件: 获取 base64 for Vision API
        const base64 = await processFileForVision(msg.filePath, msg.fileType);
        const attType = isImageType(msg.fileType) ? 'image' : 'document';

        // 无论 base64 是否成功，都要创建附件对象以保留 filePath（用于费用记录附件关联）
        attachments = [{
          type: attType as 'image' | 'document',
          fileName: msg.fileName || 'file',
          filePath: msg.filePath,
          fileType: msg.fileType || 'application/octet-stream',
          base64: base64 || undefined,
        }];

        // 如果没有文字内容，用文件信息作为提示
        if (!messageText) {
          messageText = `发送了文件: ${msg.fileName || '未知文件'}`;
        }
      }
      
      // 显示用户消息在界面上
      const userMessage: AIMessage = {
        id: `telegram-${msg.id}`,
        conversationId: '',
        role: 'USER',
        content: `[Telegram] ${messageText}`,
        attachments: attachments || null,
        tokensUsed: null,
        messageTime: msg.createdAt,
      };
      dispatch(addMessage(userMessage));

      // 构建发送给 AI 的消息文本
      let aiMessageText = messageText;
      if (hasFile && attachments?.length) {
        aiMessageText = (messageText || `发送了文件: ${msg.fileName || '未知文件'}`) + '\n\n(用户通过Telegram发送了一个文件，请分析该文件内容。如果是发票，请提取金额、日期、费用类别等信息，并询问用户是否需要创建费用记录。文件路径: ' + msg.filePath + ')';
      }
      if (!aiMessageText || !aiMessageText.trim()) {
        aiMessageText = messageText || '用户发送了一条消息';
      }
      
      // 调用 AI 处理消息
      const result = await dispatch(
        sendMessage({
          moduleName: currentModule,
          contextId: currentContextId || undefined,
          message: aiMessageText,
          attachments,
        })
      ).unwrap();
      
      // 发送回复到 Telegram
      if (result && result.content) {
        await messagingApi.replyToMessage(msg.id, result.content);
        console.log('Telegram 回复已发送:', result.content.substring(0, 50));
      }

      // 持久化消息到后端会话（保证刷新页面后仍可查看历史）
      try {
        await aiAssistantApi.saveRawMessages({
          moduleName: 'assistant',
          messages: [
            { role: 'USER', content: `[Telegram] ${messageText}` },
            { role: 'ASSISTANT', content: result?.content || '(处理完成)' },
          ],
        });
      } catch {
        console.warn('持久化 Telegram 消息到后端失败');
      }
    } catch (err) {
      console.error('处理 Telegram 消息失败:', err);
      // 尝试发送错误消息到 Telegram
      try {
        await messagingApi.replyToMessage(msg.id, '抱歉，处理消息时出现错误，请稍后重试。');
      } catch {
        // ignore
      }
    } finally {
      // 不从 ref 中删除 ID，防止重复处理已完成的消息
      // 已处理的消息在后端会被标记为 COMPLETED，不会再被轮询到
    }
  }, [dispatch, currentModule, currentContextId]);

  // 轮询获取待处理的 Telegram 消息
  useEffect(() => {
    if (configError) return; // 未配置 AI 时不轮询
    
    const pollPendingMessages = async () => {
      try {
        const pendingMessages = await messagingApi.getPendingMessages();
        for (const msg of pendingMessages) {
          processTelegramMessage(msg);
        }
      } catch (err) {
        console.error('轮询 Telegram 消息失败:', err);
      }
    };

    // 立即执行一次
    pollPendingMessages();
    
    // 每 3 秒轮询一次
    const interval = setInterval(pollPendingMessages, 3000);
    
    return () => clearInterval(interval);
  }, [configError, processTelegramMessage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 清理文件预览 URL
  useEffect(() => {
    return () => {
      Object.values(filePreviews).forEach(url => URL.revokeObjectURL(url));
    };
  }, [filePreviews]);

  const handleClose = () => {
    dispatch(closeAssistant());
  };

  const handleGoToSettings = () => {
    dispatch(closeAssistant());
    navigate('/settings/ai-model');
  };

  // 文件选择处理
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles = Array.from(files);
    const newPreviews: Record<string, string> = {};
    newFiles.forEach(file => {
      if (file.type.startsWith('image/')) {
        newPreviews[file.name] = URL.createObjectURL(file);
      }
    });

    setPendingFiles(prev => [...prev, ...newFiles]);
    setFilePreviews(prev => ({ ...prev, ...newPreviews }));

    // 重置 input 以允许重复选择同一文件
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = (index: number) => {
    setPendingFiles(prev => {
      const file = prev[index];
      // 清理预览 URL
      if (filePreviews[file.name]) {
        URL.revokeObjectURL(filePreviews[file.name]);
        setFilePreviews(p => {
          const copy = { ...p };
          delete copy[file.name];
          return copy;
        });
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSend = async () => {
    if ((!inputValue.trim() && pendingFiles.length === 0) || isLoading) return;

    // 处理文件附件
    let attachments: MessageAttachment[] | undefined;
    if (pendingFiles.length > 0) {
      attachments = [];
      for (const file of pendingFiles) {
        let visionBase64: string;
        let savedPath: string | undefined;

        if (isPdfType(file.type)) {
          // PDF: 上传到后端，持久化原文件并转换为图片获取 base64
          const result = await uploadFileForVision(file);
          visionBase64 = result.base64;
          savedPath = result.savedPath;
        } else if (file.type.startsWith('image/')) {
          // 图片: 也上传到后端持久化
          const result = await uploadFileForVision(file);
          visionBase64 = result.base64;
          savedPath = result.savedPath;
        } else {
          visionBase64 = await localFileToBase64(file);
        }
        const attType = file.type.startsWith('image/') ? 'image' : 'document';

        attachments.push({
          type: attType as 'image' | 'document',
          fileName: file.name,
          filePath: savedPath,
          fileType: file.type,
          base64: visionBase64,
        });
      }
    }

    const messageText = inputValue.trim() || (pendingFiles.length > 0
      ? `发送了 ${pendingFiles.length} 个文件: ${pendingFiles.map(f => f.name).join(', ')}`
      : '');

    const userMessage: AIMessage = {
      id: Date.now().toString(),
      conversationId: '',
      role: 'USER',
      content: messageText,
      attachments: attachments || null,
      tokensUsed: null,
      messageTime: new Date().toISOString(),
    };

    dispatch(addMessage(userMessage));
    setInputValue('');
    setPendingFiles([]);
    setFilePreviews({});

    // 构建发送给 AI 的消息
    let aiText = messageText;
    if (attachments?.length) {
      const fileNames = attachments.map(a => a.fileName).join(', ');
      const filePaths = attachments.filter(a => a.filePath).map(a => a.filePath).join(', ');
      if (!inputValue.trim()) {
        aiText = `用户发送了文件: ${fileNames}。请分析文件内容。如果是发票，请提取金额、日期、费用类别等信息，并询问用户是否需要创建费用记录。`;
      }
      if (filePaths) {
        aiText += `\n(文件路径: ${filePaths})`;
      }
    }

    try {
      const result = await dispatch(
        sendMessage({
          moduleName: currentModule,
          contextId: currentContextId || undefined,
          message: aiText,
          attachments,
        })
      ).unwrap();

      // 持久化消息到后端会话
      try {
        await aiAssistantApi.saveRawMessages({
          moduleName: 'assistant',
          messages: [
            { role: 'USER', content: messageText },
            { role: 'ASSISTANT', content: result?.content || '(处理完成)' },
          ],
        });
      } catch {
        console.warn('持久化消息到后端失败');
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      // 如果是配置错误，显示配置提示
      if (typeof err === 'string' && err.includes('配置')) {
        setConfigError(err);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  // 渲染消息附件
  const renderAttachments = (attachments: MessageAttachment[] | null) => {
    if (!attachments || attachments.length === 0) return null;
    return (
      <div className="message-attachments">
        {attachments.map((att, idx) => (
          <div key={idx} className="attachment-item">
            {att.type === 'image' && att.base64 ? (
              <img src={att.base64} alt={att.fileName} className="attachment-image" />
            ) : (
              <div className="attachment-file">
                {isPdfType(att.fileType) ? <FilePdfOutlined /> : <FileOutlined />}
                <span className="attachment-filename">{att.fileName}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="ai-assistant-panel">
      <div className="assistant-header">
        <div className="assistant-title">
          <div className="assistant-title-icon">
            <RobotOutlined />
          </div>
          <div className="assistant-title-text">
            <h3>AI 助手</h3>
            <span>智能工作助手</span>
          </div>
        </div>
        <div className="assistant-header-actions">
          {messages.length > 0 && (
            <button 
              className="assistant-clear" 
              onClick={async () => {
                try {
                  await aiAssistantApi.deleteAllConversations();
                  dispatch(clearMessages());
                  hasLoadedInitialRef.current = false; // 允许下次重新加载
                } catch (err) {
                  console.error('清空对话失败:', err);
                }
              }}
              title="清空对话"
            >
              <ClearOutlined />
            </button>
          )}
          <button className="assistant-close" onClick={handleClose}>
            <CloseOutlined />
          </button>
        </div>
      </div>

      <div className="assistant-messages">
        {configError ? (
          <div className="empty-messages">
            <SettingOutlined className="empty-messages-icon" style={{ color: '#faad14' }} />
            <p>{configError}</p>
            <span>请先完成 AI 模型配置才能使用助手</span>
            <button 
              className="config-btn"
              onClick={handleGoToSettings}
              style={{
                marginTop: 16,
                padding: '8px 16px',
                background: '#1677ff',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
              }}
            >
              前往配置
            </button>
          </div>
        ) : messages.length === 0 ? (
          <div className="empty-messages">
            <MessageOutlined className="empty-messages-icon" />
            <p>开始与 AI 助手对话</p>
            <span>提问、获取帮助、或分析文档</span>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`message ${msg.role.toLowerCase()}`}>
              <div className="message-avatar">
                {msg.role === 'USER' ? <UserOutlined /> : <RobotOutlined />}
              </div>
              <div className="message-body">
                <div className="message-content">{msg.content}</div>
                {renderAttachments(msg.attachments)}
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="message assistant">
            <div className="message-avatar">
              <RobotOutlined />
            </div>
            <div className="message-body">
              <div className="message-content">
                {toolStatus ? (
                  <div className="tool-status" style={{ display: 'flex', alignItems: 'center', color: '#1677ff' }}>
                    <LoadingOutlined style={{ marginRight: 8 }} />
                    {toolStatus}
                  </div>
                ) : (
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        {error && !configError && (
          <div className="message assistant">
            <div className="message-avatar">
              <RobotOutlined />
            </div>
            <div className="message-body">
              <div className="message-content" style={{ color: '#ff4d4f' }}>
                {error}
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="assistant-input">
        {/* 待发送文件预览 */}
        {pendingFiles.length > 0 && (
          <div className="pending-files">
            {pendingFiles.map((file, idx) => (
              <div key={`${file.name}-${idx}`} className="pending-file-item">
                {filePreviews[file.name] ? (
                  <img src={filePreviews[file.name]} alt={file.name} className="pending-file-preview" />
                ) : (
                  <div className="pending-file-icon">
                    {isPdfType(file.type) ? <FilePdfOutlined /> : <FileOutlined />}
                  </div>
                )}
                <span className="pending-file-name">{file.name}</span>
                <button className="pending-file-remove" onClick={() => handleRemoveFile(idx)}>
                  <DeleteOutlined />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="input-wrapper">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder={configError ? "请先配置 AI 模型..." : "输入消息..."}
            rows={1}
            disabled={!!configError}
          />
          <div className="input-actions">
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept="image/*,.pdf"
              multiple
              onChange={handleFileSelect}
            />
            <button
              className="input-btn upload"
              title="上传文件"
              disabled={!!configError}
              onClick={() => fileInputRef.current?.click()}
            >
              <PaperClipOutlined />
            </button>
            <button
              className="input-btn send"
              onClick={handleSend}
              disabled={(!inputValue.trim() && pendingFiles.length === 0) || isLoading || !!configError}
              title="发送消息"
            >
              <SendOutlined />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAssistantPanel;
