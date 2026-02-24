import { get, post, put, del } from '../api';

export interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ToolHandler = (args: Record<string, any>) => Promise<unknown>;

const toolMap: Record<string, ToolHandler> = {
  // ========== 岗位管理 ==========
  list_positions: (args) =>
    get('/positions', args.departmentId ? { departmentId: args.departmentId } : undefined),
  create_position: (args) =>
    post('/positions', {
      name: args.name,
      departmentId: args.departmentId,
      responsibilities: args.responsibilities,
      sortOrder: args.sortOrder,
    }),
  update_position: (args) => {
    const { id, ...body } = args;
    return put(`/positions/${id}`, body);
  },
  delete_position: (args) => del(`/positions/${args.id}`),

  // ========== 部门管理 ==========
  list_departments: () => get('/departments'),
  get_department_tree: () => get('/departments/tree'),
  create_department: (args) =>
    post('/departments', {
      name: args.name,
      parentId: args.parentId,
      description: args.description,
      sortOrder: args.sortOrder,
    }),
  update_department: (args) => {
    const { id, ...body } = args;
    return put(`/departments/${id}`, body);
  },
  delete_department: (args) => del(`/departments/${args.id}`),

  // ========== 员工管理 ==========
  list_employees: (args) => {
    const params: Record<string, unknown> = {};
    if (args.employeeType) params.employeeType = args.employeeType;
    if (args.departmentId) params.departmentId = args.departmentId;
    if (args.status) params.status = args.status;
    return get('/employees', Object.keys(params).length > 0 ? params : undefined);
  },
  create_employee: (args) =>
    post('/employees', {
      name: args.name,
      employeeType: args.employeeType,
      phone: args.phone,
      sourceCompany: args.sourceCompany,
      positionId: args.positionId,
      departmentId: args.departmentId,
      dailyCost: args.dailyCost,
    }),
  update_employee: (args) => {
    const { id, ...body } = args;
    return put(`/employees/${id}`, body);
  },
  delete_employee: (args) => del(`/employees/${args.id}`),
  update_employee_status: (args) =>
    put(`/employees/${args.id}/status`, { status: args.status }),

  // ========== 项目管理 ==========
  list_projects: (args) => {
    const params: Record<string, unknown> = {};
    if (args.category) params.category = args.category;
    if (args.status) params.status = args.status;
    if (args.leaderId) params.leaderId = args.leaderId;
    return get('/projects', Object.keys(params).length > 0 ? params : undefined);
  },
  create_project: (args) =>
    post('/projects', {
      projectName: args.projectName,
      projectCategory: args.projectCategory,
      objective: args.objective,
      content: args.content,
      leaderId: args.leaderId,
      startDate: args.startDate,
      clientName: args.clientName,
      clientContact: args.clientContact,
      subcontractEntity: args.subcontractEntity,
    }),
  update_project: (args) => {
    const { id, ...body } = args;
    return put(`/projects/${id}`, body);
  },
  delete_project: (args) => del(`/projects/${args.id}`),
  update_project_status: (args) =>
    put(`/projects/${args.id}/status`, { status: args.status }),

  // ========== 合同管理 ==========
  list_contracts: (args) => {
    const params: Record<string, unknown> = {};
    if (args.type) params.type = args.type;
    if (args.status) params.status = args.status;
    if (args.projectId) params.projectId = args.projectId;
    return get('/contracts', Object.keys(params).length > 0 ? params : undefined);
  },
  create_contract: (args) =>
    post('/contracts', {
      partyA: args.partyA,
      partyB: args.partyB,
      contractType: args.contractType,
      amount: args.amount,
      projectId: args.projectId,
      subcontractEntity: args.subcontractEntity,
      signingDate: args.signingDate,
    }),
  update_contract: (args) => {
    const { id, ...body } = args;
    return put(`/contracts/${id}`, body);
  },
  delete_contract: (args) => del(`/contracts/${args.id}`),

  // ========== 费用管理 ==========
  list_expenses: (args) => {
    const params: Record<string, unknown> = {};
    if (args.category) params.category = args.category;
    if (args.projectId) params.projectId = args.projectId;
    if (args.startDate) params.startDate = args.startDate;
    if (args.endDate) params.endDate = args.endDate;
    return get('/expenses', Object.keys(params).length > 0 ? params : undefined);
  },
  create_expense: (args) => {
    if (args.attachmentPath || args.projectRef) {
      return post('/expenses/from-invoice', {
        expenseDate: args.expenseDate,
        category: args.category,
        amount: args.amount,
        taxRate: args.taxRate || 0,
        projectRef: args.projectRef,
        description: args.description,
        attachmentPath: args.attachmentPath,
      });
    }
    return post('/expenses', {
      expenseDate: args.expenseDate,
      category: args.category,
      amount: args.amount,
      taxRate: args.taxRate || 0,
      projectId: args.projectId,
      description: args.description,
    });
  },
  update_expense: (args) => {
    const { id, ...body } = args;
    return put(`/expenses/${id}`, body);
  },
  delete_expense: (args) => del(`/expenses/${args.id}`),
};

export async function executeTool(
  name: string,
  args: Record<string, unknown>,
): Promise<ToolResult> {
  const handler = toolMap[name];
  if (!handler) {
    return { success: false, error: `未知工具: ${name}` };
  }

  try {
    const data = await handler(args);
    return { success: true, data };
  } catch (err: unknown) {
    let errorMsg = '操作执行失败';
    if (err instanceof Error) {
      errorMsg = err.message;
    }
    // 尝试从 axios 错误中提取后端消息
    if (typeof err === 'object' && err !== null && 'response' in err) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      if (axiosErr.response?.data?.message) {
        errorMsg = axiosErr.response.data.message;
      }
    }
    return { success: false, error: errorMsg };
  }
}
