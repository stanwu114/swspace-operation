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
  Tabs,
  Upload,
  InputNumber,
  DatePicker,
  Row,
  Col,
  Statistic,
  Typography,
  Tooltip,
  Empty,
  App,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ProjectOutlined,
  FileOutlined,
  DollarOutlined,
  UploadOutlined,
  UserOutlined,
  EyeOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '../../hooks/useStore';
import {
  fetchProjects,
  createProject,
  updateProject,
  deleteProject,
  fetchProjectById,
  fetchProjectDocuments,
  uploadProjectDocument,
  deleteProjectDocument,
  fetchProjectCosts,
  addProjectCost,
  setSelectedProject,
} from '../../store/slices/projectSlice';
import { fetchEmployees } from '../../store/slices/organizationSlice';
import {
  Project,
  ProjectForm,
  ProjectCategory,
  ProjectStatus,
  ProjectDocument,
  ProjectCost,
  CostType,
} from '../../types';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { Text } = Typography;
const { TextArea } = Input;

const categoryLabels: Record<ProjectCategory, string> = {
  PRE_SALE: '售前支撑',
  PLANNING: '顶层规划',
  RESEARCH: '课题研究',
  BLUEBIRD: '青鸟计划',
  DELIVERY: '项目交付',
  STRATEGIC: '战略合作',
};

const categoryColors: Record<ProjectCategory, string> = {
  PRE_SALE: 'blue',
  PLANNING: 'cyan',
  RESEARCH: 'purple',
  BLUEBIRD: 'geekblue',
  DELIVERY: 'green',
  STRATEGIC: 'orange',
};

const statusLabels: Record<ProjectStatus, string> = {
  ACTIVE: '进行中',
  PAUSED: '已暂停',
  COMPLETED: '已完成',
  CANCELLED: '已取消',
};

const statusColors: Record<ProjectStatus, string> = {
  ACTIVE: 'processing',
  PAUSED: 'warning',
  COMPLETED: 'success',
  CANCELLED: 'default',
};

const costTypeLabels: Record<CostType, string> = {
  LABOR: '人力成本',
  PROCUREMENT: '采购成本',
  OTHER: '其他',
};

const ProjectsPage: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [costModalOpen, setCostModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [filterCategory, setFilterCategory] = useState<ProjectCategory | undefined>();
  const [filterStatus, setFilterStatus] = useState<ProjectStatus | undefined>();
  const [form] = Form.useForm();
  const [costForm] = Form.useForm();
  const dispatch = useAppDispatch();
  const { message } = App.useApp();
  
  const { projects, selectedProject, documents, costs, loading } = useAppSelector(
    (state) => state.project
  );
  const { employees } = useAppSelector((state) => state.organization);

  useEffect(() => {
    dispatch(fetchProjects());
    dispatch(fetchEmployees());
  }, [dispatch]);

  const handleFilter = () => {
    const params: { category?: string; status?: string } = {};
    if (filterCategory) params.category = filterCategory;
    if (filterStatus) params.status = filterStatus;
    dispatch(fetchProjects(Object.keys(params).length > 0 ? params : undefined));
  };

  useEffect(() => {
    handleFilter();
  }, [filterCategory, filterStatus]);

  const handleAdd = () => {
    setEditingProject(null);
    form.resetFields();
    setModalOpen(true);
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    form.setFieldsValue({
      projectName: project.projectName,
      projectCategory: project.projectCategory,
      objective: project.objective,
      content: project.content,
      leaderId: project.leaderId,
      startDate: project.startDate ? dayjs(project.startDate) : null,
      clientName: project.clientName,
      clientContact: project.clientContact,
      subcontractEntity: project.subcontractEntity,
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await dispatch(deleteProject(id)).unwrap();
      message.success('项目删除成功');
    } catch (error) {
      message.error('删除项目失败');
    }
  };

  const handleViewDetail = async (project: Project) => {
    dispatch(setSelectedProject(project));
    await Promise.all([
      dispatch(fetchProjectById(project.id)),
      dispatch(fetchProjectDocuments(project.id)),
      dispatch(fetchProjectCosts(project.id)),
    ]);
    setDetailDrawerOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const formData: ProjectForm = {
        projectName: values.projectName,
        projectCategory: values.projectCategory,
        objective: values.objective,
        content: values.content,
        leaderId: values.leaderId,
        startDate: values.startDate ? values.startDate.format('YYYY-MM-DD') : undefined,
        clientName: values.clientName,
        clientContact: values.clientContact,
        subcontractEntity: values.subcontractEntity,
      };

      if (editingProject) {
        await dispatch(updateProject({ id: editingProject.id, data: formData })).unwrap();
        message.success('项目更新成功');
      } else {
        await dispatch(createProject(formData)).unwrap();
        message.success('项目创建成功');
      }

      setModalOpen(false);
      handleFilter();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleUploadDocument = async (file: File) => {
    if (!selectedProject) return;
    try {
      await dispatch(uploadProjectDocument({ projectId: selectedProject.id, file })).unwrap();
      message.success('文档上传成功');
    } catch (error) {
      message.error('文档上传失败');
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!selectedProject) return;
    try {
      await dispatch(deleteProjectDocument({ projectId: selectedProject.id, documentId })).unwrap();
      message.success('文档删除成功');
    } catch (error) {
      message.error('删除文档失败');
    }
  };

  const handleAddCost = async () => {
    if (!selectedProject) return;
    try {
      const values = await costForm.validateFields();
      await dispatch(addProjectCost({
        projectId: selectedProject.id,
        data: {
          costType: values.costType,
          amount: values.amount,
          description: values.description,
          costDate: values.costDate.format('YYYY-MM-DD'),
        },
      })).unwrap();
      message.success('成本添加成功');
      setCostModalOpen(false);
      costForm.resetFields();
      await dispatch(fetchProjectCosts(selectedProject.id));
    } catch (error) {
      message.error('添加成本失败');
    }
  };

  const totalCost = costs.reduce((sum, c) => sum + c.amount, 0);

  const columns: ColumnsType<Project> = [
    {
      title: '项目编号',
      dataIndex: 'projectNo',
      key: 'projectNo',
      width: 140,
      render: (text) => <Text code>{text}</Text>,
    },
    {
      title: '项目名称',
      dataIndex: 'projectName',
      key: 'projectName',
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: '类别',
      dataIndex: 'projectCategory',
      key: 'projectCategory',
      width: 100,
      render: (cat: ProjectCategory) => (
        <Tag color={categoryColors[cat]}>{categoryLabels[cat]}</Tag>
      ),
    },
    {
      title: '负责人',
      dataIndex: 'leaderName',
      key: 'leaderName',
      width: 120,
      render: (text) => text ? (
        <Space>
          <UserOutlined style={{ color: '#6b7280' }} />
          <span>{text}</span>
        </Space>
      ) : '-',
    },
    {
      title: '客户',
      dataIndex: 'clientName',
      key: 'clientName',
      width: 150,
      render: (text) => text || '-',
    },
    {
      title: '开始日期',
      dataIndex: 'startDate',
      key: 'startDate',
      width: 120,
      render: (date) => date || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: ProjectStatus) => (
        <Tag color={statusColors[status]}>{statusLabels[status]}</Tag>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined style={{ color: '#1890ff' }} />}
              onClick={() => handleViewDetail(record)}
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined style={{ color: '#6b7280' }} />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title="删除项目"
            description="确定要删除这个项目吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="text" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const documentColumns: ColumnsType<ProjectDocument> = [
    {
      title: '文档名称',
      dataIndex: 'documentName',
      key: 'documentName',
      render: (text) => (
        <Space>
          <FileOutlined style={{ color: '#6b7280' }} />
          <span>{text}</span>
        </Space>
      ),
    },
    {
      title: '大小',
      dataIndex: 'fileSize',
      key: 'fileSize',
      width: 100,
      render: (size) => size ? `${(size / 1024).toFixed(1)} KB` : '-',
    },
    {
      title: '上传者',
      dataIndex: 'uploaderName',
      key: 'uploaderName',
      width: 120,
      render: (text) => text || '-',
    },
    {
      title: '上传时间',
      dataIndex: 'uploadTime',
      key: 'uploadTime',
      width: 180,
      render: (time) => dayjs(time).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            size="small"
            icon={<DownloadOutlined style={{ color: '#1890ff' }} />}
            href={`/api/files/${record.filePath}`}
            target="_blank"
          />
          <Popconfirm
            title="确定删除该文档？"
            onConfirm={() => handleDeleteDocument(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="text" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const costColumns: ColumnsType<ProjectCost> = [
    {
      title: '类型',
      dataIndex: 'costType',
      key: 'costType',
      width: 120,
      render: (type: CostType) => (
        <Tag color={type === 'LABOR' ? 'blue' : type === 'PROCUREMENT' ? 'green' : 'default'}>
          {costTypeLabels[type]}
        </Tag>
      ),
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      render: (amount) => <Text strong style={{ color: '#1890ff' }}>${amount.toFixed(2)}</Text>,
    },
    {
      title: '说明',
      dataIndex: 'description',
      key: 'description',
      render: (text) => text || '-',
    },
    {
      title: '日期',
      dataIndex: 'costDate',
      key: 'costDate',
      width: 120,
    },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">项目管理</h1>
        <p className="page-subtitle">管理公司所有项目，包括售前、交付、研究等各类项目</p>
      </div>

      <Card
        title={
          <Space>
            <ProjectOutlined style={{ color: '#6b7280' }} />
            <span>项目列表</span>
          </Space>
        }
        extra={
          <Space>
            <Select
              placeholder="项目类别"
              allowClear
              style={{ width: 120 }}
              value={filterCategory}
              onChange={setFilterCategory}
              options={Object.entries(categoryLabels).map(([value, label]) => ({ value, label }))}
            />
            <Select
              placeholder="项目状态"
              allowClear
              style={{ width: 120 }}
              value={filterStatus}
              onChange={setFilterStatus}
              options={Object.entries(statusLabels).map(([value, label]) => ({ value, label }))}
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              新建项目
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={projects}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          locale={{ emptyText: '暂无项目，点击"新建项目"创建第一个项目' }}
        />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        title={editingProject ? '编辑项目' : '新建项目'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        okText={editingProject ? '更新' : '创建'}
        cancelText="取消"
        width={700}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="projectName"
                label="项目名称"
                rules={[{ required: true, message: '请输入项目名称' }]}
              >
                <Input placeholder="输入项目名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="projectCategory"
                label="项目类别"
                rules={[{ required: true, message: '请选择项目类别' }]}
              >
                <Select
                  placeholder="选择项目类别"
                  options={Object.entries(categoryLabels).map(([value, label]) => ({ value, label }))}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="leaderId" label="项目负责人">
                <Select
                  placeholder="选择负责人"
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  options={employees.map((e) => ({ value: e.id, label: e.name }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="startDate" label="开始日期">
                <DatePicker style={{ width: '100%' }} placeholder="选择日期" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="objective" label="项目目标">
            <TextArea rows={2} placeholder="描述项目目标" />
          </Form.Item>

          <Form.Item name="content" label="项目内容">
            <TextArea rows={3} placeholder="描述项目内容" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="clientName" label="客户名称">
                <Input placeholder="输入客户名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="clientContact" label="客户联系方式">
                <Input placeholder="输入联系方式" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="subcontractEntity" label="分包主体">
            <Input placeholder="输入分包主体（如有）" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Project Detail Drawer */}
      <Drawer
        title={
          <Space>
            <ProjectOutlined />
            <span>项目详情</span>
            {selectedProject && (
              <Tag color={categoryColors[selectedProject.projectCategory]}>
                {categoryLabels[selectedProject.projectCategory]}
              </Tag>
            )}
          </Space>
        }
        open={detailDrawerOpen}
        onClose={() => {
          setDetailDrawerOpen(false);
          dispatch(setSelectedProject(null));
        }}
        size="large"
      >
        {selectedProject && (
          <>
            <Descriptions
              bordered
              size="small"
              column={2}
              styles={{ label: { width: 120 } }}
            >
              <Descriptions.Item label="项目编号" span={1}>
                <Text code>{selectedProject.projectNo}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="状态" span={1}>
                <Tag color={statusColors[selectedProject.status]}>
                  {statusLabels[selectedProject.status]}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="项目名称" span={2}>
                {selectedProject.projectName}
              </Descriptions.Item>
              <Descriptions.Item label="负责人" span={1}>
                {selectedProject.leaderName || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="开始日期" span={1}>
                {selectedProject.startDate || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="客户" span={1}>
                {selectedProject.clientName || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="联系方式" span={1}>
                {selectedProject.clientContact || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="项目目标" span={2}>
                {selectedProject.objective || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="项目内容" span={2}>
                {selectedProject.content || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="分包主体" span={2}>
                {selectedProject.subcontractEntity || '-'}
              </Descriptions.Item>
            </Descriptions>

            <Tabs
              style={{ marginTop: 24 }}
              items={[
                {
                  key: 'documents',
                  label: (
                    <Space>
                      <FileOutlined />
                      <span>项目文档</span>
                      <Tag>{documents.length}</Tag>
                    </Space>
                  ),
                  children: (
                    <div>
                      <div style={{ marginBottom: 16 }}>
                        <Upload
                          beforeUpload={(file) => {
                            handleUploadDocument(file);
                            return false;
                          }}
                          showUploadList={false}
                        >
                          <Button icon={<UploadOutlined />}>上传文档</Button>
                        </Upload>
                      </div>
                      {documents.length > 0 ? (
                        <Table
                          columns={documentColumns}
                          dataSource={documents}
                          rowKey="id"
                          pagination={false}
                          size="small"
                        />
                      ) : (
                        <Empty description="暂无文档" />
                      )}
                    </div>
                  ),
                },
                {
                  key: 'costs',
                  label: (
                    <Space>
                      <DollarOutlined />
                      <span>成本记录</span>
                      <Tag color="blue">${totalCost.toFixed(2)}</Tag>
                    </Space>
                  ),
                  children: (
                    <div>
                      <Row gutter={16} style={{ marginBottom: 16 }}>
                        <Col span={6}>
                          <Card size="small">
                            <Statistic
                              title="总成本"
                              value={totalCost}
                              precision={2}
                              prefix="$"
                              styles={{ content: { color: '#1890ff' } }}
                            />
                          </Card>
                        </Col>
                        <Col span={6}>
                          <Card size="small">
                            <Statistic
                              title="人力成本"
                              value={costs.filter(c => c.costType === 'LABOR').reduce((s, c) => s + c.amount, 0)}
                              precision={2}
                              prefix="$"
                            />
                          </Card>
                        </Col>
                        <Col span={6}>
                          <Card size="small">
                            <Statistic
                              title="采购成本"
                              value={costs.filter(c => c.costType === 'PROCUREMENT').reduce((s, c) => s + c.amount, 0)}
                              precision={2}
                              prefix="$"
                            />
                          </Card>
                        </Col>
                        <Col span={6}>
                          <Card size="small">
                            <Statistic
                              title="其他"
                              value={costs.filter(c => c.costType === 'OTHER').reduce((s, c) => s + c.amount, 0)}
                              precision={2}
                              prefix="$"
                            />
                          </Card>
                        </Col>
                      </Row>
                      <div style={{ marginBottom: 16 }}>
                        <Button
                          type="primary"
                          icon={<PlusOutlined />}
                          onClick={() => {
                            costForm.resetFields();
                            setCostModalOpen(true);
                          }}
                        >
                          添加成本
                        </Button>
                      </div>
                      {costs.length > 0 ? (
                        <Table
                          columns={costColumns}
                          dataSource={costs}
                          rowKey="id"
                          pagination={false}
                          size="small"
                        />
                      ) : (
                        <Empty description="暂无成本记录" />
                      )}
                    </div>
                  ),
                },
              ]}
            />
          </>
        )}
      </Drawer>

      {/* Add Cost Modal */}
      <Modal
        title="添加成本"
        open={costModalOpen}
        onOk={handleAddCost}
        onCancel={() => setCostModalOpen(false)}
        okText="添加"
        cancelText="取消"
      >
        <Form form={costForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="costType"
            label="成本类型"
            rules={[{ required: true, message: '请选择成本类型' }]}
          >
            <Select
              placeholder="选择类型"
              options={Object.entries(costTypeLabels).map(([value, label]) => ({ value, label }))}
            />
          </Form.Item>
          <Form.Item
            name="amount"
            label="金额 ($)"
            rules={[{ required: true, message: '请输入金额' }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} placeholder="0.00" />
          </Form.Item>
          <Form.Item
            name="costDate"
            label="日期"
            rules={[{ required: true, message: '请选择日期' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="description" label="说明">
            <TextArea rows={2} placeholder="成本说明（可选）" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProjectsPage;
