import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Modal, Form, Input, Select, Space, Popconfirm, Tag, App } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, TeamOutlined } from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '../../hooks/useStore';
import { fetchPositions, createPosition, updatePosition, deletePosition, fetchDepartments } from '../../store/slices/organizationSlice';
import { Position, PositionForm } from '../../types';
import type { ColumnsType } from 'antd/es/table';

const PositionsPage: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<string | undefined>();
  const [form] = Form.useForm();
  const dispatch = useAppDispatch();
  const { positions, departments, loading } = useAppSelector((state) => state.organization);
  const { message } = App.useApp();

  useEffect(() => {
    dispatch(fetchDepartments());
    dispatch(fetchPositions());
  }, [dispatch]);

  const handleFilter = (departmentId?: string) => {
    setSelectedDepartment(departmentId);
    dispatch(fetchPositions(departmentId));
  };

  const handleAdd = () => {
    setEditingPosition(null);
    form.resetFields();
    setModalOpen(true);
  };

  const handleEdit = (position: Position) => {
    setEditingPosition(position);
    form.setFieldsValue({
      name: position.name,
      departmentId: position.departmentId,
      responsibilities: position.responsibilities,
      sortOrder: position.sortOrder,
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await dispatch(deletePosition(id)).unwrap();
      message.success('岗位删除成功');
      dispatch(fetchPositions(selectedDepartment));
    } catch {
      message.error('删除岗位失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const formData: PositionForm = {
        name: values.name,
        departmentId: values.departmentId,
        responsibilities: values.responsibilities,
        sortOrder: values.sortOrder || 0,
      };

      if (editingPosition) {
        await dispatch(updatePosition({ id: editingPosition.id, data: formData })).unwrap();
        message.success('岗位更新成功');
      } else {
        await dispatch(createPosition(formData)).unwrap();
        message.success('岗位创建成功');
      }

      setModalOpen(false);
      dispatch(fetchPositions(selectedDepartment));
    } catch {
      message.error('操作失败');
    }
  };

  const columns: ColumnsType<Position> = [
    {
      title: '岗位名称',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <span style={{ fontWeight: 500 }}>{text}</span>,
    },
    {
      title: '所属部门',
      dataIndex: 'departmentName',
      key: 'departmentName',
      render: (text) => text ? <Tag color="blue">{text}</Tag> : '-',
    },
    {
      title: '职责描述',
      dataIndex: 'responsibilities',
      key: 'responsibilities',
      ellipsis: true,
      render: (text) => text || '-',
    },
    {
      title: '排序',
      dataIndex: 'sortOrder',
      key: 'sortOrder',
      width: 80,
      align: 'center',
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="text"
            size="small"
            icon={<EditOutlined style={{ color: '#6b7280' }} />}
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="删除岗位"
            description="确定要删除该岗位吗？"
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
        <h1 className="page-title">岗位管理</h1>
        <p className="page-subtitle">管理公司各部门的岗位</p>
      </div>

      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <TeamOutlined style={{ color: '#6b7280' }} />
            <span>岗位列表</span>
          </div>
        }
        extra={
          <Space>
            <Select
              placeholder="按部门筛选"
              allowClear
              style={{ width: 200 }}
              onChange={handleFilter}
              options={departments.map((d) => ({ value: d.id, label: d.name }))}
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              新增岗位
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={positions}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          locale={{ emptyText: '暂无岗位，点击"新增岗位"创建' }}
        />
      </Card>

      <Modal
        title={editingPosition ? '编辑岗位' : '新增岗位'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        okText={editingPosition ? '更新' : '创建'}
        cancelText="取消"
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="name"
            label="岗位名称"
            rules={[{ required: true, message: '请输入岗位名称' }]}
          >
            <Input placeholder="输入岗位名称" />
          </Form.Item>

          <Form.Item
            name="departmentId"
            label="所属部门"
            rules={[{ required: true, message: '请选择所属部门' }]}
          >
            <Select
              placeholder="选择部门"
              options={departments.map((d) => ({ value: d.id, label: d.name }))}
            />
          </Form.Item>

          <Form.Item name="responsibilities" label="职责描述">
            <Input.TextArea rows={3} placeholder="输入职责描述（可选）" />
          </Form.Item>

          <Form.Item name="sortOrder" label="排序">
            <Input type="number" placeholder="0" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PositionsPage;
