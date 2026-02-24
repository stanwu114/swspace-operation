import React, { useEffect, useState } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Space,
  Popconfirm,
  Tag,
  Drawer,
  Descriptions,
  InputNumber,
  Divider,
  App,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  RobotOutlined,
  SettingOutlined,
  ApiOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '../../hooks/useStore';
import {
  fetchEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  fetchDepartments,
  fetchPositions,
  saveAIConfig,
  fetchEmployeeById,
} from '../../store/slices/organizationSlice';
import { Employee, EmployeeForm, AIEmployeeConfigForm, EmployeeType, ConnectionStatus } from '../../types';
import type { ColumnsType } from 'antd/es/table';
import { Tabs } from 'antd';

const EmployeesPage: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [configDrawerOpen, setConfigDrawerOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [selectedType, setSelectedType] = useState<EmployeeType | undefined>();
  const [form] = Form.useForm();
  const [configForm] = Form.useForm();
  const dispatch = useAppDispatch();
  const { employees, departments, positions, selectedEmployee, loading } = useAppSelector(
    (state) => state.organization
  );
  const { message } = App.useApp();

  useEffect(() => {
    dispatch(fetchDepartments());
    dispatch(fetchPositions());
    dispatch(fetchEmployees());
  }, [dispatch]);

  const handleFilter = (type?: EmployeeType) => {
    setSelectedType(type);
    dispatch(fetchEmployees(type ? { employeeType: type } : undefined));
  };

  const handleAdd = () => {
    setEditingEmployee(null);
    form.resetFields();
    form.setFieldValue('employeeType', 'HUMAN');
    setModalOpen(true);
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    form.setFieldsValue({
      name: employee.name,
      employeeType: employee.employeeType,
      phone: employee.phone,
      sourceCompany: employee.sourceCompany,
      departmentId: employee.departmentId,
      positionId: employee.positionId,
      dailyCost: employee.dailyCost,
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await dispatch(deleteEmployee(id)).unwrap();
      message.success('员工删除成功');
      dispatch(fetchEmployees(selectedType ? { employeeType: selectedType } : undefined));
    } catch {
      message.error('删除员工失败');
    }
  };

  const handleOpenConfig = async (employee: Employee) => {
    await dispatch(fetchEmployeeById(employee.id));
    if (employee.aiConfig) {
      configForm.setFieldsValue({
        apiUrl: employee.aiConfig.apiUrl,
        apiKey: '',
        modelName: employee.aiConfig.modelName,
        rolePrompt: employee.aiConfig.rolePrompt,
      });
    } else {
      configForm.resetFields();
    }
    setConfigDrawerOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const formData: EmployeeForm = {
        name: values.name,
        employeeType: values.employeeType,
        phone: values.phone,
        sourceCompany: values.sourceCompany,
        departmentId: values.departmentId,
        positionId: values.positionId,
        dailyCost: values.dailyCost,
      };

      if (editingEmployee) {
        await dispatch(updateEmployee({ id: editingEmployee.id, data: formData })).unwrap();
        message.success('员工更新成功');
      } else {
        await dispatch(createEmployee(formData)).unwrap();
        message.success('员工创建成功');
      }

      setModalOpen(false);
      dispatch(fetchEmployees(selectedType ? { employeeType: selectedType } : undefined));
    } catch {
      message.error('操作失败');
    }
  };

  const handleSaveConfig = async () => {
    if (!selectedEmployee) return;
    try {
      const values = await configForm.validateFields();
      const configData: AIEmployeeConfigForm = {
        apiUrl: values.apiUrl,
        apiKey: values.apiKey,
        modelName: values.modelName,
        rolePrompt: values.rolePrompt,
      };

      await dispatch(saveAIConfig({ employeeId: selectedEmployee.id, data: configData })).unwrap();
      message.success('AI 配置保存成功');
      setConfigDrawerOpen(false);
      dispatch(fetchEmployees(selectedType ? { employeeType: selectedType } : undefined));
    } catch {
      message.error('保存 AI 配置失败');
    }
  };

  const getConnectionStatusIcon = (status?: ConnectionStatus) => {
    switch (status) {
      case 'CONNECTED':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'FAILED':
        return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
      default:
        return <QuestionCircleOutlined style={{ color: '#faad14' }} />;
    }
  };

  const connectionStatusLabels: Record<string, string> = {
    CONNECTED: '已连接',
    FAILED: '连接失败',
    UNKNOWN: '未测试',
  };

  const employeeType = Form.useWatch('employeeType', form);

  const columns: ColumnsType<Employee> = [
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space>
          {record.employeeType === 'AI' ? (
            <RobotOutlined style={{ color: '#1890ff' }} />
          ) : (
            <UserOutlined style={{ color: '#6b7280' }} />
          )}
          <span style={{ fontWeight: 500 }}>{text}</span>
        </Space>
      ),
    },
    {
      title: '类型',
      dataIndex: 'employeeType',
      key: 'employeeType',
      width: 100,
      render: (type) => (
        <Tag color={type === 'AI' ? 'blue' : 'default'}>{type === 'AI' ? 'AI 员工' : '人类员工'}</Tag>
      ),
    },
    {
      title: '部门',
      dataIndex: 'departmentName',
      key: 'departmentName',
      render: (text) => text || '-',
    },
    {
      title: '岗位',
      dataIndex: 'positionName',
      key: 'positionName',
      render: (text) => text || '-',
    },
    {
      title: '日成本',
      dataIndex: 'dailyCost',
      key: 'dailyCost',
      width: 120,
      render: (cost) => (cost ? `$${cost}` : '-'),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => (
        <Tag color={status === 'ACTIVE' ? 'green' : 'default'}>{status === 'ACTIVE' ? '在职' : '离职'}</Tag>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="text"
            size="small"
            icon={<EditOutlined style={{ color: '#6b7280' }} />}
            onClick={() => handleEdit(record)}
          />
          {record.employeeType === 'AI' && (
            <Button
              type="text"
              size="small"
              icon={<SettingOutlined style={{ color: '#6b7280' }} />}
              onClick={() => handleOpenConfig(record)}
            />
          )}
          <Popconfirm
            title="删除员工"
            description="确定要删除该员工吗？"
            okText="确定"
            cancelText="取消"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button type="text" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">员工管理</h1>
        <p className="page-subtitle">管理人类员工和 AI 员工</p>
      </div>

      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <UserOutlined style={{ color: '#6b7280' }} />
            <span>员工列表</span>
          </div>
        }
        extra={
          <Space>
            <Tabs
              activeKey={selectedType || 'all'}
              onChange={(key) => handleFilter(key === 'all' ? undefined : (key as EmployeeType))}
              items={[
                { key: 'all', label: '全部' },
                { key: 'HUMAN', label: '人类' },
                { key: 'AI', label: 'AI' },
              ]}
              size="small"
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              新增员工
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={employees}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          locale={{ emptyText: '暂无员工，点击"新增员工"创建' }}
        />
      </Card>

      <Modal
        title={editingEmployee ? '编辑员工' : '新增员工'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        okText={editingEmployee ? '更新' : '创建'}
        cancelText="取消"
        width={600}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="employeeType"
            label="员工类型"
            rules={[{ required: true, message: '请选择员工类型' }]}
          >
            <Select
              options={[
                { value: 'HUMAN', label: '人类员工' },
                { value: 'AI', label: 'AI 员工' },
              ]}
            />
          </Form.Item>

          <Form.Item
            name="name"
            label="姓名"
            rules={[{ required: true, message: '请输入员工姓名' }]}
          >
            <Input placeholder="输入员工姓名" />
          </Form.Item>

          {employeeType === 'HUMAN' && (
            <>
              <Form.Item name="phone" label="电话">
                <Input placeholder="输入电话号码" />
              </Form.Item>
              <Form.Item name="sourceCompany" label="来源公司">
                <Input placeholder="输入来源公司" />
              </Form.Item>
            </>
          )}

          <Form.Item name="departmentId" label="部门">
            <Select
              placeholder="选择部门"
              allowClear
              options={departments.map((d) => ({ value: d.id, label: d.name }))}
            />
          </Form.Item>

          <Form.Item name="positionId" label="岗位">
            <Select
              placeholder="选择岗位"
              allowClear
              options={positions.map((p) => ({ value: p.id, label: p.name }))}
            />
          </Form.Item>

          <Form.Item name="dailyCost" label="日成本 ($)">
            <InputNumber min={0} style={{ width: '100%' }} placeholder="0" />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title={
          <Space>
            <ApiOutlined />
            <span>AI 员工配置</span>
          </Space>
        }
        open={configDrawerOpen}
        onClose={() => setConfigDrawerOpen(false)}
        size="large"
        extra={
          <Button type="primary" onClick={handleSaveConfig}>
            保存配置
          </Button>
        }
      >
        {selectedEmployee && (
          <>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="员工">{selectedEmployee.name}</Descriptions.Item>
              <Descriptions.Item label="连接状态">
                <Space>
                  {getConnectionStatusIcon(selectedEmployee.aiConfig?.connectionStatus)}
                  <span>{connectionStatusLabels[selectedEmployee.aiConfig?.connectionStatus || 'UNKNOWN']}</span>
                </Space>
              </Descriptions.Item>
            </Descriptions>

            <Divider />

            <Form form={configForm} layout="vertical">
              <Form.Item
                name="apiUrl"
                label="API 地址"
                rules={[{ required: true, message: '请输入 API 地址' }]}
              >
                <Input placeholder="https://api.openai.com/v1" />
              </Form.Item>

              <Form.Item
                name="apiKey"
                label="API 密钥"
                rules={[{ required: !selectedEmployee.aiConfig, message: '请输入 API 密钥' }]}
                extra={selectedEmployee.aiConfig ? '留空则保留现有密钥' : ''}
              >
                <Input.Password placeholder="输入 API 密钥" />
              </Form.Item>

              <Form.Item name="modelName" label="模型名称">
                <Input placeholder="gpt-4, gpt-3.5-turbo 等" />
              </Form.Item>

              <Form.Item name="rolePrompt" label="角色提示词">
                <Input.TextArea
                  rows={6}
                  placeholder="输入定义该 AI 员工角色和行为的系统提示词..."
                />
              </Form.Item>
            </Form>
          </>
        )}
      </Drawer>
    </div>
  );
};

export default EmployeesPage;
