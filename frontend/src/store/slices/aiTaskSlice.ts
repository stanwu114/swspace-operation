import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type {
  AITask,
  AITaskExecution,
} from '../../types';

interface AITaskState {
  tasks: AITask[];
  selectedTask: AITask | null;
  executions: AITaskExecution[];
  loading: boolean;
  error: string | null;
}

const initialState: AITaskState = {
  tasks: [],
  selectedTask: null,
  executions: [],
  loading: false,
  error: null,
};

// Task thunks - placeholder implementations
// These will be connected to actual API when backend is ready
export const fetchAITasks = createAsyncThunk(
  'aiTask/fetchAITasks',
  async () => {
    // TODO: Implement API call when backend is ready
    return [] as AITask[];
  }
);

export const createAITask = createAsyncThunk(
  'aiTask/createAITask',
  async () => {
    // TODO: Implement API call when backend is ready
    return {} as AITask;
  }
);

export const updateAITask = createAsyncThunk(
  'aiTask/updateAITask',
  async () => {
    // TODO: Implement API call when backend is ready
    return {} as AITask;
  }
);

export const updateAITaskStatus = createAsyncThunk(
  'aiTask/updateAITaskStatus',
  async () => {
    // TODO: Implement API call when backend is ready
    return {} as AITask;
  }
);

export const deleteAITask = createAsyncThunk(
  'aiTask/deleteAITask',
  async (id: string) => {
    // TODO: Implement API call when backend is ready
    return id;
  }
);

// Execution thunks - placeholder implementations
export const fetchTaskExecutions = createAsyncThunk(
  'aiTask/fetchTaskExecutions',
  async () => {
    // TODO: Implement API call when backend is ready
    return [] as AITaskExecution[];
  }
);

const aiTaskSlice = createSlice({
  name: 'aiTask',
  initialState,
  reducers: {
    setSelectedTask: (state, action: PayloadAction<AITask | null>) => {
      state.selectedTask = action.payload;
    },
    clearExecutions: (state) => {
      state.executions = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch tasks
      .addCase(fetchAITasks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAITasks.fulfilled, (state, action) => {
        state.loading = false;
        state.tasks = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchAITasks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || '获取任务列表失败';
      })
      // Create task
      .addCase(createAITask.fulfilled, (state, action) => {
        state.tasks.unshift(action.payload);
      })
      // Update task
      .addCase(updateAITask.fulfilled, (state, action) => {
        const index = state.tasks.findIndex((t) => t.id === action.payload.id);
        if (index !== -1) {
          state.tasks[index] = action.payload;
        }
        if (state.selectedTask?.id === action.payload.id) {
          state.selectedTask = action.payload;
        }
      })
      // Update task status
      .addCase(updateAITaskStatus.fulfilled, (state, action) => {
        const index = state.tasks.findIndex((t) => t.id === action.payload.id);
        if (index !== -1) {
          state.tasks[index] = action.payload;
        }
        if (state.selectedTask?.id === action.payload.id) {
          state.selectedTask = action.payload;
        }
      })
      // Delete task
      .addCase(deleteAITask.fulfilled, (state, action) => {
        state.tasks = state.tasks.filter((t) => t.id !== action.payload);
        if (state.selectedTask?.id === action.payload) {
          state.selectedTask = null;
        }
      })
      // Fetch executions
      .addCase(fetchTaskExecutions.fulfilled, (state, action) => {
        state.executions = Array.isArray(action.payload) ? action.payload : [];
      });
  },
});

export const { setSelectedTask, clearExecutions } = aiTaskSlice.actions;
export default aiTaskSlice.reducer;
