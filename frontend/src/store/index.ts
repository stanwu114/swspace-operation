import { configureStore } from '@reduxjs/toolkit';
import organizationReducer from './slices/organizationSlice';
import projectReducer from './slices/projectSlice';
import contractReducer from './slices/contractSlice';
import aiAssistantReducer from './slices/aiAssistantSlice';
import expenseReducer from './slices/expenseSlice';
import leadReducer from './slices/leadSlice';

export const store = configureStore({
  reducer: {
    organization: organizationReducer,
    project: projectReducer,
    contract: contractReducer,
    aiAssistant: aiAssistantReducer,
    expense: expenseReducer,
    lead: leadReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['aiAssistant/analyzeFile/pending'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
