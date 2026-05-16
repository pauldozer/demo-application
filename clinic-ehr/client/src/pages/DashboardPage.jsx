import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Row, Col, Card, Statistic, Typography, Spin, Table,
  DatePicker, Space, Tag, Divider
} from 'antd';
import {
  TeamOutlined, CalendarOutlined, ClockCircleOutlined,
  UserAddOutlined, ArrowRightOutlined, DollarOutlined,
  ExclamationCircleOutlined, RiseOutlined, SunOutlined, MoonOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartTooltip, Legend, ResponsiveContainer
} from 'recharts';
import { statsApi }   from '../api/stats.api';
import { billingApi } from '../api/billing.api';
import { useAuth }    from '../context/AuthContext';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

const fmtUSD = (n) =>
  `$${parseFloat(n || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

const fmtShortDate = (dateStr) => dayjs(dateStr).format('MMM D');

// Custom recharts tooltip
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#fff', border: '1px solid #f0f0f0', borderRadius: 6, padding: '8px 12px', fontSize: 12 }}>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ color: p.color }}>
          {p.name}: <strong>{fmtUSD(p.value)}</strong>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const { user }              = useAuth();
  const navigate              = useNavigate();
  const [stats, setStats]     = useState(null);
  const [revenue, setRevenue] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loadingStats, setLS] = useState(true);
  const [loadingRev,   setLR] = useState(true);
  const [loadingAn,    setLA] = useState(false);
  const [dateRange, setDateRange] = useState([
    dayjs().subtract(29, 'day'),
    dayjs(),
  ]);

  const isAdmin     = user?.role === 'admin';
  const isAssistant = user?.role === 'assistant';
  const isDoctor    = user?.role === 'doctor';

  useEffect(() => {
    statsApi.overview()
      .then(setStats).catch(console.error).finally(() => setLS(false));
    billingApi.revenue()
      .then(setRevenue).catch(console.error).finally(() => setLR(false));
  }, []);

  const loadAnalytics = useCallback(async () => {
    if (!isAdmin || !dateRange[0] || !dateRange[1]) return;
    setLA(true);
    try {
      const data = await billingApi.analytics({
        from: dateRange[0].format('YYYY-MM-DD'),
        to:   dateRange[1].format('YYYY-MM-DD'),
      });
      setAnalytics(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLA(false);
    }
  }, [isAdmin, dateRange]);

  useEffect(() => { loadAnalytics(); }, [loadAnalytics]);

  const statCards = [
    { title: 'Total Patients',          value: stats?.total_patients,       icon: <TeamOutlined />,         color: '#1677ff', onClick: () => navigate('/patients') },
    { title: "Today's Appointments",    value: stats?.today_appointments,   icon: <CalendarOutlined />,     color: '#52c41a', onClick: () => navigate('/calendar') },
    { title: 'Waiting / In Progress',   value: stats?.waiting,              icon: <ClockCircleOutlined />,  color: '#fa8c16', onClick: () => navigate('/queue') },
    { title: 'New Patients Today',      value: stats?.new_today,            icon: <UserAddOutlined />,      color: '#722ed1', onClick: () => navigate('/patients') },
  ];

  const revCards = [
    { title: 'Today',      value: revenue?.today, color: '#52c41a' },
    { title: 'This Week',  value: revenue?.week,  color: '#1677ff' },
    { title: 'This Month', value: revenue?.month, color: '#722ed1' },
  ];

  const drColumns = [
    { title: 'Doctor',          dataIndex: 'doctor_name', key: 'name' },
    { title: 'Today',           dataIndex: 'today',       key: 'today',  render: fmtUSD },
    { title: 'This Week',       dataIndex: 'week',        key: 'week',   render: fmtUSD },
    { title: 'This Month',      dataIndex: 'month',       key: 'month',  render: fmtUSD },
  ];

  // Analytics columns for admin date-range table
  const analyticsDocColumns = [
    { title: 'Doctor',          dataIndex: 'doctor_name',   key: 'name' },
    { title: 'Consultations',   dataIndex: 'count',         key: 'count' },
    { title: 'Revenue',         dataIndex: 'revenue',       key: 'revenue',  render: fmtUSD },
    {
      title: 'Commission (Clinic)',
      dataIndex: 'clinic_share',
      key: 'clinic_share',
      render: (v, r) => (
        <Space size={4}>
          <Text>{fmtUSD(v)}</Text>
          <Tag color="purple" style={{ fontSize: 11 }}>{r.commission_pct}%</Tag>
        </Space>
      )
    },
    { title: 'Doctor Receives', dataIndex: 'doctor_share',  key: 'doctor_share', render: fmtUSD },
  ];

  // Recharts data
  const chartData = (analytics?.daily || []).map(d => ({
    date:  fmtShortDate(d.date),
    Total: d.revenue,
    AM:    d.am_revenue,
    PM:    d.pm_revenue,
  }));

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>
          {greeting()}, {user?.name?.split(' ')[0]}
        </Title>
        <Text type="secondary">
          {new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
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

      {/* ── Revenue section ── */}
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
          <Card size="small" title="Revenue by Doctor" style={{ marginTop: 16, borderRadius: 8 }}>
            <Table
              dataSource={revenue.by_doctor}
              columns={drColumns}
              rowKey="doctor_id"
              size="small"
              pagination={false}
              summary={() => (
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0}><Text strong>Total</Text></Table.Summary.Cell>
                  <Table.Summary.Cell index={1}><Text strong>{fmtUSD(revenue.today)}</Text></Table.Summary.Cell>
                  <Table.Summary.Cell index={2}><Text strong>{fmtUSD(revenue.week)}</Text></Table.Summary.Cell>
                  <Table.Summary.Cell index={3}><Text strong>{fmtUSD(revenue.month)}</Text></Table.Summary.Cell>
                </Table.Summary.Row>
              )}
            />
          </Card>
        )}
      </div>

      {/* ── Financial Analytics — admin only ── */}
      {isAdmin && (
        <div style={{ marginTop: 32 }}>
          <Divider />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
            <Title level={5} style={{ margin: 0 }}>
              <RiseOutlined style={{ color: '#1677ff', marginRight: 8 }} />
              Financial Analytics
            </Title>
            <RangePicker
              value={dateRange}
              onChange={(v) => v && setDateRange(v)}
              format="DD/MM/YYYY"
              allowClear={false}
              presets={[
                { label: 'Last 7 days',  value: [dayjs().subtract(6, 'day'), dayjs()] },
                { label: 'Last 30 days', value: [dayjs().subtract(29, 'day'), dayjs()] },
                { label: 'Last 90 days', value: [dayjs().subtract(89, 'day'), dayjs()] },
                { label: 'This month',   value: [dayjs().startOf('month'), dayjs()] },
                { label: 'This year',    value: [dayjs().startOf('year'), dayjs()] },
              ]}
            />
          </div>

          {loadingAn ? (
            <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>
          ) : (
            <>
              {/* Summary stats for selected period */}
              <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                <Col xs={24} sm={8}>
                  <Card size="small" style={{ borderRadius: 8, textAlign: 'center' }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>Total Collected</Text>
                    <div style={{ fontSize: 24, fontWeight: 700, color: '#52c41a' }}>
                      {fmtUSD(analytics?.total_revenue)}
                    </div>
                    <Text type="secondary" style={{ fontSize: 11 }}>{analytics?.total_count || 0} paid consultations</Text>
                  </Card>
                </Col>
                <Col xs={24} sm={8}>
                  <Card size="small" style={{ borderRadius: 8, textAlign: 'center', borderColor: '#ffe58f' }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      <SunOutlined style={{ color: '#fa8c16', marginRight: 4 }} />AM Sessions
                    </Text>
                    <div style={{ fontSize: 24, fontWeight: 700, color: '#fa8c16' }}>
                      {fmtUSD(analytics?.am_revenue)}
                    </div>
                    <Text type="secondary" style={{ fontSize: 11 }}>{analytics?.am_count || 0} consultations</Text>
                  </Card>
                </Col>
                <Col xs={24} sm={8}>
                  <Card size="small" style={{ borderRadius: 8, textAlign: 'center', borderColor: '#d3adf7' }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      <MoonOutlined style={{ color: '#722ed1', marginRight: 4 }} />PM Sessions
                    </Text>
                    <div style={{ fontSize: 24, fontWeight: 700, color: '#722ed1' }}>
                      {fmtUSD(analytics?.pm_revenue)}
                    </div>
                    <Text type="secondary" style={{ fontSize: 11 }}>{analytics?.pm_count || 0} consultations</Text>
                  </Card>
                </Col>
              </Row>

              {/* Revenue trend chart */}
              {chartData.length > 0 ? (
                <>
                  <Card size="small" title="Daily Revenue Trend" style={{ borderRadius: 8, marginBottom: 16 }}>
                    <ResponsiveContainer width="100%" height={240}>
                      <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                        <RechartTooltip content={<ChartTooltip />} />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <Line type="monotone" dataKey="Total" stroke="#1677ff" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="AM"    stroke="#fa8c16" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
                        <Line type="monotone" dataKey="PM"    stroke="#722ed1" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
                      </LineChart>
                    </ResponsiveContainer>
                  </Card>

                  {/* AM vs PM bar comparison */}
                  <Card size="small" title="AM vs PM Revenue by Day" style={{ borderRadius: 8, marginBottom: 16 }}>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                        <RechartTooltip content={<ChartTooltip />} />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <Bar dataKey="AM" fill="#fa8c16" radius={[3,3,0,0]} />
                        <Bar dataKey="PM" fill="#722ed1" radius={[3,3,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Card>
                </>
              ) : (
                <Card size="small" style={{ borderRadius: 8, marginBottom: 16, textAlign: 'center', padding: 24 }}>
                  <Text type="secondary">No paid consultations in this period</Text>
                </Card>
              )}

              {/* By-doctor breakdown table */}
              {(analytics?.by_doctor?.length || 0) > 0 && (
                <Card size="small" title="Revenue by Doctor" style={{ borderRadius: 8 }}>
                  <Table
                    dataSource={analytics.by_doctor}
                    columns={analyticsDocColumns}
                    rowKey="doctor_id"
                    size="small"
                    pagination={false}
                    summary={() => {
                      const totRevenue = analytics.by_doctor.reduce((s, r) => s + r.revenue, 0);
                      const totClinic  = analytics.by_doctor.reduce((s, r) => s + r.clinic_share, 0);
                      const totDoctor  = analytics.by_doctor.reduce((s, r) => s + r.doctor_share, 0);
                      const totCount   = analytics.by_doctor.reduce((s, r) => s + r.count, 0);
                      return (
                        <Table.Summary.Row>
                          <Table.Summary.Cell index={0}><Text strong>Total</Text></Table.Summary.Cell>
                          <Table.Summary.Cell index={1}><Text strong>{totCount}</Text></Table.Summary.Cell>
                          <Table.Summary.Cell index={2}><Text strong>{fmtUSD(totRevenue)}</Text></Table.Summary.Cell>
                          <Table.Summary.Cell index={3}><Text strong>{fmtUSD(totClinic)}</Text></Table.Summary.Cell>
                          <Table.Summary.Cell index={4}><Text strong>{fmtUSD(totDoctor)}</Text></Table.Summary.Cell>
                        </Table.Summary.Row>
                      );
                    }}
                  />
                </Card>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
