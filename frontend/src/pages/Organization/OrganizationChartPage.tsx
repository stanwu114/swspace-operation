import React, { useEffect, useRef, useCallback } from 'react';
import { Card, Button, Space, Spin, Empty } from 'antd';
import { ReloadOutlined, FullscreenOutlined, FullscreenExitOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import * as echarts from 'echarts';
import { useAppDispatch, useAppSelector } from '../../hooks/useStore';
import { fetchOrganizationChartData } from '../../store/slices/organizationSlice';
import { ChartNode } from '../../types';

const OrganizationChartPage: React.FC = () => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { chartData, chartLoading } = useAppSelector((state) => state.organization);

  // 获取数据
  useEffect(() => {
    dispatch(fetchOrganizationChartData());
  }, [dispatch]);

  // 处理节点点击
  const handleNodeClick = useCallback((params: { data: ChartNode }) => {
    const nodeData = params.data;
    if (!nodeData) return;

    switch (nodeData.type) {
      case 'department':
        if (nodeData.departmentId) {
          navigate('/organization/departments');
        }
        break;
      case 'position':
        if (nodeData.positionId) {
          navigate('/organization/positions');
        }
        break;
      case 'employee':
        if (nodeData.employeeId) {
          navigate('/organization/employees');
        }
        break;
      default:
        break;
    }
  }, [navigate]);

  // 获取节点颜色
  const getNodeColor = (type: string): string => {
    switch (type) {
      case 'company':
        return '#1677ff';
      case 'department':
        return '#52c41a';
      case 'position':
        return '#faad14';
      case 'employee':
        return '#722ed1';
      default:
        return '#666';
    }
  };

  // 获取节点标签
  const getNodeLabel = (type: string): string => {
    switch (type) {
      case 'company':
        return '公司';
      case 'department':
        return '部门';
      case 'position':
        return '岗位';
      case 'employee':
        return '员工';
      default:
        return '';
    }
  };

  // 转换数据为 ECharts 格式
  const transformToEChartsData = useCallback((node: ChartNode): Record<string, unknown> => {
    return {
      name: node.name,
      value: node.type,
      itemStyle: {
        color: getNodeColor(node.type),
        borderColor: getNodeColor(node.type),
      },
      label: {
        formatter: `{name|${node.name}}\n{type|${getNodeLabel(node.type)}}`,
        rich: {
          name: {
            fontSize: 12,
            fontWeight: 'bold',
            color: '#333',
          },
          type: {
            fontSize: 10,
            color: '#999',
          },
        },
      },
      // 保留原始数据用于点击事件
      data: node,
      children: node.children?.map(transformToEChartsData),
    };
  }, []);

  // 初始化图表
  useEffect(() => {
    if (!chartRef.current || !chartData) return;

    // 销毁旧实例
    if (chartInstance.current && !chartInstance.current.isDisposed()) {
      chartInstance.current.dispose();
    }

    // 创建新实例
    const chart = echarts.init(chartRef.current);
    chartInstance.current = chart;

    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: 'item',
        formatter: (params: unknown) => {
          const p = params as { data?: { name: string; data?: ChartNode } };
          const data = p.data;
          if (!data || !data.data) return '';
          const node = data.data;
          return `<div style="padding: 8px;">
            <div style="font-weight: bold; margin-bottom: 4px;">${node.name}</div>
            <div style="color: ${getNodeColor(node.type)};">${getNodeLabel(node.type)}</div>
          </div>`;
        },
      },
      series: [
        {
          type: 'tree',
          data: [transformToEChartsData(chartData)],
          top: '5%',
          left: '10%',
          bottom: '5%',
          right: '10%',
          symbolSize: 14,
          orient: 'vertical',
          layout: 'orthogonal',
          label: {
            position: 'bottom',
            verticalAlign: 'middle',
            align: 'center',
            fontSize: 11,
            distance: 8,
          },
          leaves: {
            label: {
              position: 'bottom',
              verticalAlign: 'middle',
              align: 'center',
            },
          },
          emphasis: {
            focus: 'descendant',
          },
          expandAndCollapse: true,
          initialTreeDepth: 3,
          animationDuration: 550,
          animationDurationUpdate: 750,
          lineStyle: {
            color: '#ccc',
            width: 1.5,
            curveness: 0.5,
          },
        },
      ],
    };

    chart.setOption(option);

    // 绑定点击事件
    chart.on('click', (params) => {
      const data = params.data as { data?: ChartNode };
      if (data?.data) {
        handleNodeClick({ data: data.data });
      }
    });

    // 响应窗口大小变化
    const handleResize = () => {
      chart.resize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chart && !chart.isDisposed()) {
        chart.dispose();
      }
    };
  }, [chartData, transformToEChartsData, handleNodeClick]);

  // 刷新数据
  const handleRefresh = () => {
    dispatch(fetchOrganizationChartData());
  };

  // 全屏切换
  const toggleFullscreen = () => {
    if (!chartRef.current?.parentElement) return;
    
    if (!isFullscreen) {
      chartRef.current.parentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setIsFullscreen(!isFullscreen);
  };

  // 监听全屏变化
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      // 全屏变化后重新调整图表大小
      setTimeout(() => {
        chartInstance.current?.resize();
      }, 100);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <Card
        title="组织架构图"
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
              刷新
            </Button>
            <Button
              icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
              onClick={toggleFullscreen}
            >
              {isFullscreen ? '退出全屏' : '全屏'}
            </Button>
          </Space>
        }
      >
        {/* 图例 */}
        <div style={{ marginBottom: 16, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#1677ff' }} />
            <span>公司</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#52c41a' }} />
            <span>部门</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#faad14' }} />
            <span>岗位</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#722ed1' }} />
            <span>员工</span>
          </div>
          <div style={{ color: '#999', marginLeft: 'auto' }}>
            点击节点可跳转到对应管理页面
          </div>
        </div>

        {/* 图表容器 */}
        <Spin spinning={chartLoading}>
          {chartData ? (
            <div
              ref={chartRef}
              style={{
                width: '100%',
                height: isFullscreen ? 'calc(100vh - 120px)' : '600px',
                minHeight: 400,
              }}
            />
          ) : (
            !chartLoading && (
              <Empty
                description="暂无组织架构数据"
                style={{ padding: '80px 0' }}
              >
                <Button type="primary" onClick={handleRefresh}>
                  加载数据
                </Button>
              </Empty>
            )
          )}
        </Spin>
      </Card>
    </div>
  );
};

export default OrganizationChartPage;
