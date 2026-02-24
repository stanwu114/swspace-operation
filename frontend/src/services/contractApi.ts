import { get, post, put, del, uploadFile } from './api';
import {
  Contract,
  ContractForm,
  PaymentNode,
  PaymentNodeForm,
  BidInfo,
  BidInfoForm,
} from '../types';

export const contractApi = {
  getList: (params?: { contractType?: string; status?: string; projectId?: string }) =>
    get<Contract[]>('/contracts', params),
  getById: (id: string) => get<Contract>(`/contracts/${id}`),
  create: (data: ContractForm) => post<Contract>('/contracts', data),
  update: (id: string, data: ContractForm) => put<Contract>(`/contracts/${id}`, data),
  delete: (id: string) => del<void>(`/contracts/${id}`),
  updateStatus: (id: string, status: string) => put<Contract>(`/contracts/${id}/status`, { status }),
  uploadContractFile: (id: string, file: File) =>
    uploadFile<Contract>(`/contracts/${id}/file`, file),

  // Payment Nodes
  getPaymentNodes: (contractId: string) =>
    get<PaymentNode[]>(`/contracts/${contractId}/payment-nodes`),
  addPaymentNode: (contractId: string, data: PaymentNodeForm) =>
    post<PaymentNode>(`/contracts/${contractId}/payment-nodes`, data),
  updatePaymentNode: (contractId: string, nodeId: string, data: Partial<PaymentNodeForm & { actualAmount?: number; actualDate?: string; status?: string }>) =>
    put<PaymentNode>(`/contracts/${contractId}/payment-nodes/${nodeId}`, data),
  deletePaymentNode: (contractId: string, nodeId: string) =>
    del<void>(`/contracts/${contractId}/payment-nodes/${nodeId}`),

  // Bid Info
  getBidInfo: (contractId: string) => get<BidInfo>(`/contracts/${contractId}/bid-info`),
  saveBidInfo: (contractId: string, data: BidInfoForm) =>
    post<BidInfo>(`/contracts/${contractId}/bid-info`, data),
  uploadBidDocument: (contractId: string, docType: 'announce' | 'submit' | 'win', file: File) =>
    uploadFile<BidInfo>(`/contracts/${contractId}/bid-info/${docType}`, file),
};
