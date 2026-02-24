import { get, post, put, del } from './api';
import {
  Department,
  DepartmentForm,
  Position,
  PositionForm,
  Employee,
  EmployeeForm,
  AIEmployeeConfig,
  AIEmployeeConfigForm,
} from '../types';

// Department APIs
export const departmentApi = {
  getTree: () => get<Department[]>('/departments/tree'),
  getList: () => get<Department[]>('/departments'),
  getById: (id: string) => get<Department>(`/departments/${id}`),
  create: (data: DepartmentForm) => post<Department>('/departments', data),
  update: (id: string, data: DepartmentForm) => put<Department>(`/departments/${id}`, data),
  delete: (id: string) => del<void>(`/departments/${id}`),
};

// Position APIs
export const positionApi = {
  getList: (departmentId?: string) => 
    get<Position[]>('/positions', departmentId ? { departmentId } : undefined),
  getById: (id: string) => get<Position>(`/positions/${id}`),
  create: (data: PositionForm) => post<Position>('/positions', data),
  update: (id: string, data: PositionForm) => put<Position>(`/positions/${id}`, data),
  delete: (id: string) => del<void>(`/positions/${id}`),
};

// Employee APIs
export const employeeApi = {
  getList: (params?: { employeeType?: string; departmentId?: string; status?: string }) =>
    get<Employee[]>('/employees', params),
  getById: (id: string) => get<Employee>(`/employees/${id}`),
  create: (data: EmployeeForm) => post<Employee>('/employees', data),
  update: (id: string, data: EmployeeForm) => put<Employee>(`/employees/${id}`, data),
  delete: (id: string) => del<void>(`/employees/${id}`),
  
  // AI Employee Config
  getAIConfig: (employeeId: string) => get<AIEmployeeConfig>(`/employees/${employeeId}/ai-config`),
  saveAIConfig: (employeeId: string, data: AIEmployeeConfigForm) =>
    post<AIEmployeeConfig>(`/employees/${employeeId}/ai-config`, data),
  testConnection: (employeeId: string) =>
    post<{ status: string; models?: string[] }>(`/employees/${employeeId}/ai-config/test`),
  getModels: (employeeId: string) => get<string[]>(`/employees/${employeeId}/ai-config/models`),
};
