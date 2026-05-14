import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Row, Col, Card, Statistic, Typography, Spin, Table } from 'antd';
import {
  TeamOutlined, CalendarOutlined, ClockCircleOutlined,
  UserAddOutlined, ArrowRightOutlined, DollarOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { statsApi }   from '../api/stats.api';
import { billingApi } from '../api/billing.api';
import { useAuth }    from '../context/AuthContext';

const { Title, Text } = Typography;

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

const fmtUSD = (n) =>
  `$${parseFloat(n || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

export default function DashboardPage() {
  const { user }              = useAuth();
  const navigate              = useNavigate();
  const [stats, setStats]     = useState(null);
  const [revenue, setRevenue] = useState(null);
  const [loadingStats, setLS] = useState(true);
  const [loadingRev,   setLR] = useState(true);

  useEffect(() => {
    statsApi.overview()
      .then(setStats).catch(console.error).finally(() => setLS(false));
    billingApi.revenue()
      .then(setRevenue).catch(console.error).finally(() => setLR(false));
  }, []);

  const isAssistant = user?.role === 'assistant';
  const isDoctor    = user?.role === 'doctor';

  const statCards = [
    {
      title: 'Total Patients',
      value: stats?.total_patients,
      icon:  <TeamOutlined />,
      color: '#1677ff',
      onClick: () => navigate('/patients')
    },
    {
      title: "Today's Appointments",
      value: stats?.today_appointments,
      icon:  <CalendarOutlined />,
      color: '#52c41a',
      onClick: () => navigate('/calendar')
    },
    {
      title: 'Waiting / In Progress',
      value: stats?.waiting,
      icon:  <ClockCircleOutlined />,
      color: '#fa8c16',
      onClick: () => navigate('/queue')
    },
    {
      title: 'New Patients Today',
      value: stats?.new_today,
      icon:  <UserAddOutlined />,
      color: '#722ed1',
      onClick: () => navigate('/patients')
    },
  ];

  // Revenue cards (doctor sees own; admin/assistant see clinic total)
  const revCards = [
    { title: 'Today',      value: revenue?.today, color: '#52c41a' },
    { title: 'This Week',  value: revenue?.week,  color: '#1677ff' },
    { title: 'This Month', value: revenue?.month, color: '#722ed1' },
  ];

  // Per-doctor columns for admin/assistant table
  const drColumns = [
    { title: 'Doctor',      dataIndex: 'doctor_name', key: 'name' },
    { title: 'Today',       dataIndex: 'today',       key: 'today',  render: fmtUSD },
    { title: 'This Week',   dataIndex: 'week',        key: 'week',   render: fmtUSD },
    { title: 'This Month',  dataIndex: 'month',       key: 'month',  render: fmtUSD },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>
          {greeting()}, {user?.name?.split(' ')[0]}
        </Title>
        <Text type="secondary">
          {new Date().toLocaleDateString('en-GB', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
          })}
        </Text>
      </div>

      {/* ── Overview stat cards ── */}
      <Row gutter={[16, 16]}>
        {statCards.map((card) => (
          <Col key={card.title} xs={24} sm={12} xl={6}>
            <Card hoverable onClick={card.onClick} style={{ cursor: 'pointer', borderRadius: 8 }}
              styles={{ body: { padding: '20px 24px' } }}>
              {loadingStats ? <Spin /> : (
                <Statistic
                  title={card.title}
                  value={card.value ?? '—'}
                  prefix={React.cloneElement(card.icon, { style: { color: card.color } })}
                  valueStyle={{ color: card.color, fontWeight: 600 }}
                  suffix={<ArrowRightOutlined style={{ fontSize: 14, color: '#bfbfbf', marginLeft: 4 }} />}
                />
              )}
            </Card>
          </Col>
        ))}
      </Row>

      {/* ── Revenue section (doctor or admin/assistant) ── */}
      <div style={{ marginTop: 24 }}>
        <Title level={5} style={{ marginBottom: 12 }}>
          <DollarOutlined style={{ color: '#52c41a', marginRight: 8 }} />
          {isDoctor ? 'My Revenue' : 'Clinic Revenue'}
        </Title>

        <Row gutter={[16, 16]}>
          {revCards.map(({ title, value, color }) => (
            <Col key={title} xs={24} sm={8}>
              <Card size="small" style={{ borderRadius: 8 }}>
                {loadingRev ? <Spin size="small" /> : (
                  <Statistic
                    title={title}
                    value={fmtUSD(value)}
                    valueStyle={{ color, fontWeight: 700, fontSize: 22 }}
                    prefix={<DollarOutlined style={{ display: 'none' }} />}
                  />
                )}
              </Card>
            </Col>
          ))}
        </Row>

        {/* Pending payments alert */}
        {!loadingRev && (revenue?.today_pending || 0) > 0 && (
          <div style={{
            marginTop: 12, padding: '8px 14px', background: '#fff7e6',
            border: '1px solid #ffd591', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 8
          }}>
            <ExclamationCircleOutlined style={{ color: '#fa8c16' }} />
            <Text style={{ fontSize: 13 }}>
              <strong>{revenue.today_pending}</strong> appointment{revenue.today_pending > 1 ? 's' : ''} with pending payment today
            </Text>
          </div>
        )}

        {/* Per-doctor breakdown — admin and assistant only */}
        {!isDoctor && !loadingRev && (revenue?.by_doctor?.length || 0) > 0 && (
          <Card
            size="small"
            title="Revenue by Doctor"
            style={{ marginTop: 16, borderRadius: 8 }}
          >
            <Table
              dataSource={revenue.by_doctor}
              columns={drColumns}
              rowKey="doctor_id"
              size="small"
              pagination={false}
              summary={() => (
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0}><Text strong>Total</Text></Table.Summary.Cell>
                  <Table.Summary.Cell index={1}>
                    <Text strong>{fmtUSD(revenue.today)}</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={2}>
                    <Text strong>{fmtUSD(revenue.week)}</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={3}>
                    <Text strong>{fmtUSD(revenue.month)}</Text>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              )}
            />
          </Card>
        )}
      </div>
    </div>
  );
}
