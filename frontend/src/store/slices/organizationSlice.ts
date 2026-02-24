import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Department, Position, Employee, DepartmentForm, PositionForm, EmployeeForm, AIEmployeeConfigForm, ChartNode } from '../../types';
import { departmentApi, positionApi, employeeApi } from '../../services/organizationApi';

interface OrganizationState {
  departments: Department[];
  departmentTree: Department[];
  positions: Position[];
  employees: Employee[];
  chartData: ChartNode | null;
  selectedDepartment: Department | null;
  selectedEmployee: Employee | null;
  loading: boolean;
  chartLoading: boolean;
  error: string | null;
}

const initialState: OrganizationState = {
  departments: [],
  departmentTree: [],
  positions: [],
  employees: [],
  chartData: null,
  selectedDepartment: null,
  selectedEmployee: null,
  loading: false,
  chartLoading: false,
  error: null,
};

// Async thunks
export const fetchDepartmentTree = createAsyncThunk(
  'organization/fetchDepartmentTree',
  async () => await departmentApi.getTree()
);

export const fetchDepartments = createAsyncThunk(
  'organization/fetchDepartments',
  async () => await departmentApi.getList()
);

// 聚合组织架构图数据的辅助函数
const aggregateToChartData = (
  departmentTree: Department[],
  positions: Position[],
  employees: Employee[]
): ChartNode => {
  // 按部门ID分组岗位
  const positionsByDept: Record<string, Position[]> = {};
  positions.forEach((pos) => {
    if (!positionsByDept[pos.departmentId]) {
      positionsByDept[pos.departmentId] = [];
    }
    positionsByDept[pos.departmentId].push(pos);
  });

  // 按岗位ID分组员工
  const employeesByPos: Record<string, Employee[]> = {};
  employees.forEach((emp) => {
    if (emp.positionId) {
      if (!employeesByPos[emp.positionId]) {
        employeesByPos[emp.positionId] = [];
      }
      employeesByPos[emp.positionId].push(emp);
    }
  });

  // 递归构建部门节点
  const buildDepartmentNode = (dept: Department): ChartNode => {
    const deptPositions = positionsByDept[dept.id] || [];
    const positionNodes: ChartNode[] = deptPositions.map((pos) => {
      const posEmployees = employeesByPos[pos.id] || [];
      const employeeNodes: ChartNode[] = posEmployees.map((emp) => ({
        id: `emp-${emp.id}`,
        name: emp.name,
        type: 'employee' as const,
        employeeId: emp.id,
        positionId: emp.positionId || undefined,
        departmentId: emp.departmentId || undefined,
      }));

      return {
        id: `pos-${pos.id}`,
        name: pos.name,
        type: 'position' as const,
        positionId: pos.id,
        departmentId: pos.departmentId,
        children: employeeNodes.length > 0 ? employeeNodes : undefined,
      };
    });

    // 递归处理子部门
    const childDeptNodes: ChartNode[] = (dept.children || []).map(buildDepartmentNode);

    // 合并岗位节点和子部门节点
    const allChildren = [...positionNodes, ...childDeptNodes];

    return {
      id: `dept-${dept.id}`,
      name: dept.name,
      type: 'department' as const,
      departmentId: dept.id,
      children: allChildren.length > 0 ? allChildren : undefined,
    };
  };

  // 构建根节点（公司）
  const rootChildren: ChartNode[] = departmentTree.map(buildDepartmentNode);

  return {
    id: 'company-root',
    name: 'S&W Consultant',
    type: 'company',
    children: rootChildren.length > 0 ? rootChildren : undefined,
  };
};

// 获取组织架构图数据
export const fetchOrganizationChartData = createAsyncThunk(
  'organization/fetchOrganizationChartData',
  async () => {
    const [departmentTree, positions, employees] = await Promise.all([
      departmentApi.getTree(),
      positionApi.getList(),
      employeeApi.getList(),
    ]);
    return aggregateToChartData(
      Array.isArray(departmentTree) ? departmentTree : [],
      Array.isArray(positions) ? positions : [],
      Array.isArray(employees) ? employees : []
    );
  }
);

export const createDepartment = createAsyncThunk(
  'organization/createDepartment',
  async (data: DepartmentForm) => await departmentApi.create(data)
);

export const updateDepartment = createAsyncThunk(
  'organization/updateDepartment',
  async ({ id, data }: { id: string; data: DepartmentForm }) => await departmentApi.update(id, data)
);

export const deleteDepartment = createAsyncThunk(
  'organization/deleteDepartment',
  async (id: string) => {
    await departmentApi.delete(id);
    return id;
  }
);

export const fetchPositions = createAsyncThunk(
  'organization/fetchPositions',
  async (departmentId?: string) => await positionApi.getList(departmentId)
);

export const createPosition = createAsyncThunk(
  'organization/createPosition',
  async (data: PositionForm) => await positionApi.create(data)
);

export const updatePosition = createAsyncThunk(
  'organization/updatePosition',
  async ({ id, data }: { id: string; data: PositionForm }) => await positionApi.update(id, data)
);

export const deletePosition = createAsyncThunk(
  'organization/deletePosition',
  async (id: string) => {
    await positionApi.delete(id);
    return id;
  }
);

export const fetchEmployees = createAsyncThunk(
  'organization/fetchEmployees',
  async (params?: { employeeType?: string; departmentId?: string; status?: string }) =>
    await employeeApi.getList(params)
);

export const fetchEmployeeById = createAsyncThunk(
  'organization/fetchEmployeeById',
  async (id: string) => await employeeApi.getById(id)
);

export const createEmployee = createAsyncThunk(
  'organization/createEmployee',
  async (data: EmployeeForm) => await employeeApi.create(data)
);

export const updateEmployee = createAsyncThunk(
  'organization/updateEmployee',
  async ({ id, data }: { id: string; data: EmployeeForm }) => await employeeApi.update(id, data)
);

export const deleteEmployee = createAsyncThunk(
  'organization/deleteEmployee',
  async (id: string) => {
    await employeeApi.delete(id);
    return id;
  }
);

export const saveAIConfig = createAsyncThunk(
  'organization/saveAIConfig',
  async ({ employeeId, data }: { employeeId: string; data: AIEmployeeConfigForm }) =>
    await employeeApi.saveAIConfig(employeeId, data)
);

export const testAIConnection = createAsyncThunk(
  'organization/testAIConnection',
  async (employeeId: string) => await employeeApi.testConnection(employeeId)
);

const organizationSlice = createSlice({
  name: 'organization',
  initialState,
  reducers: {
    setSelectedDepartment: (state, action: PayloadAction<Department | null>) => {
      state.selectedDepartment = action.payload;
    },
    setSelectedEmployee: (state, action: PayloadAction<Employee | null>) => {
      state.selectedEmployee = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Department Tree
      .addCase(fetchDepartmentTree.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchDepartmentTree.fulfilled, (state, action) => {
        state.loading = false;
        state.departmentTree = action.payload;
      })
      .addCase(fetchDepartmentTree.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch departments';
      })
      // Departments
      .addCase(fetchDepartments.fulfilled, (state, action) => {
        state.departments = action.payload;
      })
      .addCase(createDepartment.fulfilled, (state, action) => {
        state.departments.push(action.payload);
      })
      .addCase(updateDepartment.fulfilled, (state, action) => {
        const index = state.departments.findIndex((d) => d.id === action.payload.id);
        if (index !== -1) {
          state.departments[index] = action.payload;
        }
      })
      .addCase(deleteDepartment.fulfilled, (state, action) => {
        state.departments = state.departments.filter((d) => d.id !== action.payload);
      })
      // Positions
      .addCase(fetchPositions.fulfilled, (state, action) => {
        state.positions = action.payload;
      })
      .addCase(createPosition.fulfilled, (state, action) => {
        state.positions.push(action.payload);
      })
      .addCase(updatePosition.fulfilled, (state, action) => {
        const index = state.positions.findIndex((p) => p.id === action.payload.id);
        if (index !== -1) {
          state.positions[index] = action.payload;
        }
      })
      .addCase(deletePosition.fulfilled, (state, action) => {
        state.positions = state.positions.filter((p) => p.id !== action.payload);
      })
      // Employees
      .addCase(fetchEmployees.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchEmployees.fulfilled, (state, action) => {
        state.loading = false;
        state.employees = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchEmployees.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch employees';
      })
      .addCase(fetchEmployeeById.fulfilled, (state, action) => {
        state.selectedEmployee = action.payload;
      })
      .addCase(createEmployee.fulfilled, (state, action) => {
        state.employees.push(action.payload);
      })
      .addCase(updateEmployee.fulfilled, (state, action) => {
        const index = state.employees.findIndex((e) => e.id === action.payload.id);
        if (index !== -1) {
          state.employees[index] = action.payload;
        }
        if (state.selectedEmployee?.id === action.payload.id) {
          state.selectedEmployee = action.payload;
        }
      })
      .addCase(deleteEmployee.fulfilled, (state, action) => {
        state.employees = state.employees.filter((e) => e.id !== action.payload);
      })
      .addCase(saveAIConfig.fulfilled, (state, action) => {
        if (state.selectedEmployee && state.selectedEmployee.id === action.payload.employeeId) {
          state.selectedEmployee.aiConfig = action.payload;
        }
      })
      // Organization Chart Data
      .addCase(fetchOrganizationChartData.pending, (state) => {
        state.chartLoading = true;
      })
      .addCase(fetchOrganizationChartData.fulfilled, (state, action) => {
        state.chartLoading = false;
        state.chartData = action.payload;
      })
      .addCase(fetchOrganizationChartData.rejected, (state, action) => {
        state.chartLoading = false;
        state.error = action.error.message || 'Failed to fetch chart data';
      });
  },
});

export const { setSelectedDepartment, setSelectedEmployee, clearError } = organizationSlice.actions;
export default organizationSlice.reducer;
