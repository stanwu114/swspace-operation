import { get, post, put, del, uploadFile } from './api';
import {
  Expense,
  ExpenseForm,
  ExpenseAttachment,
  ExpenseSearchParams,
} from '../types';

export const expenseApi = {
  getList: (params?: ExpenseSearchParams) =>
    get<Expense[]>('/expenses', params as Record<string, unknown> | undefined),

  getById: (id: string) => get<Expense>(`/expenses/${id}`),

  create: (data: ExpenseForm) => post<Expense>('/expenses', data),

  update: (id: string, data: ExpenseForm) => put<Expense>(`/expenses/${id}`, data),

  delete: (id: string) => del<void>(`/expenses/${id}`),

  // Attachments
  getAttachments: (expenseId: string) =>
    get<ExpenseAttachment[]>(`/expenses/${expenseId}/attachments`),

  uploadAttachment: (expenseId: string, file: File) =>
    uploadFile<ExpenseAttachment>(`/expenses/${expenseId}/attachments`, file),

  deleteAttachment: (expenseId: string, attachmentId: string) =>
    del<void>(`/expenses/${expenseId}/attachments/${attachmentId}`),

  // Export
  exportToExcel: async (ids?: string[]): Promise<Blob> => {
    const response = await fetch('/api/expenses/export', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ids }),
    });
    if (!response.ok) {
      throw new Error('Export failed');
    }
    return response.blob();
  },
};
