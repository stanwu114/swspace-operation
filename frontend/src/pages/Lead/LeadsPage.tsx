import React, { useEffect, useState } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  Tag,
  message,
  Drawer,
  Descriptions,
  Timeline,
  DatePicker,
  Popconfirm,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ClearOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useAppDispatch, useAppSelector } from '../../hooks/useStore';
import {
  fetchLeads,
  createLead,
  updateLead,
  deleteLead,
  updateLeadStatus,
  fetchLeadLogs,
  createLeadLog,
  updateLeadLog,
  deleteLeadLog,
  setSelectedLead,
  clearLogs,
} from '../../store/slices/leadSlice';
import { leadApi } from '../../services/leadApi';
import type { Lead, LeadStatus, LeadTrackingLog } from '../../types';

const { TextArea } = Input;

const statusConfig: Record<LeadStatus, { label: string; color: string }> = {
  NEW: { label: '新建', color: 'default' },
  VALIDATING: { label: '验证中', color: 'processing' },
  PLANNED: { label: '已谋划', color: 'cyan' },
  INITIAL_CONTACT: { label: '初步接洽', color: 'blue' },
  DEEP_FOLLOW: { label: '深度跟进', color: 'geekblue' },
  PROPOSAL_SUBMITTED: { label: '已报方案', color: 'purple' },
  NEGOTIATION: { label: '商务谈判', color: 'orange' },
  WON: { label: '已成交', color: 'success' },
  LOST: { label: '已流失', color: 'error' },
};

// 预定义的标签颜色
const tagColors = ['magenta', 'red', 'volcano', 'orange', 'gold', 'lime', 'green', 'cyan', 'blue', 'geekblue', 'purple'];

const LeadsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { leads, selectedLead, logs, loading } = useAppSelector((state) => state.lead);

  const [filterForm] = Form.useForm();
  const [leadForm] = Form.useForm();
  const [logForm] = Form.useForm();

  const [leadModalOpen, setLeadModalOpen] = useState(false);
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [editingLog, setEditingLog] = useState<LeadTrackingLog | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [existingTags, setExistingTags] = useState<string[]>([]);

  const loadExistingTags = async () => {
    try {
      const data = await leadApi.getAllTags();
      setExistingTags(Array.isArray(data) ? data : []);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    dispatch(fetchLeads());
    loadExistingTags();
  }, [dispatch]);

  const handleSearch = () => {
    const values = filterForm.getFieldsValue();
    dispatch(fetchLeads(values));
  };

  const handleClearFilter = () => {
    filterForm.resetFields();
    dispatch(fetchLeads());
  };

  const handleOpenLeadModal = (lead?: Lead) => {
    if (lead) {
      setEditingLead(lead);
      setTags(lead.tags || []);
      leadForm.setFieldsValue({
        ...lead,
      });
    } else {
      setEditingLead(null);
      setTags([]);
      leadForm.resetFields();
    }
    setLeadModalOpen(true);
  };

  const handleLeadSubmit = async () => {
    try {
      const values = await leadForm.validateFields();
      const formData = {
        leadName: values.leadName,
        sourceChannel: values.sourceChannel,
        customerName: values.customerName,
        estimatedAmount: values.estimatedAmount,
        description: values.description,
        tags: tags,
      };

      if (editingLead) {
        await dispatch(updateLead({ id: editingLead.id, data: formData })).unwrap();
        message.success('线索更新成功');
      } else {
        await dispatch(createLead(formData)).unwrap();
        message.success('线索创建成功');
      }
      setLeadModalOpen(false);
      leadForm.resetFields();
      setTags([]);
      loadExistingTags();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleDeleteLead = async (id: string) => {
    try {
      await dispatch(deleteLead(id)).unwrap();
      message.success('线索删除成功');
    } catch {
      message.error('删除失败');
    }
  };

  const handleStatusChange = async (id: string, status: LeadStatus) => {
    try {
      await dispatch(updateLeadStatus({ id, status })).unwrap();
      message.success('状态更新成功');
    } catch {
      message.error('状态更新失败');
    }
  };

  const handleOpenDetail = (lead: Lead) => {
    dispatch(setSelectedLead(lead));
    dispatch(fetchLeadLogs(lead.id));
    setDetailDrawerOpen(true);
  };

  const handleCloseDetail = () => {
    setDetailDrawerOpen(false);
    dispatch(setSelectedLead(null));
    dispatch(clearLogs());
  };

  const handleOpenLogModal = (log?: LeadTrackingLog) => {
    if (log) {
      setEditingLog(log);
      logForm.setFieldsValue({
        ...log,
        logDate: dayjs(log.logDate),
      });
    } else {
      setEditingLog(null);
      logForm.resetFields();
      logForm.setFieldsValue({ logDate: dayjs() });
    }
    setLogModalOpen(true);
  };

  const handleLogSubmit = async () => {
    if (!selectedLead) return;
    try {
      const values = await logForm.validateFields();
      const formData = {
        logDate: values.logDate.format('YYYY-MM-DD'),
        logTitle: values.logTitle,
        logContent: values.logContent,
      };

      if (editingLog) {
        await dispatch(updateLeadLog({ leadId: selectedLead.id, logId: editingLog.id, data: formData })).unwrap();
        message.success('日志更新成功');
      } else {
        await dispatch(createLeadLog({ leadId: selectedLead.id, data: formData })).unwrap();
        message.success('日志创建成功');
      }
      setLogModalOpen(false);
      logForm.resetFields();
    } catch {
      message.error('操作失败');
    }
  };

  const handleDeleteLog = async (logId: string) => {
    if (!selectedLead) return;
    try {
      await dispatch(deleteLeadLog({ leadId: selectedLead.id, logId })).unwrap();
      message.success('日志删除成功');
    } catch {
      message.error('删除失败');
    }
  };

  // 标签相关处理
  const handleTagClose = (removedTag: string) => {
    setTags(tags.filter(tag => tag !== removedTag));
  };

  const handleTagSelect = (value: string) => {
    if (!tags.includes(value)) {
      setTags([...tags, value]);
    }
  };

  const columns: ColumnsType<Lead> = [
    {
      title: '线索名称',
      dataIndex: 'leadName',
      key: 'leadName',
      width: 200,
      render: (text, record) => (
        <a onClick={() => handleOpenDetail(record)}>{text}</a>
      ),
    },
    {
      title: '来源渠道',
      dataIndex: 'sourceChannel',
      key: 'sourceChannel',
      width: 120,
    },
    {
      title: '客户名称',
      dataIndex: 'customerName',
      key: 'customerName',
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      width: 200,
      render: (tags: string[]) => (
        <>
          {tags?.map((tag, index) => (
            <Tag key={tag} color={tagColors[index % tagColors.length]}>
              {tag}
            </Tag>
          ))}
        </>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: LeadStatus) => (
        <Tag color={statusConfig[status]?.color}>{statusConfig[status]?.label}</Tag>
      ),
    },
    {
      title: '日志数',
      dataIndex: 'logCount',
      key: 'logCount',
      width: 80,
      align: 'center',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 100,
      render: (val) => dayjs(val).format('YYYY-MM-DD'),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleOpenLeadModal(record)}>
            编辑
          </Button>
          <Popconfirm title="确定删除此线索？" onConfirm={() => handleDeleteLead(record.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card title="线索管理" extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenLeadModal()}>
          新增线索
        </Button>
      }>
        {/* Filter Section */}
        <Form form={filterForm} layout="inline" style={{ marginBottom: 16 }}>
          <Form.Item name="status" label="状态">
            <Select placeholder="选择状态" allowClear style={{ width: 140 }}>
              {Object.entries(statusConfig).map(([key, { label }]) => (
                <Select.Option key={key} value={key}>{label}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="tag" label="标签">
            <Select placeholder="选择标签" allowClear style={{ width: 150 }}>
              {existingTags.map((t) => (
                <Select.Option key={t} value={t}>{t}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="customerName" label="客户">
            <Input placeholder="输入客户名称" allowClear style={{ width: 150 }} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>搜索</Button>
              <Button icon={<ClearOutlined />} onClick={handleClearFilter}>清空</Button>
            </Space>
          </Form.Item>
        </Form>

        {/* Table */}
        <Table
          columns={columns}
          dataSource={leads}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 条` }}
        />
      </Card>

      {/* Lead Form Modal */}
      <Modal
        title={editingLead ? '编辑线索' : '新增线索'}
        open={leadModalOpen}
        onOk={handleLeadSubmit}
        onCancel={() => setLeadModalOpen(false)}
        width={600}
      >
        <Form form={leadForm} layout="vertical">
          <Form.Item name="leadName" label="线索名称" rules={[{ required: true, message: '请输入线索名称' }]}>
            <Input placeholder="请输入线索名称" />
          </Form.Item>
          <Form.Item name="sourceChannel" label="来源渠道">
            <Input placeholder="请输入来源渠道" />
          </Form.Item>
          <Form.Item name="customerName" label="客户名称" rules={[{ required: true, message: '请输入客户名称' }]}>
            <Input placeholder="请输入客户名称" />
          </Form.Item>
          <Form.Item label="标签">
            <div>
              <Space wrap style={{ marginBottom: tags.length > 0 ? 8 : 0 }}>
                {tags.map((tag, index) => (
                  <Tag
                    key={tag}
                    closable
                    color={tagColors[index % tagColors.length]}
                    onClose={() => handleTagClose(tag)}
                  >
                    {tag}
                  </Tag>
                ))}
              </Space>
              <Select
                mode="tags"
                placeholder="选择已有标签或输入新标签"
                value={[]}
                onSelect={handleTagSelect}
                style={{ width: '100%' }}
                options={existingTags
                  .filter((t) => !tags.includes(t))
                  .map((t) => ({ value: t, label: t }))}
              />
            </div>
          </Form.Item>
          <Form.Item name="description" label="描述">
            <TextArea rows={3} placeholder="请输入线索描述" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Log Form Modal */}
      <Modal
        title={editingLog ? '编辑日志' : '新增日志'}
        open={logModalOpen}
        onOk={handleLogSubmit}
        onCancel={() => setLogModalOpen(false)}
        width={600}
      >
        <Form form={logForm} layout="vertical">
          <Form.Item name="logDate" label="日期" rules={[{ required: true, message: '请选择日期' }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="logTitle" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
            <Input placeholder="请输入日志标题" />
          </Form.Item>
          <Form.Item name="logContent" label="内容" rules={[{ required: true, message: '请输入内容' }]}>
            <TextArea rows={4} placeholder="请输入日志内容" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Detail Drawer */}
      <Drawer
        title={selectedLead?.leadName || '线索详情'}
        placement="right"
        size="large"
        open={detailDrawerOpen}
        onClose={handleCloseDetail}
        extra={
          <Select
            value={selectedLead?.status}
            style={{ width: 120 }}
            onChange={(val) => selectedLead && handleStatusChange(selectedLead.id, val)}
          >
            {Object.entries(statusConfig).map(([key, { label }]) => (
              <Select.Option key={key} value={key}>{label}</Select.Option>
            ))}
          </Select>
        }
      >
        {selectedLead && (
          <>
            <Descriptions title="基本信息" bordered column={2} size="small" style={{ marginBottom: 24 }}>
              <Descriptions.Item label="线索名称">{selectedLead.leadName}</Descriptions.Item>
              <Descriptions.Item label="来源渠道">{selectedLead.sourceChannel || '-'}</Descriptions.Item>
              <Descriptions.Item label="客户名称">{selectedLead.customerName}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={statusConfig[selectedLead.status]?.color}>
                  {statusConfig[selectedLead.status]?.label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="标签" span={2}>
                {selectedLead.tags?.map((tag, index) => (
                  <Tag key={tag} color={tagColors[index % tagColors.length]}>{tag}</Tag>
                )) || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="描述" span={2}>
                {selectedLead.description || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {dayjs(selectedLead.createdAt).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="更新时间">
                {dayjs(selectedLead.updatedAt).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
            </Descriptions>

            <Card
              title="跟踪日志"
              size="small"
              extra={
                <Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => handleOpenLogModal()}>
                  新增日志
                </Button>
              }
            >
              {logs.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#999', padding: 20 }}>暂无跟踪日志</div>
              ) : (
                <Timeline
                  items={logs.map((log) => ({
                    children: (
                      <div>
                        <div style={{ fontWeight: 'bold', marginBottom: 4 }}>
                          {log.logTitle}
                          <span style={{ fontWeight: 'normal', color: '#999', marginLeft: 8 }}>
                            {dayjs(log.logDate).format('YYYY-MM-DD')}
                          </span>
                          <Space style={{ float: 'right' }}>
                            <Button type="link" size="small" onClick={() => handleOpenLogModal(log)}>编辑</Button>
                            <Popconfirm title="确定删除此日志？" onConfirm={() => handleDeleteLog(log.id)}>
                              <Button type="link" size="small" danger>删除</Button>
                            </Popconfirm>
                          </Space>
                        </div>
                        <div style={{ whiteSpace: 'pre-wrap' }}>{log.logContent}</div>
                        <div style={{ color: '#999', fontSize: 12, marginTop: 4 }}>
                          {log.createdByName || '系统'} · {dayjs(log.createdAt).format('YYYY-MM-DD HH:mm')}
                        </div>
                      </div>
                    ),
                  }))}
                />
              )}
            </Card>
          </>
        )}
      </Drawer>
    </div>
  );
};

export default LeadsPage;
