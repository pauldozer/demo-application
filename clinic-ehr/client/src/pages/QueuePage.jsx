import React, { useState, useEffect, useCallback } from 'react';
import {
  List, Button, Tag, Typography, Space, Badge, Select, Spin,
  Empty, Popconfirm, Divider, App, Tooltip
} from 'antd';
import {
  ReloadOutlined, CheckOutlined, UserOutlined,
  ClockCircleOutlined, StopOutlined, WifiOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { appointmentsApi } from '../api/appointments.api';
import { useAuth }         from '../context/AuthContext';
import { useSocket }       from '../context/SocketContext';

const { Text, Title } = Typography;

const STATUS_CFG = {
  scheduled:   { color: 'blue',    label: 'Scheduled',   icon: <ClockCircleOutlined /> },
  confirmed:   { color: 'geekblue',label: 'Confirmed',   icon: <ClockCircleOutlined /> },
  arrived:     { color: 'orange',  label: 'Arrived',     icon: <UserOutlined /> },
  in_progress: { color: 'green',   label: 'With Doctor', icon: <UserOutlined /> },
  completed:   { color: 'default', label: 'Done',        icon: <CheckOutlined /> },
  cancelled:   { color: 'red',     label: 'Cancelled',   icon: <StopOutlined /> },
  no_show:     { color: 'red',     label: 'No Show',     icon: <StopOutlined /> },
};

function countByStatus(list, ...statuses) {
  return list.filter(a => statuses.includes(a.status)).length;
}

export default function QueuePage() {
  const { user }          = useAuth();
  const { socket, connected } = useSocket();
  const { message }       = App.useApp();
  const [queue, setQueue]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [doctorId, setDoctorId] = useState(user?.role === 'doctor' ? user.id : null);
  const today = dayjs().format('YYYY-MM-DD');

  useEffect(() => {
    appointmentsApi.doctors().then(setDoctors).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await appointmentsApi.queue(today);
      const filtered = doctorId ? data.filter(a => a.doctor_id === doctorId) : data;
      setQueue(filtered);
    } catch {
      message.error('Failed to load queue');
    } finally {
      setLoading(false);
    }
  }, [today, doctorId, message]);

  useEffect(() => { load(); }, [load]);

  // Real-time updates
  useEffect(() => {
    if (!socket) return;
    const handler = ({ date: d, queue: q }) => {
      if (d !== today) return;
      const filtered = doctorId ? q.filter(a => a.doctor_id === doctorId) : q;
      setQueue(filtered);
    };
    socket.on('queue:updated', handler);
    return () => socket.off('queue:updated', handler);
  }, [socket, today, doctorId]);

  const setStatus = async (id, status) => {
    try {
      await appointmentsApi.updateStatus(id, status);
      // Queue update comes via socket; do a local optimistic update too
      setQueue(q => q.map(a => a.id === id ? { ...a, status } : a));
    } catch (err) {
      message.error(err.response?.data?.error || 'Failed to update status');
    }
  };

  const waiting    = countByStatus(queue, 'scheduled', 'confirmed', 'arrived');
  const inProgress = countByStatus(queue, 'in_progress');
  const done       = countByStatus(queue, 'completed');

  return (
    <div>
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <Space wrap align="center">
          <Title level={4} style={{ margin: 0 }}>
            Today's Queue
          </Title>
          <Text type="secondary" style={{ fontSize: 13 }}>{dayjs().format('ddd, D MMM YYYY')}</Text>
          <Tooltip title={connected ? 'Live updates active' : 'Disconnected — refresh manually'}>
            <WifiOutlined style={{ color: connected ? '#52c41a' : '#ff4d4f', fontSize: 16 }} />
          </Tooltip>
        </Space>

        <Space wrap>
          <Select
            style={{ width: 200 }}
            placeholder="All doctors"
            allowClear={user?.role !== 'doctor'}
            disabled={user?.role === 'doctor'}
            value={doctorId || undefined}
            onChange={(v) => setDoctorId(v ?? null)}
            options={doctors.map(d => ({ value: d.id, label: d.name }))}
          />
          <Button icon={<ReloadOutlined />} onClick={load} loading={loading}>
            Refresh
          </Button>
        </Space>
      </div>

      {/* ── Stats row ── */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { label: 'Waiting',     count: waiting,    color: '#1677ff' },
          { label: 'With Doctor', count: inProgress, color: '#52c41a' },
          { label: 'Done',        count: done,       color: '#8c8c8c' },
        ].map(({ label, count, color }) => (
          <div key={label} style={{
            flex: 1, minWidth: 100, background: '#fff', borderRadius: 8,
            padding: '12px 20px', border: '1px solid #f0f0f0',
            display: 'flex', flexDirection: 'column', gap: 2
          }}>
            <Text style={{ fontSize: 28, fontWeight: 700, color, lineHeight: 1 }}>{count}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>{label}</Text>
          </div>
        ))}
      </div>

      {/* ── Queue list ── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}><Spin size="large" /></div>
      ) : queue.length === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No appointments today" />
      ) : (
        <List
          dataSource={queue}
          renderItem={(appt) => {
            const s = STATUS_CFG[appt.status] || STATUS_CFG.scheduled;
            const isActive = !['completed','cancelled','no_show'].includes(appt.status);

            return (
              <List.Item
                style={{
                  background: '#fff', borderRadius: 8, marginBottom: 8,
                  padding: '12px 16px', border: '1px solid #f0f0f0',
                  opacity: appt.status === 'cancelled' ? 0.5 : 1,
                }}
              >
                <List.Item.Meta
                  title={
                    <Space wrap>
                      <Text strong style={{ fontSize: 15 }}>
                        {dayjs(appt.scheduled_at).format('HH:mm')}
                      </Text>
                      <Text strong>{appt.patient_name}</Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>{appt.patient_number}</Text>
                      <Tag color={s.color}>{s.icon} {s.label}</Tag>
                      {appt.type && <Tag>{appt.type}</Tag>}
                    </Space>
                  }
                  description={
                    <Space size={16} style={{ fontSize: 12, flexWrap: 'wrap' }}>
                      <Text type="secondary">{appt.doctor_name}</Text>
                      <Text type="secondary">{appt.duration_mins}min</Text>
                      {appt.check_in_time && (
                        <Text type="secondary">
                          Checked in {dayjs(appt.check_in_time).format('HH:mm')}
                        </Text>
                      )}
                      {appt.notes && (
                        <Text type="secondary" style={{ fontStyle: 'italic' }}>{appt.notes}</Text>
                      )}
                    </Space>
                  }
                />

                {/* ── Action buttons ── */}
                {isActive && (
                  <Space wrap style={{ marginLeft: 16 }}>
                    {['scheduled','confirmed'].includes(appt.status) && (
                      <Button
                        size="small"
                        type="primary"
                        icon={<UserOutlined />}
                        onClick={() => setStatus(appt.id, 'arrived')}
                      >
                        Check In
                      </Button>
                    )}

                    {appt.status === 'arrived' && (
                      <Button
                        size="small"
                        type="primary"
                        style={{ background: '#52c41a', borderColor: '#52c41a' }}
                        icon={<CheckOutlined />}
                        onClick={() => setStatus(appt.id, 'in_progress')}
                      >
                        Start
                      </Button>
                    )}

                    {appt.status === 'in_progress' && (
                      <Button
                        size="small"
                        type="primary"
                        style={{ background: '#8c8c8c', borderColor: '#8c8c8c' }}
                        icon={<CheckOutlined />}
                        onClick={() => setStatus(appt.id, 'completed')}
                      >
                        Done
                      </Button>
                    )}

                    {['scheduled','confirmed','arrived'].includes(appt.status) && (
                      <Popconfirm
                        title="Mark as no-show?"
                        onConfirm={() => setStatus(appt.id, 'no_show')}
                        okText="Yes"
                        okButtonProps={{ danger: true }}
                      >
                        <Button size="small" icon={<StopOutlined />}>No Show</Button>
                      </Popconfirm>
                    )}
                  </Space>
                )}
              </List.Item>
            );
          }}
        />
      )}
    </div>
  );
}
