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
  Row,
  Col,
  DatePicker,
  InputNumber,
  Upload,
  App,
  Checkbox,
  Statistic,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  DownloadOutlined,
  PaperClipOutlined,
  UploadOutlined,
  FilterOutlined,
  ClearOutlined,
} from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '../../hooks/useStore';
import {
  fetchExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  fetchExpenseAttachments,
  uploadExpenseAttachment,
  deleteExpenseAttachment,
  exportExpenses,
  toggleSelectExpense,
  selectAllExpenses,
  clearSelectedExpenses,
  setSelectedExpense,
} from '../../store/slices/expenseSlice';
import { fetchProjects } from '../../store/slices/projectSlice';
import { Expense, ExpenseForm, ExpenseCategory } from '../../types';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const expenseCategoryLabels: Record<ExpenseCategory, string> = {
  TRAVEL: '差旅费用',
  BUSINESS: '商务费用',
  MANAGEMENT: '管理费用',
  OTHER: '其他费用',
};

const expenseCategoryColors: Record<ExpenseCategory, string> = {
  TRAVEL: 'blue',
  BUSINESS: 'purple',
  MANAGEMENT: 'orange',
  OTHER: 'default',
};

const ExpensesPage: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [filterCategory, setFilterCategory] = useState<ExpenseCategory | undefined>();
  const [filterProjectId, setFilterProjectId] = useState<string | undefined>();
  const [filterStartDate, setFilterStartDate] = useState<string | undefined>();
  const [filterEndDate, setFilterEndDate] = useState<string | undefined>();
  const [form] = Form.useForm();
  const dispatch = useAppDispatch();
  const { message } = App.useApp();

  const { expenses, selectedExpense, attachments, selectedIds, loading } = useAppSelector(
    (state) => state.expense
  );
  const { projects } = useAppSelector((state) => state.project);

  useEffect(() => {
    dispatch(fetchExpenses());
    dispatch(fetchProjects());
  }, [dispatch]);

  const handleFilter = () => {
    const params: {
      category?: ExpenseCategory;
      projectId?: string;
      startDate?: string;
      endDate?: string;
    } = {};
    if (filterCategory) params.category = filterCategory;
    if (filterProjectId) params.projectId = filterProjectId;
    if (filterStartDate) params.startDate = filterStartDate;
    if (filterEndDate) params.endDate = filterEndDate;
    dispatch(fetchExpenses(Object.keys(params).length > 0 ? params : undefined));
  };

  const handleClearFilter = () => {
    setFilterCategory(undefined);
    setFilterProjectId(undefined);
    setFilterStartDate(undefined);
    setFilterEndDate(undefined);
    dispatch(fetchExpenses());
  };

  const handleAdd = () => {
    setEditingExpense(null);
    form.resetFields();
    form.setFieldsValue({ taxRate: 0 });
    setModalOpen(true);
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    form.setFieldsValue({
      expenseDate: dayjs(expense.expenseDate),
      category: expense.category,
      amount: expense.amount,
      taxRate: expense.taxRate * 100, // 转换为百分比显示
      projectId: expense.projectId,
      description: expense.description,
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await dispatch(deleteExpense(id)).unwrap();
      message.success('删除成功');
    } catch {
      message.error('删除失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const data: ExpenseForm = {
        expenseDate: values.expenseDate.format('YYYY-MM-DD'),
        category: values.category,
        amount: values.amount,
        taxRate: values.taxRate / 100, // 转换回小数
        projectId: values.projectId,
        description: values.description,
      };

      if (editingExpense) {
        await dispatch(updateExpense({ id: editingExpense.id, data })).unwrap();
        message.success('更新成功');
      } else {
        await dispatch(createExpense(data)).unwrap();
        message.success('创建成功');
      }
      setModalOpen(false);
      form.resetFields();
    } catch {
      message.error(editingExpense ? '更新失败' : '创建失败');
    }
  };

  const handleViewDetail = async (expense: Expense) => {
    dispatch(setSelectedExpense(expense));
    dispatch(fetchExpenseAttachments(expense.id));
    setDetailDrawerOpen(true);
  };

  const handleUploadAttachment = async (file: File) => {
    if (!selectedExpense) return false;
    try {
      await dispatch(uploadExpenseAttachment({ expenseId: selectedExpense.id, file })).unwrap();
      message.success('附件上传成功');
    } catch {
      message.error('附件上传失败');
    }
    return false;
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!selectedExpense) return;
    try {
      await dispatch(
        deleteExpenseAttachment({ expenseId: selectedExpense.id, attachmentId })
      ).unwrap();
      message.success('附件删除成功');
    } catch {
      message.error('附件删除失败');
    }
  };

  const handleExport = async () => {
    try {
      await dispatch(exportExpenses(selectedIds.length > 0 ? selectedIds : undefined)).unwrap();
      message.success('导出成功');
    } catch {
      message.error('导出失败');
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.length === expenses.length) {
      dispatch(clearSelectedExpenses());
    } else {
      dispatch(selectAllExpenses());
    }
  };

  // 计算统计数据
  const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalWithTax = expenses.reduce((sum, e) => sum + e.amountWithTax, 0);

  const columns: ColumnsType<Expense> = [
    {
      title: (
        <Checkbox
          checked={selectedIds.length === expenses.length && expenses.length > 0}
          indeterminate={selectedIds.length > 0 && selectedIds.length < expenses.length}
          onChange={handleSelectAll}
        />
      ),
      key: 'select',
      width: 50,
      render: (_, record) => (
        <Checkbox
          checked={selectedIds.includes(record.id)}
          onChange={() => dispatch(toggleSelectExpense(record.id))}
        />
      ),
    },
    {
      title: '费用日期',
      dataIndex: 'expenseDate',
      key: 'expenseDate',
      width: 120,
      sorter: (a, b) => new Date(a.expenseDate).getTime() - new Date(b.expenseDate).getTime(),
    },
    {
      title: '费用类别',
      dataIndex: 'category',
      key: 'category',
      width: 120,
      render: (category: ExpenseCategory) => (
        <Tag color={expenseCategoryColors[category]}>{expenseCategoryLabels[category]}</Tag>
      ),
    },
    {
      title: '费用金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      align: 'right',
      render: (amount: number) => `¥${amount.toFixed(2)}`,
      sorter: (a, b) => a.amount - b.amount,
    },
    {
      title: '税率',
      dataIndex: 'taxRate',
      key: 'taxRate',
      width: 80,
      align: 'right',
      render: (rate: number) => `${(rate * 100).toFixed(0)}%`,
    },
    {
      title: '含税金额',
      dataIndex: 'amountWithTax',
      key: 'amountWithTax',
      width: 120,
      align: 'right',
      render: (amount: number) => `¥${amount.toFixed(2)}`,
    },
    {
      title: '关联项目',
      dataIndex: 'projectName',
      key: 'projectName',
      width: 150,
      ellipsis: true,
      render: (name: string | null) => name || '-',
    },
    {
      title: '附件',
      dataIndex: 'attachmentCount',
      key: 'attachmentCount',
      width: 80,
      align: 'center',
      render: (count: number) =>
        count > 0 ? (
          <Tag icon={<PaperClipOutlined />} color="blue">
            {count}
          </Tag>
        ) : (
          '-'
        ),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => handleViewDetail(record)}>
            详情
          </Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这条费用记录吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        title="费用管理"
        extra={
          <Space>
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={handleExport}
              disabled={expenses.length === 0}
            >
              导出Excel {selectedIds.length > 0 && `(${selectedIds.length})`}
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              新增费用
            </Button>
          </Space>
        }
      >
        {/* 筛选栏 */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={4}>
            <Select
              placeholder="费用类别"
              allowClear
              style={{ width: '100%' }}
              value={filterCategory}
              onChange={setFilterCategory}
              options={Object.entries(expenseCategoryLabels).map(([value, label]) => ({
                value,
                label,
              }))}
            />
          </Col>
          <Col span={5}>
            <Select
              placeholder="关联项目"
              allowClear
              showSearch
              optionFilterProp="label"
              style={{ width: '100%' }}
              value={filterProjectId}
              onChange={setFilterProjectId}
              options={projects.map((p) => ({ value: p.id, label: p.projectName }))}
            />
          </Col>
          <Col span={4}>
            <DatePicker
              placeholder="开始日期"
              style={{ width: '100%' }}
              value={filterStartDate ? dayjs(filterStartDate) : null}
              onChange={(date) => setFilterStartDate(date?.format('YYYY-MM-DD'))}
            />
          </Col>
          <Col span={4}>
            <DatePicker
              placeholder="结束日期"
              style={{ width: '100%' }}
              value={filterEndDate ? dayjs(filterEndDate) : null}
              onChange={(date) => setFilterEndDate(date?.format('YYYY-MM-DD'))}
            />
          </Col>
          <Col span={4}>
            <Space>
              <Button type="primary" icon={<FilterOutlined />} onClick={handleFilter}>
                筛选
              </Button>
              <Button icon={<ClearOutlined />} onClick={handleClearFilter}>
                清空
              </Button>
            </Space>
          </Col>
        </Row>

        {/* 统计信息 */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Card size="small">
              <Statistic title="费用总数" value={expenses.length} suffix="笔" />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="费用总额（不含税）"
                value={totalAmount}
                precision={2}
                prefix="¥"
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="费用总额（含税）"
                value={totalWithTax}
                precision={2}
                prefix="¥"
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="已选中"
                value={selectedIds.length}
                suffix={`/ ${expenses.length}`}
              />
            </Card>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={expenses}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (total) => `共 ${total} 条` }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* 新增/编辑费用弹窗 */}
      <Modal
        title={editingExpense ? '编辑费用' : '新增费用'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="expenseDate"
                label="费用日期"
                rules={[{ required: true, message: '请选择费用日期' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="category"
                label="费用类别"
                rules={[{ required: true, message: '请选择费用类别' }]}
              >
                <Select
                  options={Object.entries(expenseCategoryLabels).map(([value, label]) => ({
                    value,
                    label,
                  }))}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="amount"
                label="费用金额"
                rules={[{ required: true, message: '请输入费用金额' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  precision={2}
                  prefix="¥"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="taxRate"
                label="税率 (%)"
                rules={[{ required: true, message: '请输入税率' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  max={100}
                  precision={0}
                  suffix="%"
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="projectId" label="关联项目">
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              placeholder="选择关联项目（可选）"
              options={projects.map((p) => ({ value: p.id, label: p.projectName }))}
            />
          </Form.Item>
          <Form.Item name="description" label="费用描述">
            <Input.TextArea rows={3} placeholder="输入费用描述（可选）" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 费用详情抽屉 */}
      <Drawer
        title="费用详情"
        open={detailDrawerOpen}
        onClose={() => setDetailDrawerOpen(false)}
        size="large"
      >
        {selectedExpense && (
          <>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="费用日期">{selectedExpense.expenseDate}</Descriptions.Item>
              <Descriptions.Item label="费用类别">
                <Tag color={expenseCategoryColors[selectedExpense.category]}>
                  {expenseCategoryLabels[selectedExpense.category]}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="费用金额">
                ¥{selectedExpense.amount.toFixed(2)}
              </Descriptions.Item>
              <Descriptions.Item label="税率">
                {(selectedExpense.taxRate * 100).toFixed(0)}%
              </Descriptions.Item>
              <Descriptions.Item label="税额">
                ¥{selectedExpense.taxAmount.toFixed(2)}
              </Descriptions.Item>
              <Descriptions.Item label="含税金额">
                ¥{selectedExpense.amountWithTax.toFixed(2)}
              </Descriptions.Item>
              <Descriptions.Item label="关联项目">
                {selectedExpense.projectName || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="描述">
                {selectedExpense.description || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">{selectedExpense.createdAt}</Descriptions.Item>
            </Descriptions>

            <div style={{ marginTop: 24 }}>
              <h4>
                发票附件 <Tag>{attachments.length}</Tag>
              </h4>
              <Upload
                beforeUpload={handleUploadAttachment}
                showUploadList={false}
                accept="image/*,.pdf"
              >
                <Button icon={<UploadOutlined />} style={{ marginBottom: 16 }}>
                  上传附件
                </Button>
              </Upload>
              {attachments.length > 0 ? (
                <div>
                  {attachments.map((att) => (
                    <div
                      key={att.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 0',
                        borderBottom: '1px solid #f0f0f0',
                      }}
                    >
                      <Space>
                        <PaperClipOutlined />
                        <a
                          href={`/api/expenses/${selectedExpense.id}/attachments/${att.id}/download`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: '#1677ff' }}
                        >
                          {att.fileName}
                        </a>
                        <span style={{ color: '#999' }}>
                          ({att.fileSize ? (att.fileSize / 1024).toFixed(1) + ' KB' : '-'})
                        </span>
                      </Space>
                      <Popconfirm
                        title="确定要删除这个附件吗？"
                        onConfirm={() => handleDeleteAttachment(att.id)}
                        okText="确定"
                        cancelText="取消"
                      >
                        <Button type="link" danger size="small" icon={<DeleteOutlined />} />
                      </Popconfirm>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ color: '#999', textAlign: 'center', padding: 20 }}>暂无附件</div>
              )}
            </div>
          </>
        )}
      </Drawer>
    </div>
  );
};

export default ExpensesPage;
