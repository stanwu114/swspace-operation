import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Contract, ContractForm, PaymentNode, PaymentNodeForm, BidInfo, BidInfoForm } from '../../types';
import { contractApi } from '../../services/contractApi';

interface ContractState {
  contracts: Contract[];
  selectedContract: Contract | null;
  paymentNodes: PaymentNode[];
  bidInfo: BidInfo | null;
  loading: boolean;
  error: string | null;
}

const initialState: ContractState = {
  contracts: [],
  selectedContract: null,
  paymentNodes: [],
  bidInfo: null,
  loading: false,
  error: null,
};

// Async thunks
export const fetchContracts = createAsyncThunk(
  'contract/fetchContracts',
  async (params?: { contractType?: string; status?: string; projectId?: string }) =>
    await contractApi.getList(params)
);

export const fetchContractById = createAsyncThunk(
  'contract/fetchContractById',
  async (id: string) => await contractApi.getById(id)
);

export const createContract = createAsyncThunk(
  'contract/createContract',
  async (data: ContractForm) => await contractApi.create(data)
);

export const updateContract = createAsyncThunk(
  'contract/updateContract',
  async ({ id, data }: { id: string; data: ContractForm }) => await contractApi.update(id, data)
);

export const deleteContract = createAsyncThunk(
  'contract/deleteContract',
  async (id: string) => {
    await contractApi.delete(id);
    return id;
  }
);

export const fetchPaymentNodes = createAsyncThunk(
  'contract/fetchPaymentNodes',
  async (contractId: string) => await contractApi.getPaymentNodes(contractId)
);

export const addPaymentNode = createAsyncThunk(
  'contract/addPaymentNode',
  async ({ contractId, data }: { contractId: string; data: PaymentNodeForm }) =>
    await contractApi.addPaymentNode(contractId, data)
);

export const updatePaymentNode = createAsyncThunk(
  'contract/updatePaymentNode',
  async ({ contractId, nodeId, data }: { contractId: string; nodeId: string; data: Partial<PaymentNodeForm & { actualAmount?: number; actualDate?: string; status?: string }> }) =>
    await contractApi.updatePaymentNode(contractId, nodeId, data)
);

export const fetchBidInfo = createAsyncThunk(
  'contract/fetchBidInfo',
  async (contractId: string) => await contractApi.getBidInfo(contractId)
);

export const saveBidInfo = createAsyncThunk(
  'contract/saveBidInfo',
  async ({ contractId, data }: { contractId: string; data: BidInfoForm }) =>
    await contractApi.saveBidInfo(contractId, data)
);

const contractSlice = createSlice({
  name: 'contract',
  initialState,
  reducers: {
    setSelectedContract: (state, action: PayloadAction<Contract | null>) => {
      state.selectedContract = action.payload;
    },
    clearContractError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchContracts.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchContracts.fulfilled, (state, action) => {
        state.loading = false;
        state.contracts = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchContracts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch contracts';
      })
      .addCase(fetchContractById.fulfilled, (state, action) => {
        state.selectedContract = action.payload;
      })
      .addCase(createContract.fulfilled, (state, action) => {
        state.contracts.push(action.payload);
      })
      .addCase(updateContract.fulfilled, (state, action) => {
        const index = state.contracts.findIndex((c) => c.id === action.payload.id);
        if (index !== -1) {
          state.contracts[index] = action.payload;
        }
        if (state.selectedContract?.id === action.payload.id) {
          state.selectedContract = action.payload;
        }
      })
      .addCase(deleteContract.fulfilled, (state, action) => {
        state.contracts = state.contracts.filter((c) => c.id !== action.payload);
      })
      .addCase(fetchPaymentNodes.fulfilled, (state, action) => {
        state.paymentNodes = action.payload;
      })
      .addCase(addPaymentNode.fulfilled, (state, action) => {
        state.paymentNodes.push(action.payload);
      })
      .addCase(updatePaymentNode.fulfilled, (state, action) => {
        const index = state.paymentNodes.findIndex((n) => n.id === action.payload.id);
        if (index !== -1) {
          state.paymentNodes[index] = action.payload;
        }
      })
      .addCase(fetchBidInfo.fulfilled, (state, action) => {
        state.bidInfo = action.payload;
      })
      .addCase(saveBidInfo.fulfilled, (state, action) => {
        state.bidInfo = action.payload;
      });
  },
});

export const { setSelectedContract, clearContractError } = contractSlice.actions;
export default contractSlice.reducer;
