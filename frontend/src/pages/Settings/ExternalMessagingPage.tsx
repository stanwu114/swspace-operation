import React, { useState, useEffect } from 'react';
import {
  Card,
  Tabs,
  Table,
  Button,
  Space,
  Tag,
  Switch,
  Form,
  Input,
  Select,
  Modal,
  Popconfirm,
  Typography,
  Alert,
  Row,
  Col,
  Tooltip,
  Empty,
  App,
} from 'antd';
import {
  SendOutlined,
  LinkOutlined,
  MessageOutlined,
  CopyOutlined,
  DeleteOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ArrowDownOutlined,
  ArrowUpOutlined,
  WechatOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { messagingApi, TelegramSetupResult } from '../../services/messagingApi';
import { employeeApi } from '../../services/organizationApi';
import {
  PlatformConfig,
  UserBinding,
  BindingCode,
  MessageLog,
  PlatformType,
  Employee,
} from '../../types';

const { Text, Paragraph } = Typography;

const platformLabels: Record<PlatformType, string> = {
  TELEGRAM: 'Telegram',
  WECHAT: '微信',
};

const bindingStatusConfig: Record<string, { color: string; label: string }> = {
  PENDING: { color: 'orange', label: '待绑定' },
  ACTIVE: { color: 'green', label: '已绑定' },
  REVOKED: { color: 'default', label: '已撤销' },
};

const processingStatusConfig: Record<string, { color: string; label: string }> = {
  RECEIVED: { color: 'blue', label: '已接收' },
  PROCESSING: { color: 'processing', label: '处理中' },
  COMPLETED: { color: 'green', label: '已完成' },
  FAILED: { color: 'red', label: '失败' },
};

const ExternalMessagingPage: React.FC = () => {
  const { message } = App.useApp();

  // Platform config state
  const [platforms, setPlatforms] = useState<PlatformConfig[]>([]);
  const [platformsLoading, setPlatformsLoading] = useState(false);
  const [telegramForm] = Form.useForm();
  const [wechatForm] = Form.useForm();
  const [telegramSetupLoading, setTelegramSetupLoading] = useState(false);
  const [telegramBotUsername, setTelegramBotUsername] = useState<string | null>(null);

  // Binding state
  const [bindings, setBindings] = useState<UserBinding[]>([]);
  const [bindingsLoading, setBindingsLoading] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>();
  const [bindingCodeModal, setBindingCodeModal] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<BindingCode | null>(null);
  const [generatingCode, setGeneratingCode] = useState(false);

  // Message log state
  const [messages, setMessages] = useState<MessageLog[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagePage, setMessagePage] = useState(0);
  const [messageTotal, setMessageTotal] = useState(0);

  // Load data
  useEffect(() => {
    loadPlatforms();
    loadBindings();
    loadEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadPlatforms = async () => {
    setPlatformsLoading(true);
    try {
      const data = await messagingApi.getPlatforms();
      setPlatforms(Array.isArray(data) ? data : []);
      // Populate forms
      const telegram = (Array.isArray(data) ? data : []).find(p => p.platformType === 'TELEGRAM');
      const wechat = (Array.isArray(data) ? data : []).find(p => p.platformType === 'WECHAT');
      if (telegram?.configData) {
        telegramForm.setFieldsValue({
          botToken: telegram.configData.botToken || '',
          webhookSecret: telegram.configData.webhookSecret || '',
          webhookUrl: telegram.configData.webhookBaseUrl || '',
        });
        if (telegram.configData.botUsername) {
          setTelegramBotUsername(telegram.configData.botUsername as string);
        }
      }
      if (wechat?.configData) {
        wechatForm.setFieldsValue({
          appId: wechat.configData.appId || '',
          appSecret: wechat.configData.appSecret || '',
          token: wechat.configData.token || '',
        });
      }
    } catch {
      // Platform config may not exist yet
    } finally {
      setPlatformsLoading(false);
    }
  };

  const loadBindings = async () => {
    setBindingsLoading(true);
    try {
      const data = await messagingApi.getBindings();
      setBindings(Array.isArray(data) ? data : []);
    } catch {
      // ignore
    } finally {
      setBindingsLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const data = await employeeApi.getList();
      setEmployees(Array.isArray(data) ? data : []);
    } catch {
      // ignore
    }
  };

  const loadMessages = async (page = 0) => {
    setMessagesLoading(true);
    try {
      const data = await messagingApi.getMessages(page, 20);
      if (data && Array.isArray(data.content)) {
        setMessages(data.content);
        setMessageTotal(data.totalElements);
      } else if (Array.isArray(data)) {
        setMessages(data as unknown as MessageLog[]);
        setMessageTotal((data as unknown as MessageLog[]).length);
      }
      setMessagePage(page);
    } catch {
      // ignore
    } finally {
      setMessagesLoading(false);
    }
  };

  // Platform config handlers
  const handleSaveTelegram = async () => {
    try {
      const values = await telegramForm.validateFields();
      setTelegramSetupLoading(true);

      // Call setup endpoint: validates token, gets bot username, registers webhook
      const result: TelegramSetupResult = await messagingApi.setupTelegram({
        botToken: values.botToken,
        webhookSecret: values.webhookSecret || undefined,
        webhookUrl: values.webhookUrl || undefined,
      });

      if (result.success) {
        setTelegramBotUsername(result.botUsername);
        message.success(result.message || 'Telegram Bot 配置成功');
      } else {
        message.error(result.message || '配置失败');
      }
      loadPlatforms();
    } catch {
      message.error('保存失败，请检查 Bot Token 是否正确');
    } finally {
      setTelegramSetupLoading(false);
    }
  };

  const handleSaveWechat = async () => {
    try {
      const values = await wechatForm.validateFields();
      const existing = platforms.find(p => p.platformType === 'WECHAT');
      await messagingApi.savePlatform({
        id: existing?.id,
        platformType: 'WECHAT',
        platformName: '微信公众号',
        configData: {
          appId: values.appId,
          appSecret: values.appSecret,
          token: values.token,
        },
        isEnabled: existing?.isEnabled ?? true,
      });
      message.success('微信配置已保存');
      loadPlatforms();
    } catch {
      message.error('保存失败');
    }
  };

  const handleTogglePlatform = async (id: string) => {
    try {
      await messagingApi.togglePlatform(id);
      message.success('平台状态已切换');
      loadPlatforms();
    } catch {
      message.error('操作失败');
    }
  };

  // Binding handlers
  const handleGenerateCode = async () => {
    if (!selectedEmployeeId) {
      message.warning('请先选择一个员工');
      return;
    }
    setGeneratingCode(true);
    try {
      const code = await messagingApi.generateBindingCode(selectedEmployeeId);
      setGeneratedCode(code);
      setBindingCodeModal(true);
      loadBindings();
    } catch {
      message.error('生成绑定码失败');
    } finally {
      setGeneratingCode(false);
    }
  };

  const handleRevokeBinding = async (id: string) => {
    try {
      await messagingApi.revokeBinding(id);
      message.success('绑定已撤销');
      loadBindings();
    } catch {
      message.error('撤销失败');
    }
  };

  const handleCopyCode = () => {
    if (generatedCode) {
      const textToCopy = generatedCode.deepLinkUrl || generatedCode.bindingCode;
      navigator.clipboard.writeText(textToCopy);
      message.success(generatedCode.deepLinkUrl ? '绑定链接已复制到剪贴板' : '绑定码已复制到剪贴板');
    }
  };

  // Table columns
  const bindingColumns: ColumnsType<UserBinding> = [
    {
      title: '员工',
      dataIndex: 'employeeName',
      key: 'employeeName',
      width: 120,
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: '平台',
      dataIndex: 'platformType',
      key: 'platformType',
      width: 100,
      render: (type: PlatformType) => (
        <Tag color={type === 'TELEGRAM' ? 'blue' : 'green'}>
          {platformLabels[type]}
        </Tag>
      ),
    },
    {
      title: '平台用户ID',
      dataIndex: 'platformUserId',
      key: 'platformUserId',
      width: 150,
      ellipsis: true,
      render: (text) => text?.startsWith('pending-') ? <Text type="secondary">待绑定</Text> : text,
    },
    {
      title: '平台用户名',
      dataIndex: 'platformUsername',
      key: 'platformUsername',
      width: 120,
      render: (text) => text || '-',
    },
    {
      title: '状态',
      dataIndex: 'bindingStatus',
      key: 'bindingStatus',
      width: 90,
      render: (status: string) => {
        const cfg = bindingStatusConfig[status] || { color: 'default', label: status };
        return <Tag color={cfg.color}>{cfg.label}</Tag>;
      },
    },
    {
      title: '绑定时间',
      dataIndex: 'boundAt',
      key: 'boundAt',
      width: 170,
      render: (time) => time ? new Date(time).toLocaleString('zh-CN') : '-',
    },
    {
      title: '操作',
      key: 'actions',
      width: 80,
      render: (_, record) =>
        record.bindingStatus === 'ACTIVE' ? (
          <Popconfirm
            title="确定撤销该绑定？"
            okText="确定"
            cancelText="取消"
            onConfirm={() => handleRevokeBinding(record.id)}
          >
            <Button type="text" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        ) : null,
    },
  ];

  const messageColumns: ColumnsType<MessageLog> = [
    {
      title: '平台',
      dataIndex: 'platformType',
      key: 'platformType',
      width: 100,
      render: (type: PlatformType) => (
        <Tag color={type === 'TELEGRAM' ? 'blue' : 'green'}>
          {platformLabels[type]}
        </Tag>
      ),
    },
    {
      title: '方向',
      dataIndex: 'direction',
      key: 'direction',
      width: 80,
      render: (dir: string) =>
        dir === 'INBOUND' ? (
          <Tooltip title="接收"><ArrowDownOutlined style={{ color: '#52c41a' }} /> 入</Tooltip>
        ) : (
          <Tooltip title="发送"><ArrowUpOutlined style={{ color: '#1890ff' }} /> 出</Tooltip>
        ),
    },
    {
      title: '内容',
      dataIndex: 'content',
      key: 'content',
      ellipsis: true,
      render: (text) => text || '-',
    },
    {
      title: '状态',
      dataIndex: 'processingStatus',
      key: 'processingStatus',
      width: 90,
      render: (status: string) => {
        const cfg = processingStatusConfig[status] || { color: 'default', label: status };
        return <Tag color={cfg.color}>{cfg.label}</Tag>;
      },
    },
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 170,
      render: (time) => time ? new Date(time).toLocaleString('zh-CN') : '-',
    },
  ];

  const telegramConfig = platforms.find(p => p.platformType === 'TELEGRAM');
  const wechatConfig = platforms.find(p => p.platformType === 'WECHAT');

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">消息集成</h1>
        <p className="page-subtitle">管理 Telegram、微信等外部消息平台与 AI 助手的集成</p>
      </div>

      <Card>
        <Tabs
          items={[
            {
              key: 'platforms',
              label: (
                <Space>
                  <LinkOutlined />
                  <span>平台配置</span>
                </Space>
              ),
              children: (
                <div>
                  <Alert
                    description="配置外部消息平台的连接信息。配置完成后，用户可以通过 Telegram Bot 或微信公众号与 AI 助手进行对话。"
                    type="info"
                    showIcon
                    style={{ marginBottom: 24 }}
                  />
                  <Row gutter={24}>
                    <Col span={12}>
                      <Card
                        title={
                          <Space>
                            <SendOutlined style={{ color: '#0088cc' }} />
                            <span>Telegram Bot</span>
                          </Space>
                        }
                        extra={
                          telegramConfig && (
                            <Switch
                              checked={telegramConfig.isEnabled}
                              onChange={() => handleTogglePlatform(telegramConfig.id)}
                              checkedChildren={<CheckCircleOutlined />}
                              unCheckedChildren={<CloseCircleOutlined />}
                            />
                          )
                        }
                        loading={platformsLoading}
                      >
                        <Form form={telegramForm} layout="vertical">
                          <Form.Item
                            name="botToken"
                            label="Bot Token"
                            rules={[{ required: true, message: '请输入 Bot Token' }]}
                          >
                            <Input.Password placeholder="从 @BotFather 获取的 Token" />
                          </Form.Item>
                          <Form.Item
                            name="webhookUrl"
                            label="Webhook URL"
                            tooltip="公网可访问的 URL，如 https://your-domain.com 或 ngrok 地址。用于接收 Telegram 消息。"
                            rules={[{ required: true, message: '请输入 Webhook URL' }]}
                          >
                            <Input placeholder="例如: https://your-domain.com 或 https://xxx.ngrok.io" />
                          </Form.Item>
                          <Form.Item name="webhookSecret" label="Webhook Secret">
                            <Input placeholder="可选，用于验证 Webhook 请求" />
                          </Form.Item>
                          {telegramConfig?.webhookUrl && (
                            <Form.Item label="Webhook URL">
                              <Paragraph copyable code style={{ marginBottom: 0 }}>
                                {telegramConfig.webhookUrl}
                              </Paragraph>
                            </Form.Item>
                          )}
                          {telegramBotUsername && (
                            <Form.Item label="Bot Username">
                              <Tag color="blue">@{telegramBotUsername}</Tag>
                            </Form.Item>
                          )}
                          <Button type="primary" onClick={handleSaveTelegram} loading={telegramSetupLoading}>
                            {telegramBotUsername ? '更新配置' : '验证并保存'}
                          </Button>
                        </Form>
                      </Card>
                    </Col>
                    <Col span={12}>
                      <Card
                        title={
                          <Space>
                            <WechatOutlined style={{ color: '#07c160' }} />
                            <span>微信公众号</span>
                          </Space>
                        }
                        extra={
                          wechatConfig && (
                            <Switch
                              checked={wechatConfig.isEnabled}
                              onChange={() => handleTogglePlatform(wechatConfig.id)}
                              checkedChildren={<CheckCircleOutlined />}
                              unCheckedChildren={<CloseCircleOutlined />}
                            />
                          )
                        }
                        loading={platformsLoading}
                      >
                        <Form form={wechatForm} layout="vertical">
                          <Form.Item
                            name="appId"
                            label="AppID"
                            rules={[{ required: true, message: '请输入 AppID' }]}
                          >
                            <Input placeholder="公众号 AppID" />
                          </Form.Item>
                          <Form.Item
                            name="appSecret"
                            label="AppSecret"
                            rules={[{ required: true, message: '请输入 AppSecret' }]}
                          >
                            <Input.Password placeholder="公众号 AppSecret" />
                          </Form.Item>
                          <Form.Item name="token" label="Token">
                            <Input placeholder="服务器配置中的 Token" />
                          </Form.Item>
                          <Button type="primary" onClick={handleSaveWechat}>
                            保存配置
                          </Button>
                        </Form>
                      </Card>
                    </Col>
                  </Row>
                </div>
              ),
            },
            {
              key: 'bindings',
              label: (
                <Space>
                  <SendOutlined />
                  <span>用户绑定</span>
                  <Tag>{bindings.filter(b => b.bindingStatus === 'ACTIVE').length}</Tag>
                </Space>
              ),
              children: (
                <div>
                  <Alert
                    description="为员工生成绑定链接，员工点击链接即可在 Telegram 中自动完成绑定。绑定码有效期 30 分钟，使用一次后失效。"
                    type="info"
                    showIcon
                    style={{ marginBottom: 24 }}
                  />
                  <Space style={{ marginBottom: 16 }}>
                    <Select
                      placeholder="选择员工"
                      style={{ width: 200 }}
                      showSearch
                      optionFilterProp="label"
                      value={selectedEmployeeId}
                      onChange={setSelectedEmployeeId}
                      options={employees.map(e => ({ value: e.id, label: e.name }))}
                      allowClear
                    />
                    <Button
                      type="primary"
                      icon={<LinkOutlined />}
                      onClick={handleGenerateCode}
                      loading={generatingCode}
                      disabled={!selectedEmployeeId}
                    >
                      生成绑定码
                    </Button>
                    <Button icon={<ReloadOutlined />} onClick={loadBindings}>
                      刷新
                    </Button>
                  </Space>
                  {bindings.length > 0 ? (
                    <Table
                      columns={bindingColumns}
                      dataSource={bindings}
                      rowKey="id"
                      loading={bindingsLoading}
                      pagination={{ pageSize: 10 }}
                    />
                  ) : (
                    <Empty description="暂无绑定记录" />
                  )}
                </div>
              ),
            },
            {
              key: 'messages',
              label: (
                <Space>
                  <MessageOutlined />
                  <span>消息日志</span>
                </Space>
              ),
              children: (
                <div>
                  <Space style={{ marginBottom: 16 }}>
                    <Button
                      icon={<ReloadOutlined />}
                      onClick={() => loadMessages(messagePage)}
                    >
                      刷新
                    </Button>
                  </Space>
                  {messages.length > 0 ? (
                    <Table
                      columns={messageColumns}
                      dataSource={messages}
                      rowKey="id"
                      loading={messagesLoading}
                      pagination={{
                        current: messagePage + 1,
                        pageSize: 20,
                        total: messageTotal,
                        onChange: (page) => loadMessages(page - 1),
                      }}
                    />
                  ) : (
                    <Empty description="暂无消息记录" />
                  )}
                </div>
              ),
            },
          ]}
          onChange={(key) => {
            if (key === 'messages' && messages.length === 0) {
              loadMessages();
            }
          }}
        />
      </Card>

      {/* Binding Code Modal */}
      <Modal
        title="绑定码已生成"
        open={bindingCodeModal}
        onCancel={() => setBindingCodeModal(false)}
        footer={[
          <Button
            key="copy"
            type="primary"
            icon={<CopyOutlined />}
            onClick={handleCopyCode}
          >
            {generatedCode?.deepLinkUrl ? '复制绑定链接' : '复制绑定码'}
          </Button>,
          <Button key="close" onClick={() => setBindingCodeModal(false)}>
            关闭
          </Button>,
        ]}
      >
        {generatedCode && (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            {generatedCode.deepLinkUrl ? (
              <>
                <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                  请将以下链接发送给员工，点击即可在 Telegram 中自动完成绑定：
                </Text>
                <Button
                  type="primary"
                  size="large"
                  icon={<SendOutlined />}
                  href={generatedCode.deepLinkUrl}
                  target="_blank"
                  style={{ marginBottom: 16 }}
                >
                  在 Telegram 中打开
                </Button>
                <div style={{ marginBottom: 12 }}>
                  <Paragraph copyable code style={{ fontSize: 13, marginBottom: 0 }}>
                    {generatedCode.deepLinkUrl}
                  </Paragraph>
                </div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  绑定码: {generatedCode.bindingCode} | 过期时间：{new Date(generatedCode.expiresAt).toLocaleString('zh-CN')}
                </Text>
              </>
            ) : (
              <>
                <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                  请将以下绑定码发送给员工，在 Telegram Bot 中发送命令：
                </Text>
                <Paragraph code copyable style={{ fontSize: 16 }}>
                  /bind {generatedCode.bindingCode}
                </Paragraph>
                <div
                  style={{
                    fontSize: 48,
                    fontWeight: 'bold',
                    letterSpacing: 8,
                    color: '#1890ff',
                    margin: '16px 0',
                  }}
                >
                  {generatedCode.bindingCode}
                </div>
                <Text type="secondary">
                  过期时间：{new Date(generatedCode.expiresAt).toLocaleString('zh-CN')}
                </Text>
                <div style={{ marginTop: 12 }}>
                  <Alert
                    type="warning"
                    showIcon
                    description="Telegram Bot Username 尚未配置，请先在「平台配置」中保存 Bot Token 以启用深度链接绑定。"
                  />
                </div>
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ExternalMessagingPage;
