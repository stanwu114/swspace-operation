import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Expense, ExpenseForm, ExpenseAttachment, ExpenseSearchParams } from '../../types';
import { expenseApi } from '../../services/expenseApi';

interface ExpenseState {
  expenses: Expense[];
  selectedExpense: Expense | null;
  attachments: ExpenseAttachment[];
  selectedIds: string[];
  loading: boolean;
  error: string | null;
  searchParams: ExpenseSearchParams;
}

const initialState: ExpenseState = {
  expenses: [],
  selectedExpense: null,
  attachments: [],
  selectedIds: [],
  loading: false,
  error: null,
  searchParams: {},
};

// Async thunks
export const fetchExpenses = createAsyncThunk(
  'expense/fetchExpenses',
  async (params?: ExpenseSearchParams) => await expenseApi.getList(params)
);

export const fetchExpenseById = createAsyncThunk(
  'expense/fetchExpenseById',
  async (id: string) => await expenseApi.getById(id)
);

export const createExpense = createAsyncThunk(
  'expense/createExpense',
  async (data: ExpenseForm) => await expenseApi.create(data)
);

export const updateExpense = createAsyncThunk(
  'expense/updateExpense',
  async ({ id, data }: { id: string; data: ExpenseForm }) => await expenseApi.update(id, data)
);

export const deleteExpense = createAsyncThunk(
  'expense/deleteExpense',
  async (id: string) => {
    await expenseApi.delete(id);
    return id;
  }
);

export const fetchExpenseAttachments = createAsyncThunk(
  'expense/fetchAttachments',
  async (expenseId: string) => await expenseApi.getAttachments(expenseId)
);

export const uploadExpenseAttachment = createAsyncThunk(
  'expense/uploadAttachment',
  async ({ expenseId, file }: { expenseId: string; file: File }) =>
    await expenseApi.uploadAttachment(expenseId, file)
);

export const deleteExpenseAttachment = createAsyncThunk(
  'expense/deleteAttachment',
  async ({ expenseId, attachmentId }: { expenseId: string; attachmentId: string }) => {
    await expenseApi.deleteAttachment(expenseId, attachmentId);
    return attachmentId;
  }
);

export const exportExpenses = createAsyncThunk(
  'expense/exportExpenses',
  async (ids?: string[]) => {
    const blob = await expenseApi.exportToExcel(ids);
    // 创建下载链接
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `费用明细_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.xlsx`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    return true;
  }
);

const expenseSlice = createSlice({
  name: 'expense',
  initialState,
  reducers: {
    setSelectedExpense: (state, action: PayloadAction<Expense | null>) => {
      state.selectedExpense = action.payload;
    },
    clearExpenseError: (state) => {
      state.error = null;
    },
    setSearchParams: (state, action: PayloadAction<ExpenseSearchParams>) => {
      state.searchParams = action.payload;
    },
    toggleSelectExpense: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      const index = state.selectedIds.indexOf(id);
      if (index === -1) {
        state.selectedIds.push(id);
      } else {
        state.selectedIds.splice(index, 1);
      }
    },
    selectAllExpenses: (state) => {
      state.selectedIds = state.expenses.map(e => e.id);
    },
    clearSelectedExpenses: (state) => {
      state.selectedIds = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchExpenses.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchExpenses.fulfilled, (state, action) => {
        state.loading = false;
        state.expenses = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchExpenses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || '获取费用列表失败';
      })
      .addCase(fetchExpenseById.fulfilled, (state, action) => {
        state.selectedExpense = action.payload;
      })
      .addCase(createExpense.fulfilled, (state, action) => {
        state.expenses.unshift(action.payload);
      })
      .addCase(updateExpense.fulfilled, (state, action) => {
        const index = state.expenses.findIndex((e) => e.id === action.payload.id);
        if (index !== -1) {
          state.expenses[index] = action.payload;
        }
        if (state.selectedExpense?.id === action.payload.id) {
          state.selectedExpense = action.payload;
        }
      })
      .addCase(deleteExpense.fulfilled, (state, action) => {
        state.expenses = state.expenses.filter((e) => e.id !== action.payload);
        state.selectedIds = state.selectedIds.filter((id) => id !== action.payload);
      })
      .addCase(fetchExpenseAttachments.fulfilled, (state, action) => {
        state.attachments = action.payload;
      })
      .addCase(uploadExpenseAttachment.fulfilled, (state, action) => {
        state.attachments.push(action.payload);
        // 更新对应费用的附件数量
        const expense = state.expenses.find(e => e.id === action.payload.expenseId);
        if (expense) {
          expense.attachmentCount += 1;
        }
      })
      .addCase(deleteExpenseAttachment.fulfilled, (state, action) => {
        const attachment = state.attachments.find(a => a.id === action.payload);
        state.attachments = state.attachments.filter((a) => a.id !== action.payload);
        // 更新对应费用的附件数量
        if (attachment) {
          const expense = state.expenses.find(e => e.id === attachment.expenseId);
          if (expense && expense.attachmentCount > 0) {
            expense.attachmentCount -= 1;
          }
        }
      });
  },
});

export const {
  setSelectedExpense,
  clearExpenseError,
  setSearchParams,
  toggleSelectExpense,
  selectAllExpenses,
  clearSelectedExpenses,
} = expenseSlice.actions;

export default expenseSlice.reducer;
