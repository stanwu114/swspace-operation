import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ConfigProvider, App as AntApp } from 'antd';
import { store } from './store';
import MainLayout from './components/Layout/MainLayout';
import Dashboard from './pages/Dashboard';
import DepartmentsPage from './pages/Organization/DepartmentsPage';
import PositionsPage from './pages/Organization/PositionsPage';
import EmployeesPage from './pages/Organization/EmployeesPage';
import OrganizationChartPage from './pages/Organization/OrganizationChartPage';
import ProjectsPage from './pages/Project/ProjectsPage';
import LeadsPage from './pages/Lead/LeadsPage';
import ContractsPage from './pages/Contract/ContractsPage';
import ExpensesPage from './pages/Expense/ExpensesPage';
import AIModelConfigPage from './pages/Settings/AIModelConfigPage';
import AIMemoryPage from './pages/Settings/AIMemoryPage';
import ExternalMessagingPage from './pages/Settings/ExternalMessagingPage';
import './assets/styles/global.css';

const theme = {
  token: {
    colorPrimary: '#1890ff',
    borderRadius: 6,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  },
};

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <ConfigProvider theme={theme}>
        <AntApp>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<MainLayout />}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="organization">
                  <Route index element={<Navigate to="chart" replace />} />
                  <Route path="chart" element={<OrganizationChartPage />} />
                  <Route path="departments" element={<DepartmentsPage />} />
                  <Route path="positions" element={<PositionsPage />} />
                  <Route path="employees" element={<EmployeesPage />} />
                </Route>
                <Route path="projects">
                  <Route path="list" element={<ProjectsPage />} />
                </Route>
                <Route path="leads">
                  <Route path="list" element={<LeadsPage />} />
                </Route>
                <Route path="contracts">
                  <Route path="list" element={<ContractsPage />} />
                </Route>
                <Route path="finance">
                  <Route index element={<Navigate to="expenses" replace />} />
                  <Route path="expenses" element={<ExpensesPage />} />
                </Route>
                <Route path="settings">
                  <Route index element={<Navigate to="ai-model" replace />} />
                  <Route path="ai-model" element={<AIModelConfigPage />} />
                  <Route path="ai-memory" element={<AIMemoryPage />} />
                  <Route path="messaging" element={<ExternalMessagingPage />} />
                </Route>
              </Route>
            </Routes>
          </BrowserRouter>
        </AntApp>
      </ConfigProvider>
    </Provider>
  );
};

export default App;
