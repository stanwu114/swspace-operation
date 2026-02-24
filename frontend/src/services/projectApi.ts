import { get, post, put, del, uploadFile } from './api';
import {
  Project,
  ProjectForm,
  ProjectDocument,
  ProjectWeeklyReport,
  ProjectCost,
  CostType,
} from '../types';

export const projectApi = {
  getList: (params?: { category?: string; status?: string; leaderId?: string }) =>
    get<Project[]>('/projects', params),
  getById: (id: string) => get<Project>(`/projects/${id}`),
  create: (data: ProjectForm) => post<Project>('/projects', data),
  update: (id: string, data: ProjectForm) => put<Project>(`/projects/${id}`, data),
  delete: (id: string) => del<void>(`/projects/${id}`),
  updateStatus: (id: string, status: string) => put<Project>(`/projects/${id}/status`, { status }),

  // Documents
  getDocuments: (projectId: string) => get<ProjectDocument[]>(`/projects/${projectId}/documents`),
  uploadDocument: (projectId: string, file: File) =>
    uploadFile<ProjectDocument>(`/projects/${projectId}/documents`, file),
  deleteDocument: (projectId: string, documentId: string) =>
    del<void>(`/projects/${projectId}/documents/${documentId}`),

  // Weekly Reports
  getWeeklyReports: (projectId: string) =>
    get<ProjectWeeklyReport[]>(`/projects/${projectId}/weekly-reports`),
  generateWeeklyReport: (projectId: string, weekStartDate: string) =>
    post<ProjectWeeklyReport>(`/projects/${projectId}/weekly-reports/generate`, { weekStartDate }),

  // Costs
  getCosts: (projectId: string) => get<ProjectCost[]>(`/projects/${projectId}/costs`),
  addCost: (projectId: string, data: { costType: CostType; amount: number; description?: string; costDate: string }) =>
    post<ProjectCost>(`/projects/${projectId}/costs`, data),
  deleteCost: (projectId: string, costId: string) =>
    del<void>(`/projects/${projectId}/costs/${costId}`),
  getTotalCost: (projectId: string) => get<number>(`/projects/${projectId}/costs/total`),
};
