import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Space,
  Alert,
  Divider,
  Select,
  Spin,
  App,
  Tag,
} from 'antd';
import {
  ApiOutlined,
  SaveOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  BulbOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { systemConfigApi, AIModelConfig } from '../../services/systemConfigApi';

interface ModelOption {
  value: string;
  label: string;
}

const AIModelConfigPage: React.FC = () => {
  const [modelForm] = Form.useForm();
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [modelOptions, setModelOptions] = useState<ModelOption[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [savedModelsCount, setSavedModelsCount] = useState(0);
  const { message } = App.useApp();

  // 默认模型选项
  const defaultModelOptions: ModelOption[] = [
    { value: 'gpt-4o', label: 'GPT-4o' },
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
    { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
    { value: 'deepseek-chat', label: 'DeepSeek Chat' },
    { value: 'deepseek-reasoner', label: 'DeepSeek Reasoner' },
    { value: 'qwen-turbo', label: '通义千问 Turbo' },
    { value: 'qwen-plus', label: '通义千问 Plus' },
  ];

  // Load saved config and models from backend and localStorage
  useEffect(() => {
    const loadConfig = async () => {
      // 首先尝试从后端加载配置
      try {
        const backendConfig = await systemConfigApi.getAIModelConfig();
        if (backendConfig && backendConfig.apiUrl) {
          // 后端有配置，使用后端配置
          // 从 localStorage 获取完整的 apiKey（后端返回的是脱敏的）
          const localConfig = localStorage.getItem('ai_model_config');
          let fullApiKey = backendConfig.apiKey;
          if (localConfig) {
            try {
              const parsed = JSON.parse(localConfig);
              if (parsed.apiKey && !parsed.apiKey.includes('****')) {
                fullApiKey = parsed.apiKey;
              }
            } catch {
              // ignore
            }
          }
          modelForm.setFieldsValue({
            ...backendConfig,
            apiKey: fullApiKey,
          });
        } else {
          // 后端没有配置，尝试从 localStorage 加载
          const savedConfig = localStorage.getItem('ai_model_config');
          if (savedConfig) {
            try {
              const config = JSON.parse(savedConfig);
              modelForm.setFieldsValue(config);
            } catch {
              // ignore parse error
            }
          }
        }
      } catch {
        // 后端加载失败，从 localStorage 加载
        const savedConfig = localStorage.getItem('ai_model_config');
        if (savedConfig) {
          try {
            const config = JSON.parse(savedConfig);
            modelForm.setFieldsValue(config);
          } catch {
            // ignore parse error
          }
        }
      }
    };

    loadConfig();
    
    // 加载已保存的模型列表
    const savedModels = localStorage.getItem('ai_model_options');
    if (savedModels) {
      try {
        const models: ModelOption[] = JSON.parse(savedModels);
        if (Array.isArray(models) && models.length > 0) {
          setModelOptions(models);
          setSavedModelsCount(models.length);
          return;
        }
      } catch {
        // ignore parse error
      }
    }
    
    // 没有保存的模型列表时使用默认选项
    setModelOptions(defaultModelOptions);
  }, [modelForm]);

  // 从API拉取模型列表
  const fetchModels = async () => {
    const url = modelForm.getFieldValue('apiUrl');
    const key = modelForm.getFieldValue('apiKey');

    if (!url || !key) {
      message.warning('请先填写 API 地址和密钥');
      return;
    }

    setModelsLoading(true);
    try {
      // 构建模型列表API地址
      const modelsUrl = url.endsWith('/') ? `${url}models` : `${url}/models`;
      
      const response = await fetch(modelsUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const models = data.data || data.models || [];
        
        if (Array.isArray(models) && models.length > 0) {
          const options: ModelOption[] = models.map((model: { id?: string; name?: string }) => ({
            value: model.id || model.name || '',
            label: model.id || model.name || '',
          })).filter((opt: ModelOption) => opt.value);
          
          setModelOptions(options);
          setSavedModelsCount(options.length);
          // 保存模型列表到localStorage
          localStorage.setItem('ai_model_options', JSON.stringify(options));
          message.success(`成功获取 ${options.length} 个可用模型`);
        } else {
          message.info('未获取到模型列表，使用默认选项');
          setModelOptions(defaultModelOptions);
          setSavedModelsCount(0);
        }
      } else {
        const errorText = await response.text();
        console.error('Failed to fetch models:', errorText);
        message.error('获取模型列表失败，使用默认选项');
        setModelOptions(defaultModelOptions);
        setSavedModelsCount(0);
      }
    } catch (error) {
      console.error('Error fetching models:', error);
      message.error('获取模型列表失败，请检查 API 地址和密钥');
      setModelOptions(defaultModelOptions);
      setSavedModelsCount(0);
    } finally {
      setModelsLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    try {
      const values = await modelForm.validateFields();
      const config: AIModelConfig = {
        apiUrl: values.apiUrl,
        apiKey: values.apiKey,
        modelName: values.modelName,
        temperature: values.temperature || 0.7,
      };
      
      // 保存到 localStorage（包含完整 API key）
      localStorage.setItem('ai_model_config', JSON.stringify(config));
      // 同时保存当前模型列表
      localStorage.setItem('ai_model_options', JSON.stringify(modelOptions));
      
      // 同时保存到后端数据库
      try {
        await systemConfigApi.saveAIModelConfig(config);
        message.success('AI 模型配置已保存（本地 + 后端）');
      } catch (backendError) {
        console.error('Failed to save to backend:', backendError);
        message.warning('AI 模型配置已保存到本地，但后端保存失败');
      }
    } catch {
      message.error('请检查配置项');
    }
  };

  const handleTestConnection = async () => {
    try {
      await modelForm.validateFields();
      setTestLoading(true);
      setTestResult(null);

      const apiUrl = modelForm.getFieldValue('apiUrl');
      const apiKey = modelForm.getFieldValue('apiKey');
      const modelName = modelForm.getFieldValue('modelName');

      // 直接调用 OpenAI 兼容接口测试
      const chatUrl = apiUrl.endsWith('/') ? `${apiUrl}chat/completions` : `${apiUrl}/chat/completions`;
      
      const response = await fetch(chatUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: modelName,
          messages: [{ role: 'user', content: 'Hello' }],
          max_tokens: 5,
        }),
      });

      if (response.ok) {
        setTestResult('success');
        message.success('连接测试成功');
      } else {
        setTestResult('error');
        const errorData = await response.text();
        message.error(`连接测试失败: ${errorData.substring(0, 100)}`);
      }
    } catch (error) {
      setTestResult('error');
      message.error('连接测试失败，请检查网络和配置');
    } finally {
      setTestLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">AI 模型配置</h1>
        <p className="page-subtitle">配置全局 AI 助手所使用的大模型 API</p>
      </div>

      <Card>
        <Alert
          title="配置说明"
          description="此处配置全局 AI 助手所使用的大模型 API。支持 OpenAI 兼容接口（如 OpenAI、DeepSeek、通义千问等）。配置保存后，AI 助手将使用该配置进行对话。"
          type="info"
          showIcon
          icon={<BulbOutlined />}
          style={{ marginBottom: 24 }}
        />

        <Form
          form={modelForm}
          layout="vertical"
          initialValues={{
            apiUrl: 'https://api.openai.com/v1',
            modelName: 'gpt-4o-mini',
            temperature: 0.7,
          }}
          style={{ maxWidth: 600 }}
        >
          <Form.Item
            name="apiUrl"
            label="API 地址"
            rules={[{ required: true, message: '请输入 API 地址' }]}
            extra="OpenAI 兼容接口地址，如 https://api.openai.com/v1"
          >
            <Input placeholder="https://api.openai.com/v1" />
          </Form.Item>

          <Form.Item
            name="apiKey"
            label="API 密钥"
            rules={[{ required: true, message: '请输入 API 密钥' }]}
          >
            <Input.Password placeholder="输入 API 密钥" />
          </Form.Item>

          <Form.Item label="模型名称" required>
            <Space.Compact style={{ width: '100%' }}>
              <Form.Item
                name="modelName"
                noStyle
                rules={[{ required: true, message: '请选择或输入模型名称' }]}
              >
                <Select
                  showSearch
                  placeholder="选择或输入模型名称"
                  options={modelOptions}
                  style={{ width: 'calc(100% - 100px)' }}
                  loading={modelsLoading}
                  notFoundContent={modelsLoading ? <Spin size="small" /> : '暂无数据'}
                />
              </Form.Item>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => fetchModels()}
                loading={modelsLoading}
                style={{ width: 100 }}
              >
                拉取模型
              </Button>
            </Space.Compact>
            <div style={{ marginTop: 4, color: '#999', fontSize: 12 }}>
              {savedModelsCount > 0 ? (
                <Space>
                  <span>已拉取 <Tag color="blue">{savedModelsCount}</Tag> 个模型</span>
                  <span>·</span>
                  <span>点击"拉取模型"重新获取</span>
                </Space>
              ) : (
                <span>点击"拉取模型"从 API 获取可用模型列表</span>
              )}
            </div>
          </Form.Item>

          <Form.Item
            name="temperature"
            label="温度参数"
            extra="控制回复的随机性，值越高越随机（0-2）"
          >
            <Input type="number" min={0} max={2} step={0.1} placeholder="0.7" />
          </Form.Item>

          <Divider />

          <Form.Item>
            <Space>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={handleSaveConfig}
              >
                保存配置
              </Button>
              <Button
                icon={testResult === 'success' ? <CheckCircleOutlined /> : testResult === 'error' ? <CloseCircleOutlined /> : <ApiOutlined />}
                loading={testLoading}
                onClick={handleTestConnection}
                style={testResult === 'success' ? { color: '#52c41a', borderColor: '#52c41a' } : testResult === 'error' ? { color: '#ff4d4f', borderColor: '#ff4d4f' } : {}}
              >
                {testResult === 'success' ? '连接成功' : testResult === 'error' ? '连接失败' : '测试连接'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default AIModelConfigPage;
