import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Space,
  Tag,
  Table,
  Popconfirm,
  Empty,
  Alert,
  App,
} from 'antd';
import {
  DeleteOutlined,
  BulbOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { aiAssistantApi } from '../../services/aiAssistantApi';
import { AIMemory } from '../../types';

const memoryTypeLabels: Record<string, string> = {
  FACT: '事实',
  PREFERENCE: '偏好',
  WORKFLOW: '工作流',
  CONTEXT: '上下文',
};

const memoryTypeColors: Record<string, string> = {
  FACT: 'blue',
  PREFERENCE: 'green',
  WORKFLOW: 'orange',
  CONTEXT: 'purple',
};

const AIMemoryPage: React.FC = () => {
  const [memories, setMemories] = useState<AIMemory[]>([]);
  const [memoriesLoading, setMemoriesLoading] = useState(false);
  const { message } = App.useApp();

  const handleLoadMemories = async () => {
    setMemoriesLoading(true);
    try {
      const data = await aiAssistantApi.getMemories();
      setMemories(Array.isArray(data) ? data : []);
    } catch {
      message.error('加载记忆失败，请检查后端服务');
    } finally {
      setMemoriesLoading(false);
    }
  };

  useEffect(() => {
    handleLoadMemories();
  }, []);

  const handleDeleteMemory = async (id: string) => {
    try {
      await aiAssistantApi.deleteMemory(id);
      setMemories(prev => prev.filter(m => m.id !== id));
      message.success('记忆已删除');
    } catch {
      message.error('删除失败');
    }
  };

  const handleClearAllMemories = async () => {
    try {
      await aiAssistantApi.deleteAllMemories();
      setMemories([]);
      message.success('所有记忆已清除');
    } catch {
      message.error('清除失败');
    }
  };

  const memoryColumns: ColumnsType<AIMemory> = [
    {
      title: '类型',
      dataIndex: 'memoryType',
      key: 'memoryType',
      width: 100,
      render: (type) => (
        <Tag color={memoryTypeColors[type] || 'default'}>
          {memoryTypeLabels[type] || type}
        </Tag>
      ),
    },
    {
      title: '内容',
      dataIndex: 'content',
      key: 'content',
      ellipsis: true,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (time) => time ? new Date(time).toLocaleString('zh-CN') : '-',
    },
    {
      title: '操作',
      key: 'actions',
      width: 80,
      render: (_, record) => (
        <Popconfirm
          title="确定删除该记忆？"
          okText="确定"
          cancelText="取消"
          onConfirm={() => handleDeleteMemory(record.id)}
        >
          <Button type="text" size="small" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">上下文记忆管理</h1>
        <p className="page-subtitle">管理 AI 助手积累的上下文记忆</p>
      </div>

      <Card
        extra={
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={handleLoadMemories}
              loading={memoriesLoading}
            >
              刷新
            </Button>
            {memories.length > 0 && (
              <Popconfirm
                title="清除所有记忆"
                description="确定要清除所有 AI 助手的上下文记忆吗？此操作不可恢复。"
                okText="确定清除"
                cancelText="取消"
                okButtonProps={{ danger: true }}
                onConfirm={handleClearAllMemories}
              >
                <Button danger icon={<DeleteOutlined />}>
                  清除全部
                </Button>
              </Popconfirm>
            )}
          </Space>
        }
      >
        <Alert
          title="记忆管理说明"
          description="AI 助手会在对话过程中自动积累上下文记忆。每次对话的用户消息和助手回复都会被保存，您可以在此查看和管理这些记忆，删除不再需要的上下文信息以优化 AI 助手的表现。"
          type="info"
          showIcon
          icon={<BulbOutlined />}
          style={{ marginBottom: 24 }}
        />

        {memories.length > 0 ? (
          <Table
            columns={memoryColumns}
            dataSource={memories}
            rowKey="id"
            loading={memoriesLoading}
            pagination={{ pageSize: 10 }}
          />
        ) : (
          <Empty description="暂无上下文记忆，与 AI 助手对话后记忆将自动保存" />
        )}
      </Card>
    </div>
  );
};

export default AIMemoryPage;
