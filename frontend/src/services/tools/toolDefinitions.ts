// OpenAI Function Calling tool definitions for all backend API operations

export interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, {
        type: string;
        description: string;
        enum?: string[];
      }>;
      required?: string[];
    };
  };
}

// ========== 岗位管理 ==========

const positionTools: ToolDefinition[] = [
  {
    type: 'function',
    function: {
      name: 'list_positions',
      description: '查询岗位列表。可以按部门ID筛选。返回岗位名称、所属部门、职责等信息。',
      parameters: {
        type: 'object',
        properties: {
          departmentId: { type: 'string', description: '部门ID，可选，用于筛选特定部门下的岗位' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_position',
      description: '创建新岗位。必须指定岗位名称和所属部门ID。如果不知道部门ID，请先调用 list_departments 或 get_department_tree 查询。',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: '岗位名称，例如：软件工程师、产品经理' },
          departmentId: { type: 'string', description: '所属部门的UUID' },
          responsibilities: { type: 'string', description: '岗位职责描述，可选' },
          sortOrder: { type: 'number', description: '排序号，可选，默认为0' },
        },
        required: ['name', 'departmentId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_position',
      description: '更新已有岗位信息。需要岗位ID。可更新名称、部门、职责等。',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: '要更新的岗位ID' },
          name: { type: 'string', description: '新的岗位名称' },
          departmentId: { type: 'string', description: '新的所属部门ID' },
          responsibilities: { type: 'string', description: '新的岗位职责' },
          sortOrder: { type: 'number', description: '新的排序号' },
        },
        required: ['id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'delete_position',
      description: '删除岗位。需要岗位ID。删除操作不可恢复。',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: '要删除的岗位ID' },
        },
        required: ['id'],
      },
    },
  },
];

// ========== 部门管理 ==========

const departmentTools: ToolDefinition[] = [
  {
    type: 'function',
    function: {
      name: 'list_departments',
      description: '查询所有部门的平铺列表。返回每个部门的ID、名称、描述等信息。',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_department_tree',
      description: '获取部门的树形层级结构。可以看到父子部门关系。',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_department',
      description: '创建新部门。必须指定部门名称。可选指定父部门ID来创建子部门。',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: '部门名称，例如：技术部、市场部' },
          parentId: { type: 'string', description: '父部门ID，可选，不填则为顶级部门' },
          description: { type: 'string', description: '部门描述，可选' },
          sortOrder: { type: 'number', description: '排序号，可选' },
        },
        required: ['name'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_department',
      description: '更新部门信息。需要部门ID。',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: '要更新的部门ID' },
          name: { type: 'string', description: '新的部门名称' },
          parentId: { type: 'string', description: '新的父部门ID' },
          description: { type: 'string', description: '新的部门描述' },
          sortOrder: { type: 'number', description: '新的排序号' },
        },
        required: ['id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'delete_department',
      description: '删除部门。需要部门ID。删除操作不可恢复。',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: '要删除的部门ID' },
        },
        required: ['id'],
      },
    },
  },
];

// ========== 员工管理 ==========

const employeeTools: ToolDefinition[] = [
  {
    type: 'function',
    function: {
      name: 'list_employees',
      description: '查询员工列表。可按员工类型(HUMAN/AI)、部门ID、状态(ACTIVE/INACTIVE)筛选。',
      parameters: {
        type: 'object',
        properties: {
          employeeType: { type: 'string', description: '员工类型筛选', enum: ['HUMAN', 'AI'] },
          departmentId: { type: 'string', description: '部门ID筛选' },
          status: { type: 'string', description: '状态筛选', enum: ['ACTIVE', 'INACTIVE'] },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_employee',
      description: '创建新员工。必须指定姓名和员工类型(HUMAN或AI)。可关联岗位和部门。',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: '员工姓名' },
          employeeType: { type: 'string', description: '员工类型：HUMAN(人类) 或 AI(AI员工)', enum: ['HUMAN', 'AI'] },
          phone: { type: 'string', description: '联系电话，可选' },
          sourceCompany: { type: 'string', description: '来源公司，可选' },
          positionId: { type: 'string', description: '关联岗位ID，可选' },
          departmentId: { type: 'string', description: '关联部门ID，可选' },
          dailyCost: { type: 'number', description: '日成本，可选' },
        },
        required: ['name', 'employeeType'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_employee',
      description: '更新员工信息。需要员工ID。',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: '要更新的员工ID' },
          name: { type: 'string', description: '新的员工姓名' },
          employeeType: { type: 'string', description: '员工类型', enum: ['HUMAN', 'AI'] },
          phone: { type: 'string', description: '联系电话' },
          sourceCompany: { type: 'string', description: '来源公司' },
          positionId: { type: 'string', description: '岗位ID' },
          departmentId: { type: 'string', description: '部门ID' },
          dailyCost: { type: 'number', description: '日成本' },
        },
        required: ['id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'delete_employee',
      description: '删除员工。需要员工ID。删除操作不可恢复。',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: '要删除的员工ID' },
        },
        required: ['id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_employee_status',
      description: '更新员工状态（激活或停用）。',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: '员工ID' },
          status: { type: 'string', description: '新状态', enum: ['ACTIVE', 'INACTIVE'] },
        },
        required: ['id', 'status'],
      },
    },
  },
];

// ========== 项目管理 ==========

const projectTools: ToolDefinition[] = [
  {
    type: 'function',
    function: {
      name: 'list_projects',
      description: '查询项目列表。可按项目类别、状态、负责人筛选。',
      parameters: {
        type: 'object',
        properties: {
          category: { type: 'string', description: '项目类别筛选', enum: ['PRE_SALE', 'PLANNING', 'RESEARCH', 'BLUEBIRD', 'DELIVERY', 'STRATEGIC'] },
          status: { type: 'string', description: '项目状态筛选', enum: ['ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED'] },
          leaderId: { type: 'string', description: '负责人ID筛选' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_project',
      description: '创建新项目。必须指定项目名称和类别。',
      parameters: {
        type: 'object',
        properties: {
          projectName: { type: 'string', description: '项目名称' },
          projectCategory: { type: 'string', description: '项目类别', enum: ['PRE_SALE', 'PLANNING', 'RESEARCH', 'BLUEBIRD', 'DELIVERY', 'STRATEGIC'] },
          objective: { type: 'string', description: '项目目标，可选' },
          content: { type: 'string', description: '项目内容描述，可选' },
          leaderId: { type: 'string', description: '负责人（员工）ID，可选' },
          startDate: { type: 'string', description: '开始日期(YYYY-MM-DD格式)，可选' },
          clientName: { type: 'string', description: '客户名称，可选' },
          clientContact: { type: 'string', description: '客户联系方式，可选' },
          subcontractEntity: { type: 'string', description: '分包主体，可选' },
        },
        required: ['projectName', 'projectCategory'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_project',
      description: '更新项目信息。需要项目ID。',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: '要更新的项目ID' },
          projectName: { type: 'string', description: '项目名称' },
          projectCategory: { type: 'string', description: '项目类别', enum: ['PRE_SALE', 'PLANNING', 'RESEARCH', 'BLUEBIRD', 'DELIVERY', 'STRATEGIC'] },
          objective: { type: 'string', description: '项目目标' },
          content: { type: 'string', description: '项目内容' },
          leaderId: { type: 'string', description: '负责人ID' },
          startDate: { type: 'string', description: '开始日期(YYYY-MM-DD)' },
          clientName: { type: 'string', description: '客户名称' },
          clientContact: { type: 'string', description: '客户联系方式' },
          subcontractEntity: { type: 'string', description: '分包主体' },
        },
        required: ['id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'delete_project',
      description: '删除项目。需要项目ID。删除操作不可恢复。',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: '要删除的项目ID' },
        },
        required: ['id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_project_status',
      description: '更新项目状态。',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: '项目ID' },
          status: { type: 'string', description: '新状态', enum: ['ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED'] },
        },
        required: ['id', 'status'],
      },
    },
  },
];

// ========== 合同管理 ==========

const contractTools: ToolDefinition[] = [
  {
    type: 'function',
    function: {
      name: 'list_contracts',
      description: '查询合同列表。可按合同类型、状态、关联项目筛选。',
      parameters: {
        type: 'object',
        properties: {
          type: { type: 'string', description: '合同类型筛选', enum: ['PAYMENT', 'RECEIPT'] },
          status: { type: 'string', description: '合同状态筛选', enum: ['DRAFT', 'SIGNED', 'EXECUTING', 'COMPLETED', 'CANCELLED'] },
          projectId: { type: 'string', description: '关联项目ID筛选' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_contract',
      description: '创建新合同。必须指定甲方、乙方、合同类型和金额。',
      parameters: {
        type: 'object',
        properties: {
          partyA: { type: 'string', description: '甲方名称' },
          partyB: { type: 'string', description: '乙方名称' },
          contractType: { type: 'string', description: '合同类型：PAYMENT(付款)或RECEIPT(收款)', enum: ['PAYMENT', 'RECEIPT'] },
          amount: { type: 'number', description: '合同金额' },
          projectId: { type: 'string', description: '关联项目ID，可选' },
          subcontractEntity: { type: 'string', description: '分包主体，可选' },
          signingDate: { type: 'string', description: '签约日期(YYYY-MM-DD)，可选' },
        },
        required: ['partyA', 'partyB', 'contractType', 'amount'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_contract',
      description: '更新合同信息。需要合同ID。',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: '要更新的合同ID' },
          partyA: { type: 'string', description: '甲方名称' },
          partyB: { type: 'string', description: '乙方名称' },
          contractType: { type: 'string', description: '合同类型', enum: ['PAYMENT', 'RECEIPT'] },
          amount: { type: 'number', description: '合同金额' },
          projectId: { type: 'string', description: '关联项目ID' },
          subcontractEntity: { type: 'string', description: '分包主体' },
          signingDate: { type: 'string', description: '签约日期(YYYY-MM-DD)' },
        },
        required: ['id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'delete_contract',
      description: '删除合同。需要合同ID。删除操作不可恢复。',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: '要删除的合同ID' },
        },
        required: ['id'],
      },
    },
  },
];

// ========== 费用管理 ==========

const expenseTools: ToolDefinition[] = [
  {
    type: 'function',
    function: {
      name: 'list_expenses',
      description: '查询费用记录列表。可按类别、项目、日期范围筛选。',
      parameters: {
        type: 'object',
        properties: {
          category: { type: 'string', description: '费用类别筛选', enum: ['TRAVEL', 'BUSINESS', 'MANAGEMENT', 'OTHER'] },
          projectId: { type: 'string', description: '关联项目ID筛选' },
          startDate: { type: 'string', description: '开始日期(YYYY-MM-DD格式)' },
          endDate: { type: 'string', description: '结束日期(YYYY-MM-DD格式)' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_expense',
      description: '创建费用记录。用于记录差旅费用、商务费用、管理费用等。必须指定费用日期、类别和金额。可选关联项目和附加发票文件（通过attachmentPath参数传递文件路径）。',
      parameters: {
        type: 'object',
        properties: {
          expenseDate: { type: 'string', description: '费用发生日期，格式 YYYY-MM-DD' },
          category: { type: 'string', description: '费用类别：TRAVEL(差旅费用)、BUSINESS(商务费用)、MANAGEMENT(管理费用)、OTHER(其他费用)', enum: ['TRAVEL', 'BUSINESS', 'MANAGEMENT', 'OTHER'] },
          amount: { type: 'number', description: '费用金额' },
          taxRate: { type: 'number', description: '税率，如0.06表示6%，默认为0' },
          projectRef: { type: 'string', description: '关联项目名称或编号，可选' },
          description: { type: 'string', description: '费用描述，可选' },
          attachmentPath: { type: 'string', description: '发票附件的文件路径(如 telegram/xxx.pdf 或 temp/xxx.png)，可选' },
        },
        required: ['expenseDate', 'category', 'amount'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_expense',
      description: '更新费用记录。需要费用ID。',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: '要更新的费用ID' },
          expenseDate: { type: 'string', description: '费用发生日期' },
          category: { type: 'string', description: '费用类别', enum: ['TRAVEL', 'BUSINESS', 'MANAGEMENT', 'OTHER'] },
          amount: { type: 'number', description: '费用金额' },
          taxRate: { type: 'number', description: '税率' },
          projectId: { type: 'string', description: '关联项目ID' },
          description: { type: 'string', description: '费用描述' },
        },
        required: ['id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'delete_expense',
      description: '删除费用记录。需要费用ID。删除操作不可恢复。',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: '要删除的费用ID' },
        },
        required: ['id'],
      },
    },
  },
];

// ========== 导出 ==========

export function getAllTools(): ToolDefinition[] {
  return [
    ...positionTools,
    ...departmentTools,
    ...employeeTools,
    ...projectTools,
    ...contractTools,
    ...expenseTools,
  ];
}
