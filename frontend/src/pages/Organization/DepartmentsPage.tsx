import React, { useEffect, useState } from 'react';
import { Card, Tree, Button, Modal, Form, Input, Select, Space, Popconfirm, App } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ApartmentOutlined } from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '../../hooks/useStore';
import { fetchDepartmentTree, createDepartment, updateDepartment, deleteDepartment } from '../../store/slices/organizationSlice';
import { Department, DepartmentForm } from '../../types';
import type { DataNode } from 'antd/es/tree';

const DepartmentsPage: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [form] = Form.useForm();
  const dispatch = useAppDispatch();
  const { departmentTree, loading } = useAppSelector((state) => state.organization);
  const { message } = App.useApp();

  useEffect(() => {
    dispatch(fetchDepartmentTree());
  }, [dispatch]);

  const convertToTreeData = (departments: Department[]): DataNode[] => {
    return departments.map((dept) => ({
      key: dept.id,
      title: (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingRight: 8 }}>
          <span>{dept.name}</span>
          <Space size="small">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined style={{ color: '#6b7280' }} />}
              onClick={(e) => {
                e.stopPropagation();
                handleEdit(dept);
              }}
            />
            <Popconfirm
              title="删除部门"
              description="确定要删除该部门吗？"
              okText="确定"
              cancelText="取消"
              onConfirm={(e) => {
                e?.stopPropagation();
                handleDelete(dept.id);
              }}
              onCancel={(e) => e?.stopPropagation()}
            >
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={(e) => e.stopPropagation()}
              />
            </Popconfirm>
          </Space>
        </div>
      ),
      children: dept.children ? convertToTreeData(dept.children) : [],
    }));
  };

  const handleAdd = (parentId?: string) => {
    setEditingDepartment(null);
    form.resetFields();
    if (parentId) {
      form.setFieldValue('parentId', parentId);
    }
    setModalOpen(true);
  };

  const handleEdit = (department: Department) => {
    setEditingDepartment(department);
    form.setFieldsValue({
      name: department.name,
      parentId: department.parentId,
      description: department.description,
      sortOrder: department.sortOrder,
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await dispatch(deleteDepartment(id)).unwrap();
      message.success('部门删除成功');
      dispatch(fetchDepartmentTree());
    } catch {
      message.error('删除部门失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const formData: DepartmentForm = {
        name: values.name,
        parentId: values.parentId || null,
        description: values.description,
        sortOrder: values.sortOrder || 0,
      };

      if (editingDepartment) {
        await dispatch(updateDepartment({ id: editingDepartment.id, data: formData })).unwrap();
        message.success('部门更新成功');
      } else {
        await dispatch(createDepartment(formData)).unwrap();
        message.success('部门创建成功');
      }

      setModalOpen(false);
      dispatch(fetchDepartmentTree());
    } catch {
      message.error('操作失败');
    }
  };

  const flattenDepartments = (departments: Department[]): { value: string; label: string }[] => {
    const result: { value: string; label: string }[] = [];
    const flatten = (depts: Department[], prefix = '') => {
      depts.forEach((dept) => {
        result.push({ value: dept.id, label: prefix + dept.name });
        if (dept.children && dept.children.length > 0) {
          flatten(dept.children, prefix + dept.name + ' / ');
        }
      });
    };
    flatten(departments);
    return result;
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">部门管理</h1>
        <p className="page-subtitle">管理公司组织架构</p>
      </div>

      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ApartmentOutlined style={{ color: '#6b7280' }} />
            <span>部门结构</span>
          </div>
        }
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => handleAdd()}>
            新增部门
          </Button>
        }
        loading={loading}
      >
        {departmentTree.length > 0 ? (
          <Tree
            showLine={{ showLeafIcon: false }}
            defaultExpandAll
            treeData={convertToTreeData(departmentTree)}
            style={{ padding: '16px 0' }}
          />
        ) : (
          <div style={{ padding: '60px 0', textAlign: 'center', color: '#9ca3af' }}>
            暂无部门，点击"新增部门"创建第一个部门
          </div>
        )}
      </Card>

      <Modal
        title={editingDepartment ? '编辑部门' : '新增部门'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        okText={editingDepartment ? '更新' : '创建'}
        cancelText="取消"
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="name"
            label="部门名称"
            rules={[{ required: true, message: '请输入部门名称' }]}
          >
            <Input placeholder="输入部门名称" />
          </Form.Item>

          <Form.Item name="parentId" label="上级部门">
            <Select
              placeholder="选择上级部门（可选）"
              allowClear
              options={flattenDepartments(departmentTree).filter(
                (d) => d.value !== editingDepartment?.id
              )}
            />
          </Form.Item>

          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} placeholder="输入描述（可选）" />
          </Form.Item>

          <Form.Item name="sortOrder" label="排序">
            <Input type="number" placeholder="0" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DepartmentsPage;
