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
  Row,
  Col,
  Typography,
  Tooltip,
  Empty,
  InputNumber,
  DatePicker,
  Progress,
  Statistic,
  Steps,
  App,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  FileTextOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  BankOutlined,
} from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '../../hooks/useStore';
import {
  fetchContracts,
  createContract,
  updateContract,
  deleteContract,
  fetchContractById,
  fetchPaymentNodes,
  addPaymentNode,
  setSelectedContract,
} from '../../store/slices/contractSlice';
import { fetchProjects } from '../../store/slices/projectSlice';
import {
  Contract,
  ContractForm,
  ContractType,
  ContractStatus,
  PaymentNode,
  PaymentNodeStatus,
} from '../../types';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { Text } = Typography;

const contractTypeLabels: Record<ContractType, string> = {
  PAYMENT: '付款合同',
  RECEIPT: '收款合同',
};

const contractTypeColors: Record<ContractType, string> = {
  PAYMENT: 'red',
  RECEIPT: 'green',
};

const contractStatusLabels: Record<ContractStatus, string> = {
  DRAFT: '草稿',
  SIGNED: '已签署',
  EXECUTING: '执行中',
  COMPLETED: '已完成',
  CANCELLED: '已取消',
};

const contractStatusColors: Record<ContractStatus, string> = {
  DRAFT: 'default',
  SIGNED: 'processing',
  EXECUTING: 'warning',
  COMPLETED: 'success',
  CANCELLED: 'default',
};

const paymentNodeStatusLabels: Record<PaymentNodeStatus, string> = {
  PENDING: '待支付',
  COMPLETED: '已完成',
  OVERDUE: '已逾期',
};

const ContractsPage: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [paymentNodeModalOpen, setPaymentNodeModalOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [filterType, setFilterType] = useState<ContractType | undefined>();
  const [filterStatus, setFilterStatus] = useState<ContractStatus | undefined>();
  const [form] = Form.useForm();
  const [nodeForm] = Form.useForm();
  const dispatch = useAppDispatch();
  const { message } = App.useApp();

  const { contracts, selectedContract, paymentNodes, loading } = useAppSelector(
    (state) => state.contract
  );
  const { projects } = useAppSelector((state) => state.project);

  useEffect(() => {
    dispatch(fetchContracts());
    dispatch(fetchProjects());
  }, [dispatch]);

  const handleFilter = () => {
    const params: { contractType?: string; status?: string } = {};
    if (filterType) params.contractType = filterType;
    if (filterStatus) params.status = filterStatus;
    dispatch(fetchContracts(Object.keys(params).length > 0 ? params : undefined));
  };

  useEffect(() => {
    handleFilter();
  }, [filterType, filterStatus]);

  const handleAdd = () => {
    setEditingContract(null);
    form.resetFields();
    setModalOpen(true);
  };

  const handleEdit = (contract: Contract) => {
    setEditingContract(contract);
    form.setFieldsValue({
      partyA: contract.partyA,
      partyB: contract.partyB,
      contractType: contract.contractType,
      amount: contract.amount,
      projectId: contract.projectId,
      subcontractEntity: contract.subcontractEntity,
      signingDate: contract.signingDate ? dayjs(contract.signingDate) : null,
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await dispatch(deleteContract(id)).unwrap();
      message.success('合同删除成功');
    } catch {
      message.error('删除合同失败');
    }
  };

  const handleViewDetail = async (contract: Contract) => {
    dispatch(setSelectedContract(contract));
    await Promise.all([
      dispatch(fetchContractById(contract.id)),
      dispatch(fetchPaymentNodes(contract.id)),
    ]);
    setDetailDrawerOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const formData: ContractForm = {
        partyA: values.partyA,
        partyB: values.partyB,
        contractType: values.contractType,
        amount: values.amount,
        projectId: values.projectId,
        subcontractEntity: values.subcontractEntity,
        signingDate: values.signingDate ? values.signingDate.format('YYYY-MM-DD') : undefined,
      };

      if (editingContract) {
        await dispatch(updateContract({ id: editingContract.id, data: formData })).unwrap();
        message.success('合同更新成功');
      } else {
        await dispatch(createContract(formData)).unwrap();
        message.success('合同创建成功');
      }

      setModalOpen(false);
      handleFilter();
    } catch {
      message.error('操作失败');
    }
  };

  const handleAddPaymentNode = () => {
    nodeForm.resetFields();
    setPaymentNodeModalOpen(true);
  };

  const handleSubmitPaymentNode = async () => {
    if (!selectedContract) return;
    try {
      const values = await nodeForm.validateFields();
      await dispatch(addPaymentNode({
        contractId: selectedContract.id,
        data: {
          nodeName: values.nodeName,
          nodeOrder: values.nodeOrder,
          plannedAmount: values.plannedAmount,
          plannedDate: values.plannedDate.format('YYYY-MM-DD'),
          remarks: values.remarks,
        },
      })).unwrap();
      message.success('付款节点添加成功');
      setPaymentNodeModalOpen(false);
      await dispatch(fetchPaymentNodes(selectedContract.id));
    } catch {
      message.error('添加付款节点失败');
    }
  };

  const getPaymentProgress = (contract: Contract) => {
    if (!contract.totalNodes || contract.totalNodes === 0) return 0;
    return Math.round((contract.completedNodes || 0) / contract.totalNodes * 100);
  };

  const columns: ColumnsType<Contract> = [
    {
      title: '合同编号',
      dataIndex: 'contractNo',
      key: 'contractNo',
      width: 140,
      render: (text) => <Text code>{text}</Text>,
    },
    {
      title: '类型',
      dataIndex: 'contractType',
      key: 'contractType',
      width: 100,
      render: (type: ContractType) => (
        <Tag color={contractTypeColors[type]}>{contractTypeLabels[type]}</Tag>
      ),
    },
    {
      title: '甲方',
      dataIndex: 'partyA',
      key: 'partyA',
      width: 150,
      ellipsis: true,
    },
    {
      title: '乙方',
      dataIndex: 'partyB',
      key: 'partyB',
      width: 150,
      ellipsis: true,
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      render: (amount) => <Text strong style={{ color: '#1890ff' }}>${amount?.toLocaleString()}</Text>,
    },
    {
      title: '关联项目',
      dataIndex: 'projectName',
      key: 'projectName',
      width: 150,
      render: (text) => text || '-',
    },
    {
      title: '付款进度',
      key: 'progress',
      width: 150,
      render: (_, record) => (
        <Progress 
          percent={getPaymentProgress(record)} 
          size="small" 
          format={() => `${record.completedNodes || 0}/${record.totalNodes || 0}`}
        />
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: ContractStatus) => (
        <Tag color={contractStatusColors[status]}>{contractStatusLabels[status]}</Tag>
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
            title="删除合同"
            description="确定要删除这个合同吗？"
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

  const paymentNodeColumns: ColumnsType<PaymentNode> = [
    {
      title: '节点名称',
      dataIndex: 'nodeName',
      key: 'nodeName',
    },
    {
      title: '计划金额',
      dataIndex: 'plannedAmount',
      key: 'plannedAmount',
      width: 120,
      render: (amount) => `$${amount?.toLocaleString()}`,
    },
    {
      title: '计划日期',
      dataIndex: 'plannedDate',
      key: 'plannedDate',
      width: 120,
    },
    {
      title: '实际金额',
      dataIndex: 'actualAmount',
      key: 'actualAmount',
      width: 120,
      render: (amount) => amount ? `$${amount?.toLocaleString()}` : '-',
    },
    {
      title: '实际日期',
      dataIndex: 'actualDate',
      key: 'actualDate',
      width: 120,
      render: (date) => date || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: PaymentNodeStatus) => (
        <Tag color={status === 'COMPLETED' ? 'success' : status === 'OVERDUE' ? 'error' : 'default'}>
          {paymentNodeStatusLabels[status]}
        </Tag>
      ),
    },
  ];

  const totalPlanned = paymentNodes.reduce((sum, n) => sum + (n.plannedAmount || 0), 0);
  const totalActual = paymentNodes.reduce((sum, n) => sum + (n.actualAmount || 0), 0);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">合同管理</h1>
        <p className="page-subtitle">管理公司所有收付款合同及付款节点</p>
      </div>

      <Card
        title={
          <Space>
            <FileTextOutlined style={{ color: '#6b7280' }} />
            <span>合同列表</span>
          </Space>
        }
        extra={
          <Space>
            <Select
              placeholder="合同类型"
              allowClear
              style={{ width: 120 }}
              value={filterType}
              onChange={setFilterType}
              options={Object.entries(contractTypeLabels).map(([value, label]) => ({ value, label }))}
            />
            <Select
              placeholder="合同状态"
              allowClear
              style={{ width: 120 }}
              value={filterStatus}
              onChange={setFilterStatus}
              options={Object.entries(contractStatusLabels).map(([value, label]) => ({ value, label }))}
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              新建合同
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={contracts}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1200 }}
          locale={{ emptyText: '暂无合同，点击"新建合同"创建第一个合同' }}
        />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        title={editingContract ? '编辑合同' : '新建合同'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        okText={editingContract ? '更新' : '创建'}
        cancelText="取消"
        width={700}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="contractType"
                label="合同类型"
                rules={[{ required: true, message: '请选择合同类型' }]}
              >
                <Select
                  placeholder="选择合同类型"
                  options={Object.entries(contractTypeLabels).map(([value, label]) => ({ value, label }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="amount"
                label="合同金额 ($)"
                rules={[{ required: true, message: '请输入合同金额' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} placeholder="0" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="partyA"
                label="甲方"
                rules={[{ required: true, message: '请输入甲方名称' }]}
              >
                <Input placeholder="输入甲方名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="partyB"
                label="乙方"
                rules={[{ required: true, message: '请输入乙方名称' }]}
              >
                <Input placeholder="输入乙方名称" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="projectId" label="关联项目">
                <Select
                  placeholder="选择关联项目"
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  options={projects.map((p) => ({ value: p.id, label: p.projectName }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="signingDate" label="签署日期">
                <DatePicker style={{ width: '100%' }} placeholder="选择签署日期" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="subcontractEntity" label="分包主体">
            <Input placeholder="输入分包主体（如有）" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Contract Detail Drawer */}
      <Drawer
        title={
          <Space>
            <FileTextOutlined />
            <span>合同详情</span>
            {selectedContract && (
              <Tag color={contractTypeColors[selectedContract.contractType]}>
                {contractTypeLabels[selectedContract.contractType]}
              </Tag>
            )}
          </Space>
        }
        open={detailDrawerOpen}
        onClose={() => {
          setDetailDrawerOpen(false);
          dispatch(setSelectedContract(null));
        }}
        size="large"
      >
        {selectedContract && (
          <>
            <Descriptions
              bordered
              size="small"
              column={2}
              styles={{ label: { width: 100 } }}
            >
              <Descriptions.Item label="合同编号" span={1}>
                <Text code>{selectedContract.contractNo}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="状态" span={1}>
                <Tag color={contractStatusColors[selectedContract.status]}>
                  {contractStatusLabels[selectedContract.status]}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="甲方">{selectedContract.partyA}</Descriptions.Item>
              <Descriptions.Item label="乙方">{selectedContract.partyB}</Descriptions.Item>
              <Descriptions.Item label="金额" span={2}>
                <Text strong style={{ color: '#1890ff', fontSize: 16 }}>
                  ${selectedContract.amount?.toLocaleString()}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="关联项目" span={2}>
                {selectedContract.projectName || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="签署日期">
                {selectedContract.signingDate || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="分包主体">
                {selectedContract.subcontractEntity || '-'}
              </Descriptions.Item>
            </Descriptions>

            <Tabs
              style={{ marginTop: 24 }}
              items={[
                {
                  key: 'payment-nodes',
                  label: (
                    <Space>
                      <DollarOutlined />
                      <span>付款节点</span>
                      <Tag>{paymentNodes.length}</Tag>
                    </Space>
                  ),
                  children: (
                    <div>
                      <Row gutter={16} style={{ marginBottom: 16 }}>
                        <Col span={8}>
                          <Card size="small">
                            <Statistic
                              title="计划总额"
                              value={totalPlanned}
                              precision={2}
                              prefix="$"
                            />
                          </Card>
                        </Col>
                        <Col span={8}>
                          <Card size="small">
                            <Statistic
                              title="已支付"
                              value={totalActual}
                              precision={2}
                              prefix="$"
                              styles={{ content: { color: '#52c41a' } }}
                            />
                          </Card>
                        </Col>
                        <Col span={8}>
                          <Card size="small">
                            <Statistic
                              title="待支付"
                              value={totalPlanned - totalActual}
                              precision={2}
                              prefix="$"
                              styles={{ content: { color: '#faad14' } }}
                            />
                          </Card>
                        </Col>
                      </Row>

                      <div style={{ marginBottom: 16 }}>
                        <Button
                          type="primary"
                          icon={<PlusOutlined />}
                          onClick={handleAddPaymentNode}
                        >
                          添加付款节点
                        </Button>
                      </div>

                      {paymentNodes.length > 0 ? (
                        <>
                          <Steps
                            direction="horizontal"
                            size="small"
                            current={paymentNodes.filter(n => n.status === 'COMPLETED').length}
                            style={{ marginBottom: 16 }}
                            items={paymentNodes.map(node => ({
                              title: node.nodeName,
                              description: `$${node.plannedAmount?.toLocaleString()}`,
                              icon: node.status === 'COMPLETED' ? 
                                <CheckCircleOutlined style={{ color: '#52c41a' }} /> : 
                                <ClockCircleOutlined />,
                            }))}
                          />
                          <Table
                            columns={paymentNodeColumns}
                            dataSource={paymentNodes}
                            rowKey="id"
                            pagination={false}
                            size="small"
                          />
                        </>
                      ) : (
                        <Empty description="暂无付款节点" />
                      )}
                    </div>
                  ),
                },
                {
                  key: 'bid-info',
                  label: (
                    <Space>
                      <BankOutlined />
                      <span>招标信息</span>
                    </Space>
                  ),
                  children: (
                    <Empty description="招标信息功能开发中" />
                  ),
                },
              ]}
            />
          </>
        )}
      </Drawer>

      {/* Add Payment Node Modal */}
      <Modal
        title="添加付款节点"
        open={paymentNodeModalOpen}
        onOk={handleSubmitPaymentNode}
        onCancel={() => setPaymentNodeModalOpen(false)}
        okText="添加"
        cancelText="取消"
      >
        <Form form={nodeForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="nodeName"
            label="节点名称"
            rules={[{ required: true, message: '请输入节点名称' }]}
          >
            <Input placeholder="如：首付款、里程碑1、尾款等" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="plannedAmount"
                label="计划金额 ($)"
                rules={[{ required: true, message: '请输入计划金额' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} placeholder="0" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="plannedDate"
                label="计划日期"
                rules={[{ required: true, message: '请选择计划日期' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="nodeOrder" label="排序">
            <InputNumber min={0} style={{ width: '100%' }} placeholder="0" />
          </Form.Item>
          <Form.Item name="remarks" label="备注">
            <Input.TextArea rows={2} placeholder="备注信息（可选）" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ContractsPage;
