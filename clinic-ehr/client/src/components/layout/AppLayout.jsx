import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Avatar, Dropdown, Typography, Input, Space, App } from 'antd';
import {
  DashboardOutlined, TeamOutlined, CalendarOutlined,
  MedicineBoxOutlined, SearchOutlined, LogoutOutlined,
  UserOutlined, SettingOutlined, UnorderedListOutlined
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';

const { Sider, Header, Content } = Layout;
const { Text } = Typography;

const NAV_ITEMS = [
  { key: '/dashboard', icon: <DashboardOutlined />,    label: 'Dashboard' },
  { key: '/patients',  icon: <TeamOutlined />,          label: 'Patients' },
  { key: '/calendar',  icon: <CalendarOutlined />,      label: 'Calendar' },
  { key: '/queue',     icon: <UnorderedListOutlined />, label: 'Queue' },
];

const ROLE_COLOR = { admin: '#722ed1', doctor: '#1677ff', assistant: '#52c41a' };

export default function AppLayout() {
  const { user, logout }    = useAuth();
  const navigate            = useNavigate();
  const location            = useLocation();
  const [collapsed, setCol] = useState(false);
  const { message }         = App.useApp();

  const handleSearch = (value) => {
    if (value.trim()) navigate(`/patients?q=${encodeURIComponent(value.trim())}`);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const userMenu = [
    {
      key: 'info',
      label: (
        <div style={{ padding: '4px 0' }}>
          <div style={{ fontWeight: 600 }}>{user?.name}</div>
          <Text type="secondary" style={{ fontSize: 12, textTransform: 'capitalize' }}>
            {user?.role}
          </Text>
        </div>
      ),
      disabled: true
    },
    { type: 'divider' },
    ...(user?.role === 'admin' ? [
      { key: 'users', icon: <SettingOutlined />, label: 'User Management',
        onClick: () => navigate('/users') }
    ] : []),
    { key: 'logout', icon: <LogoutOutlined />, label: 'Sign Out',
      danger: true, onClick: handleLogout }
  ];

  const selectedKey = '/' + location.pathname.split('/')[1];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* ── Sidebar ── */}
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCol}
        width={220}
        style={{ position: 'fixed', inset: '0 auto 0 0', zIndex: 200 }}
      >
        {/* Logo */}
        <div style={{
          height: 64, display: 'flex', alignItems: 'center',
          padding: '0 20px', gap: 10,
          borderBottom: '1px solid rgba(255,255,255,0.08)'
        }}>
          <MedicineBoxOutlined style={{ fontSize: 22, color: '#1677ff', flexShrink: 0 }} />
          {!collapsed && (
            <Text strong style={{ color: '#fff', fontSize: 16, whiteSpace: 'nowrap' }}>
              Clinic EHR
            </Text>
          )}
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={NAV_ITEMS}
          onClick={({ key }) => navigate(key)}
          style={{ marginTop: 8, border: 'none' }}
        />
      </Sider>

      {/* ── Main ── */}
      <Layout style={{ marginLeft: collapsed ? 80 : 220, transition: 'margin 0.2s' }}>
        {/* ── Header ── */}
        <Header style={{
          position: 'sticky', top: 0, zIndex: 100,
          background: '#fff', padding: '0 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid #f0f0f0',
          boxShadow: '0 1px 6px rgba(0,21,41,0.06)'
        }}>
          <Input.Search
            placeholder="Search patients by name, ID, or phone…"
            allowClear
            onSearch={handleSearch}
            style={{ width: 420 }}
            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
          />

          <Dropdown menu={{ items: userMenu }} placement="bottomRight" trigger={['click']}>
            <Space style={{ cursor: 'pointer', userSelect: 'none' }}>
              <Avatar
                size={34}
                style={{ background: ROLE_COLOR[user?.role] || '#1677ff', fontSize: 14 }}
              >
                {user?.name?.charAt(0)?.toUpperCase()}
              </Avatar>
              <Text style={{ fontWeight: 500 }}>{user?.name}</Text>
            </Space>
          </Dropdown>
        </Header>

        {/* ── Content ── */}
        <Content style={{ margin: '24px', minHeight: 'calc(100vh - 112px)' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
