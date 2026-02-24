import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { leadApi } from '../../services/leadApi';
import type {
  Lead,
  LeadTrackingLog,
  LeadForm,
  LeadTrackingLogForm,
  LeadSearchParams,
  LeadStatus,
} from '../../types';

interface LeadState {
  leads: Lead[];
  selectedLead: Lead | null;
  logs: LeadTrackingLog[];
  loading: boolean;
  error: string | null;
}

const initialState: LeadState = {
  leads: [],
  selectedLead: null,
  logs: [],
  loading: false,
  error: null,
};

// Lead thunks
export const fetchLeads = createAsyncThunk(
  'lead/fetchLeads',
  async (params?: LeadSearchParams) => await leadApi.getList(params)
);

export const fetchLeadById = createAsyncThunk(
  'lead/fetchLeadById',
  async (id: string) => await leadApi.getById(id)
);

export const createLead = createAsyncThunk(
  'lead/createLead',
  async (data: LeadForm) => await leadApi.create(data)
);

export const updateLead = createAsyncThunk(
  'lead/updateLead',
  async ({ id, data }: { id: string; data: LeadForm }) => await leadApi.update(id, data)
);

export const updateLeadStatus = createAsyncThunk(
  'lead/updateLeadStatus',
  async ({ id, status }: { id: string; status: LeadStatus }) =>
    await leadApi.updateStatus(id, status)
);

export const deleteLead = createAsyncThunk(
  'lead/deleteLead',
  async (id: string) => {
    await leadApi.delete(id);
    return id;
  }
);

// Log thunks
export const fetchLeadLogs = createAsyncThunk(
  'lead/fetchLeadLogs',
  async (leadId: string) => await leadApi.getLogs(leadId)
);

export const createLeadLog = createAsyncThunk(
  'lead/createLeadLog',
  async ({ leadId, data }: { leadId: string; data: LeadTrackingLogForm }) =>
    await leadApi.createLog(leadId, data)
);

export const updateLeadLog = createAsyncThunk(
  'lead/updateLeadLog',
  async ({ leadId, logId, data }: { leadId: string; logId: string; data: LeadTrackingLogForm }) =>
    await leadApi.updateLog(leadId, logId, data)
);

export const deleteLeadLog = createAsyncThunk(
  'lead/deleteLeadLog',
  async ({ leadId, logId }: { leadId: string; logId: string }) => {
    await leadApi.deleteLog(leadId, logId);
    return logId;
  }
);

const leadSlice = createSlice({
  name: 'lead',
  initialState,
  reducers: {
    setSelectedLead: (state, action: PayloadAction<Lead | null>) => {
      state.selectedLead = action.payload;
    },
    clearLeadError: (state) => {
      state.error = null;
    },
    clearLogs: (state) => {
      state.logs = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch leads
      .addCase(fetchLeads.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLeads.fulfilled, (state, action) => {
        state.loading = false;
        state.leads = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchLeads.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || '获取线索列表失败';
      })
      // Fetch lead by id
      .addCase(fetchLeadById.fulfilled, (state, action) => {
        state.selectedLead = action.payload;
      })
      // Create lead
      .addCase(createLead.fulfilled, (state, action) => {
        state.leads.unshift(action.payload);
      })
      // Update lead
      .addCase(updateLead.fulfilled, (state, action) => {
        const index = state.leads.findIndex((l) => l.id === action.payload.id);
        if (index !== -1) {
          state.leads[index] = action.payload;
        }
        if (state.selectedLead?.id === action.payload.id) {
          state.selectedLead = action.payload;
        }
      })
      // Update lead status
      .addCase(updateLeadStatus.fulfilled, (state, action) => {
        const index = state.leads.findIndex((l) => l.id === action.payload.id);
        if (index !== -1) {
          state.leads[index] = action.payload;
        }
        if (state.selectedLead?.id === action.payload.id) {
          state.selectedLead = action.payload;
        }
      })
      // Delete lead
      .addCase(deleteLead.fulfilled, (state, action) => {
        state.leads = state.leads.filter((l) => l.id !== action.payload);
        if (state.selectedLead?.id === action.payload) {
          state.selectedLead = null;
        }
      })
      // Fetch logs
      .addCase(fetchLeadLogs.fulfilled, (state, action) => {
        state.logs = Array.isArray(action.payload) ? action.payload : [];
      })
      // Create log
      .addCase(createLeadLog.fulfilled, (state, action) => {
        state.logs.unshift(action.payload);
      })
      // Update log
      .addCase(updateLeadLog.fulfilled, (state, action) => {
        const index = state.logs.findIndex((l) => l.id === action.payload.id);
        if (index !== -1) {
          state.logs[index] = action.payload;
        }
      })
      // Delete log
      .addCase(deleteLeadLog.fulfilled, (state, action) => {
        state.logs = state.logs.filter((l) => l.id !== action.payload);
      });
  },
});

export const { setSelectedLead, clearLeadError, clearLogs } = leadSlice.actions;
export default leadSlice.reducer;
