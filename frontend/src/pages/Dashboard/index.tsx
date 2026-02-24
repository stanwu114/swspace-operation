import React, { useEffect } from 'react';
import { Card, Row, Col, Statistic, Tag, Space, Typography, Progress, Button } from 'antd';
import {
  ProjectOutlined,
  TeamOutlined,
  FileTextOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/useStore';
import { fetchProjects } from '../../store/slices/projectSlice';
import { fetchEmployees } from '../../store/slices/organizationSlice';
import { fetchContracts } from '../../store/slices/contractSlice';

const { Text } = Typography;

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { projects: rawProjects } = useAppSelector((state) => state.project);
  const { employees: rawEmployees } = useAppSelector((state) => state.organization);
  const { contracts: rawContracts } = useAppSelector((state) => state.contract);

  const projects = Array.isArray(rawProjects) ? rawProjects : [];
  const employees = Array.isArray(rawEmployees) ? rawEmployees : [];
  const contracts = Array.isArray(rawContracts) ? rawContracts : [];

  useEffect(() => {
    dispatch(fetchProjects());
    dispatch(fetchEmployees());
    dispatch(fetchContracts());
  }, [dispatch]);

  const activeProjects = projects.filter(p => p.status === 'ACTIVE').length;
  const humanEmployees = employees.filter(e => e.employeeType === 'HUMAN').length;
  const aiEmployees = employees.filter(e => e.employeeType === 'AI').length;

  const totalContractAmount = contracts.reduce((sum, c) => sum + (c.amount || 0), 0);
  const receiptAmount = contracts.filter(c => c.contractType === 'RECEIPT').reduce((sum, c) => sum + (c.amount || 0), 0);
  const paymentAmount = contracts.filter(c => c.contractType === 'PAYMENT').reduce((sum, c) => sum + (c.amount || 0), 0);

  // Project category distribution chart
  const projectCategoryOption = {
    tooltip: { trigger: 'item' },
    legend: { bottom: 0 },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
        label: { show: false },
        emphasis: { label: { show: true, fontSize: 14 } },
        data: [
          { value: projects.filter(p => p.projectCategory === 'PRE_SALE').length, name: '售前支撑' },
          { value: projects.filter(p => p.projectCategory === 'PLANNING').length, name: '顶层规划' },
          { value: projects.filter(p => p.projectCategory === 'RESEARCH').length, name: '课题研究' },
          { value: projects.filter(p => p.projectCategory === 'BLUEBIRD').length, name: '青鸟计划' },
          { value: projects.filter(p => p.projectCategory === 'DELIVERY').length, name: '项目交付' },
          { value: projects.filter(p => p.projectCategory === 'STRATEGIC').length, name: '战略合作' },
        ].filter(d => d.value > 0),
      },
    ],
  };

  // Contract amount chart
  const contractAmountOption = {
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: ['收款合同', '付款合同'] },
    yAxis: { type: 'value', axisLabel: { formatter: '${value}' } },
    series: [
      {
        type: 'bar',
        data: [
          { value: receiptAmount, itemStyle: { color: '#52c41a' } },
          { value: paymentAmount, itemStyle: { color: '#ff4d4f' } },
        ],
        barWidth: '40%',
      },
    ],
  };

  const recentProjects = [...projects]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">工作台</h1>
        <p className="page-subtitle">一人公司运营概览</p>
      </div>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable onClick={() => navigate('/projects')}>
            <Statistic
              title="进行中项目"
              value={activeProjects}
              suffix={`/ ${projects.length}`}
              prefix={<ProjectOutlined style={{ color: '#1890ff' }} />}
              styles={{ content: { color: '#1890ff' } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable onClick={() => navigate('/organization/employees')}>
            <Statistic
              title="员工总数"
              value={employees.length}
              prefix={<TeamOutlined style={{ color: '#52c41a' }} />}
              suffix={
                <Text type="secondary" style={{ fontSize: 14 }}>
                  (人类: {humanEmployees} / AI: {aiEmployees})
                </Text>
              }
              styles={{ content: { color: '#52c41a' } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable onClick={() => navigate('/finance/expenses')}>
            <Statistic
              title="合同数量"
              value={contracts.length}
              prefix={<FileTextOutlined style={{ color: '#722ed1' }} />}
              styles={{ content: { color: '#722ed1' } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable onClick={() => navigate('/contracts')}>
            <Statistic
              title="合同金额"
              value={totalContractAmount}
              precision={0}
              prefix={<DollarOutlined style={{ color: '#faad14' }} />}
              styles={{ content: { color: '#faad14' } }}
            />
          </Card>
        </Col>
      </Row>

      {/* Charts */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="项目分布" extra={<Button type="link" onClick={() => navigate('/projects')}>查看全部</Button>}>
            {projects.length > 0 ? (
              <ReactECharts option={projectCategoryOption} style={{ height: 300 }} />
            ) : (
              <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
                暂无项目数据
              </div>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="合同金额" extra={<Button type="link" onClick={() => navigate('/contracts')}>查看全部</Button>}>
            {contracts.length > 0 ? (
              <ReactECharts option={contractAmountOption} style={{ height: 300 }} />
            ) : (
              <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
                暂无合同数据
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* Recent Items */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card 
            title={<Space><ProjectOutlined /> 最近项目</Space>}
            extra={<Button type="link" icon={<ArrowRightOutlined />} onClick={() => navigate('/projects')}>更多</Button>}
          >
            {recentProjects.length > 0 ? recentProjects.map((project) => (
              <div key={project.id} style={{ display: 'flex', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                <Tag color={project.status === 'ACTIVE' ? 'processing' : 'default'} style={{ marginRight: 8 }}>
                  {project.status === 'ACTIVE' ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
                </Tag>
                <div style={{ flex: 1 }}>
                  <Text strong>{project.projectName}</Text>
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>{project.projectNo} | {project.leaderName || '未分配'}</Text>
                  </div>
                </div>
              </div>
            )) : (
              <div style={{ padding: '24px 0', textAlign: 'center', color: '#9ca3af' }}>暂无项目</div>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card 
            title={<Space><FileTextOutlined /> 合同进度</Space>}
            extra={<Button type="link" icon={<ArrowRightOutlined />} onClick={() => navigate('/contracts/list')}>更多</Button>}
          >
            {contracts.length > 0 ? contracts.slice(0, 5).map((contract) => (
              <div key={contract.id} style={{ display: 'flex', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                <Tag color={contract.contractType === 'RECEIPT' ? 'green' : 'red'} style={{ marginRight: 8 }}>
                  {contract.contractType === 'RECEIPT' ? '收款' : '付款'}
                </Tag>
                <div style={{ flex: 1 }}>
                  <Text strong>{contract.partyA} - {contract.partyB}</Text>
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {contract.projectName || '未关联项目'} | ¥{(contract.amount || 0).toLocaleString()}
                    </Text>
                  </div>
                </div>
              </div>
            )) : (
              <div style={{ padding: '24px 0', textAlign: 'center', color: '#9ca3af' }}>暂无合同</div>
            )}
          </Card>
        </Col>
      </Row>

      {/* Contract Progress */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24}>
          <Card title={<Space><FileTextOutlined /> 合同进度</Space>}>
            {contracts.length > 0 ? (
              <Row gutter={[16, 16]}>
                {contracts.slice(0, 4).map((contract) => (
                  <Col xs={24} sm={12} lg={6} key={contract.id}>
                    <Card size="small" hoverable onClick={() => navigate('/contracts')}>
                      <Space orientation="vertical" style={{ width: '100%' }}>
                        <Text strong ellipsis>{contract.partyA} - {contract.partyB}</Text>
                        <Tag color={contract.contractType === 'RECEIPT' ? 'green' : 'red'}>
                          {contract.contractType === 'RECEIPT' ? '收款' : '付款'}
                        </Tag>
                        <Progress
                          percent={contract.totalNodes ? Math.round((contract.completedNodes || 0) / contract.totalNodes * 100) : 0}
                          size="small"
                          format={() => `${contract.completedNodes || 0}/${contract.totalNodes || 0}`}
                        />
                      </Space>
                    </Card>
                  </Col>
                ))}
              </Row>
            ) : (
              <div style={{ padding: '40px 0', textAlign: 'center', color: '#9ca3af' }}>
                暂无合同数据
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
