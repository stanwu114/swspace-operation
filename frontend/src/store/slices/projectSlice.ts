import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Project, ProjectForm, ProjectDocument, ProjectCost, ProjectWeeklyReport, CostType } from '../../types';
import { projectApi } from '../../services/projectApi';

interface ProjectState {
  projects: Project[];
  selectedProject: Project | null;
  documents: ProjectDocument[];
  costs: ProjectCost[];
  weeklyReports: ProjectWeeklyReport[];
  loading: boolean;
  error: string | null;
}

const initialState: ProjectState = {
  projects: [],
  selectedProject: null,
  documents: [],
  costs: [],
  weeklyReports: [],
  loading: false,
  error: null,
};

// Async thunks
export const fetchProjects = createAsyncThunk(
  'project/fetchProjects',
  async (params?: { category?: string; status?: string; leaderId?: string }) =>
    await projectApi.getList(params)
);

export const fetchProjectById = createAsyncThunk(
  'project/fetchProjectById',
  async (id: string) => await projectApi.getById(id)
);

export const createProject = createAsyncThunk(
  'project/createProject',
  async (data: ProjectForm) => await projectApi.create(data)
);

export const updateProject = createAsyncThunk(
  'project/updateProject',
  async ({ id, data }: { id: string; data: ProjectForm }) => await projectApi.update(id, data)
);

export const deleteProject = createAsyncThunk(
  'project/deleteProject',
  async (id: string) => {
    await projectApi.delete(id);
    return id;
  }
);

export const fetchProjectDocuments = createAsyncThunk(
  'project/fetchDocuments',
  async (projectId: string) => await projectApi.getDocuments(projectId)
);

export const uploadProjectDocument = createAsyncThunk(
  'project/uploadDocument',
  async ({ projectId, file }: { projectId: string; file: File }) =>
    await projectApi.uploadDocument(projectId, file)
);

export const deleteProjectDocument = createAsyncThunk(
  'project/deleteDocument',
  async ({ projectId, documentId }: { projectId: string; documentId: string }) => {
    await projectApi.deleteDocument(projectId, documentId);
    return documentId;
  }
);

export const fetchProjectCosts = createAsyncThunk(
  'project/fetchCosts',
  async (projectId: string) => await projectApi.getCosts(projectId)
);

export const addProjectCost = createAsyncThunk(
  'project/addCost',
  async ({ projectId, data }: { projectId: string; data: { costType: CostType; amount: number; description?: string; costDate: string } }) =>
    await projectApi.addCost(projectId, data)
);

export const fetchWeeklyReports = createAsyncThunk(
  'project/fetchWeeklyReports',
  async (projectId: string) => await projectApi.getWeeklyReports(projectId)
);

const projectSlice = createSlice({
  name: 'project',
  initialState,
  reducers: {
    setSelectedProject: (state, action: PayloadAction<Project | null>) => {
      state.selectedProject = action.payload;
    },
    clearProjectError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjects.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.loading = false;
        state.projects = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch projects';
      })
      .addCase(fetchProjectById.fulfilled, (state, action) => {
        state.selectedProject = action.payload;
      })
      .addCase(createProject.fulfilled, (state, action) => {
        state.projects.push(action.payload);
      })
      .addCase(updateProject.fulfilled, (state, action) => {
        const index = state.projects.findIndex((p) => p.id === action.payload.id);
        if (index !== -1) {
          state.projects[index] = action.payload;
        }
        if (state.selectedProject?.id === action.payload.id) {
          state.selectedProject = action.payload;
        }
      })
      .addCase(deleteProject.fulfilled, (state, action) => {
        state.projects = state.projects.filter((p) => p.id !== action.payload);
      })
      .addCase(fetchProjectDocuments.fulfilled, (state, action) => {
        state.documents = action.payload;
      })
      .addCase(uploadProjectDocument.fulfilled, (state, action) => {
        state.documents.push(action.payload);
      })
      .addCase(deleteProjectDocument.fulfilled, (state, action) => {
        state.documents = state.documents.filter((d) => d.id !== action.payload);
      })
      .addCase(fetchProjectCosts.fulfilled, (state, action) => {
        state.costs = action.payload;
      })
      .addCase(addProjectCost.fulfilled, (state, action) => {
        state.costs.push(action.payload);
      })
      .addCase(fetchWeeklyReports.fulfilled, (state, action) => {
        state.weeklyReports = action.payload;
      });
  },
});

export const { setSelectedProject, clearProjectError } = projectSlice.actions;
export default projectSlice.reducer;
