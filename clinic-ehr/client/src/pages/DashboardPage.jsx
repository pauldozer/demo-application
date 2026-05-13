import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Row, Col, Card, Statistic, Typography, Empty, Spin, Tag } from 'antd';
import {
  TeamOutlined, CalendarOutlined, ClockCircleOutlined,
  UserAddOutlined, ArrowRightOutlined
} from '@ant-design/icons';
import { statsApi } from '../api/stats.api';
import { useAuth } from '../context/AuthContext';

const { Title, Text } = Typography;

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

const STATUS_COLOR = {
  arrived:     'orange',
  in_progress: 'green',
  scheduled:   'blue',
  confirmed:   'geekblue',
};

export default function DashboardPage() {
  const { user }                = useAuth();
  const navigate                = useNavigate();
  const [stats, setStats]       = useState(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    statsApi.overview()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

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

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>
          {greeting()}, {user?.name?.split(' ')[0]} 👋
        </Title>
        <Text type="secondary">
          {new Date().toLocaleDateString('en-GB', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
          })}
        </Text>
      </div>

      {/* ── Stat cards ── */}
      <Row gutter={[16, 16]}>
        {statCards.map((card) => (
          <Col key={card.title} xs={24} sm={12} xl={6}>
            <Card
              hoverable
              onClick={card.onClick}
              style={{ cursor: 'pointer', borderRadius: 8 }}
              styles={{ body: { padding: '20px 24px' } }}
            >
              {loading ? (
                <Spin />
              ) : (
                <Statistic
                  title={card.title}
                  value={card.value ?? '—'}
                  prefix={React.cloneElement(card.icon, { style: { color: card.color } })}
                  valueStyle={{ color: card.color, fontWeight: 600 }}
                  suffix={
                    <ArrowRightOutlined
                      style={{ fontSize: 14, color: '#bfbfbf', marginLeft: 4 }}
                    />
                  }
                />
              )}
            </Card>
          </Col>
        ))}
      </Row>

      {/* ── Placeholder panels ── */}
      <Row gutter={[16, 16]} style={{ marginTop: 20 }}>
        <Col xs={24} lg={12}>
          <Card
            title="Today's Schedule"
            size="small"
            extra={
              <Text type="secondary" style={{ fontSize: 12, cursor: 'pointer' }}
                onClick={() => navigate('/calendar')}>
                View calendar →
              </Text>
            }
          >
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="Appointment calendar coming in Phase 2"
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            title="Waiting Room"
            size="small"
            extra={
              <Text type="secondary" style={{ fontSize: 12, cursor: 'pointer' }}
                onClick={() => navigate('/queue')}>
                View queue →
              </Text>
            }
          >
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="Live queue view coming in Phase 2"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
