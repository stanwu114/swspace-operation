import React, { useState, useEffect, useRef } from 'react';
import { Layout, Menu } from 'antd';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import type { MenuProps } from 'antd';
import {
  DashboardOutlined,
  ApartmentOutlined,
  TeamOutlined,
  UserOutlined,
  ProjectOutlined,
  FileTextOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  MessageOutlined,
  SettingOutlined,
  AppstoreOutlined,
  SolutionOutlined,
  ApiOutlined,
  BulbOutlined,
  DollarOutlined,
  SendOutlined,
} from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '../../hooks/useStore';
import { toggleAssistant, openAssistant, setCurrentModule } from '../../store/slices/aiAssistantSlice';
import { messagingApi } from '../../services/messagingApi';
import AIAssistantPanel from '../AIAssistant/AIAssistantPanel';
import './MainLayout.css';

const { Sider, Content } = Layout;

type MenuItem = Required<MenuProps>['items'][number];

// 菜单项路径映射
const menuPaths: Record<string, string> = {
  'dashboard': '/dashboard',
  'organization-chart': '/organization/chart',
  'departments': '/organization/departments',
  'positions': '/organization/positions',
  'employees': '/organization/employees',
  'projects': '/projects/list',
  'leads': '/leads/list',
  'contracts': '/contracts/list',
  'expenses': '/finance/expenses',
  'ai-model-config': '/settings/ai-model',
  'ai-memory': '/settings/ai-memory',
  'messaging': '/settings/messaging',
};

const menuItems: MenuItem[] = [
  {
    key: 'dashboard',
    icon: <DashboardOutlined />,
    label: '工作台',
  },
  {
    key: 'organization',
    icon: <AppstoreOutlined />,
    label: '组织管理',
    children: [
      {
        key: 'organization-chart',
        icon: <ApartmentOutlined />,
        label: '组织架构图',
      },
      {
        key: 'departments',
        icon: <TeamOutlined />,
        label: '部门管理',
      },
      {
        key: 'positions',
        icon: <SolutionOutlined />,
        label: '岗位管理',
      },
      {
        key: 'employees',
        icon: <UserOutlined />,
        label: '员工管理',
      },
    ],
  },
  {
    key: 'business',
    icon: <ProjectOutlined />,
    label: '业务管理',
    children: [
      {
        key: 'leads',
        icon: <BulbOutlined />,
        label: '线索管理',
      },
      {
        key: 'projects',
        icon: <ProjectOutlined />,
        label: '项目管理',
      },
    ],
  },
  {
    key: 'finance',
    icon: <DollarOutlined />,
    label: '财务管理',
    children: [
      {
        key: 'contracts',
        icon: <FileTextOutlined />,
        label: '合同管理',
      },
      {
        key: 'expenses',
        icon: <DollarOutlined />,
        label: '费用管理',
      },
    ],
  },
  {
    key: 'settings',
    icon: <SettingOutlined />,
    label: '系统设置',
    children: [
      {
        key: 'ai-model-config',
        icon: <ApiOutlined />,
        label: 'AI模型配置',
      },
      {
        key: 'ai-memory',
        icon: <BulbOutlined />,
        label: '上下文记忆',
      },
      {
        key: 'messaging',
        icon: <SendOutlined />,
        label: '消息集成',
      },
    ],
  },
];

const MainLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [openKeys, setOpenKeys] = useState<string[]>(['organization']);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { isOpen: isAssistantOpen } = useAppSelector((state) => state.aiAssistant);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        weekday: 'short',
      }));
    };
    updateTime();
    const timer = setInterval(updateTime, 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const pathParts = location.pathname.split('/');
    const module = pathParts[1] || 'dashboard';
    dispatch(setCurrentModule(module));
    
    // 自动展开当前路径对应的菜单
    if (location.pathname.includes('/organization')) {
      setOpenKeys((keys) => keys.includes('organization') ? keys : [...keys, 'organization']);
    }
    if (location.pathname.includes('/projects') || location.pathname.includes('/leads')) {
      setOpenKeys((keys) => keys.includes('business') ? keys : [...keys, 'business']);
    }
    if (location.pathname.includes('/contracts') || location.pathname.includes('/finance')) {
      setOpenKeys((keys) => keys.includes('finance') ? keys : [...keys, 'finance']);
    }
    if (location.pathname.includes('/settings')) {
      setOpenKeys((keys) => keys.includes('settings') ? keys : [...keys, 'settings']);
    }
  }, [location.pathname, dispatch]);

  const getSelectedKey = () => {
    const path = location.pathname;
    if (path.includes('/organization/chart')) return 'organization-chart';
    if (path.includes('/organization/departments')) return 'departments';
    if (path.includes('/organization/positions')) return 'positions';
    if (path.includes('/organization/employees')) return 'employees';
    if (path.includes('/leads')) return 'leads';
    if (path.includes('/projects')) return 'projects';
    if (path.includes('/contracts')) return 'contracts';
    if (path.includes('/finance/expenses')) return 'expenses';
    if (path.includes('/settings/ai-model')) return 'ai-model-config';
    if (path.includes('/settings/ai-memory')) return 'ai-memory';
    if (path.includes('/settings/messaging')) return 'messaging';
    return 'dashboard';
  };

  const handleMenuClick = ({ key }: { key: string }) => {
    const path = menuPaths[key];
    if (path) navigate(path);
  };

  const handleOpenChange = (keys: string[]) => {
    setOpenKeys(keys);
  };

  const handleAssistantToggle = () => {
    dispatch(toggleAssistant());
  };

  // 全局轮询: 检测 Telegram 待处理消息，自动打开 AI 助手面板
  const pollingActiveRef = useRef(false);
  useEffect(() => {
    const checkPendingMessages = async () => {
      if (pollingActiveRef.current) return; // 防止并发
      pollingActiveRef.current = true;
      try {
        const pending = await messagingApi.getPendingMessages();
        if (pending.length > 0 && !isAssistantOpen) {
          dispatch(openAssistant());
        }
      } catch {
        // 静默失败（可能消息集成未启用）
      } finally {
        pollingActiveRef.current = false;
      }
    };

    checkPendingMessages();
    const interval = setInterval(checkPendingMessages, 5000);
    return () => clearInterval(interval);
  }, [dispatch, isAssistantOpen]);

  return (
    <Layout className="main-layout">
      <header className="main-header">
        <div className="header-left">
          <div className="logo">
            {!collapsed && <span>S&W Consultant</span>}
            {collapsed && <span>S&W</span>}
          </div>
          <button className="collapse-btn" onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </button>
        </div>
        <div className="header-right">
          <span className="header-time">{currentTime}</span>
        </div>
      </header>

      <Sider
        className="main-sider"
        width={220}
        collapsedWidth={64}
        collapsed={collapsed}
        theme="light"
      >
        <Menu
          className="sider-menu"
          mode="inline"
          selectedKeys={[getSelectedKey()]}
          openKeys={collapsed ? [] : openKeys}
          onOpenChange={handleOpenChange}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>

      <Content className={`main-content ${collapsed ? 'collapsed' : ''}`}>
        <div className="content-wrapper">
          <Outlet />
        </div>
      </Content>

      <div className="ai-assistant-float">
        <button className="ai-float-btn" onClick={handleAssistantToggle}>
          <MessageOutlined />
        </button>
      </div>

      {isAssistantOpen && <AIAssistantPanel />}
    </Layout>
  );
};

export default MainLayout;
