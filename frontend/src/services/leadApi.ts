import { get, post, put, del } from './api';
import type { 
  Lead, 
  LeadTrackingLog, 
  LeadForm, 
  LeadTrackingLogForm,
  LeadSearchParams,
  LeadStatus
} from '../types';

export const leadApi = {
  // Lead CRUD
  getList: (params?: LeadSearchParams) =>
    get<Lead[]>('/leads', params as Record<string, unknown> | undefined),

  getById: (id: string) => get<Lead>(`/leads/${id}`),

  create: (data: LeadForm) => post<Lead>('/leads', data),

  update: (id: string, data: LeadForm) => put<Lead>(`/leads/${id}`, data),

  updateStatus: (id: string, status: LeadStatus) =>
    put<Lead>(`/leads/${id}/status`, { status }),

  delete: (id: string) => del<void>(`/leads/${id}`),

  // Tags
  getAllTags: () => get<string[]>('/leads/tags'),

  // Tracking Log CRUD
  getLogs: (leadId: string) => get<LeadTrackingLog[]>(`/leads/${leadId}/logs`),

  createLog: (leadId: string, data: LeadTrackingLogForm) =>
    post<LeadTrackingLog>(`/leads/${leadId}/logs`, data),

  updateLog: (leadId: string, logId: string, data: LeadTrackingLogForm) =>
    put<LeadTrackingLog>(`/leads/${leadId}/logs/${logId}`, data),

  deleteLog: (leadId: string, logId: string) =>
    del<void>(`/leads/${leadId}/logs/${logId}`),
};
