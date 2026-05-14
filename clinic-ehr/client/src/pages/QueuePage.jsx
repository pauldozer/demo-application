import React, { useState, useEffect, useCallback } from 'react';
import {
  List, Button, Tag, Typography, Space, Select, Spin,
  Empty, App, Tooltip
} from 'antd';
import {
  ReloadOutlined, CheckOutlined, UserOutlined,
  ClockCircleOutlined, StopOutlined, WifiOutlined,
  FileTextOutlined, DollarOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { appointmentsApi }  from '../api/appointments.api';
import { billingApi }       from '../api/billing.api';
import { useAuth }          from '../context/AuthContext';
import { useSocket }        from '../context/SocketContext';
import ConsultationDrawer   from '../components/consultation/ConsultationDrawer';
import { BILLING_STATUS_TAG } from '../components/billing/BillingPanel';

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

const STATUS_OPTIONS = [
  { value: 'scheduled',   label: 'Scheduled' },
  { value: 'confirmed',   label: 'Confirmed' },
  { value: 'arrived',     label: 'Arrived' },
  { value: 'in_progress', label: 'With Doctor' },
  { value: 'completed',   label: 'Done' },
  { value: 'no_show',     label: 'No Show' },
  { value: 'cancelled',   label: 'Cancelled' },
];

function countByStatus(list, ...statuses) {
  return list.filter(a => statuses.includes(a.status)).length;
}

export default function QueuePage() {
  const { user }                  = useAuth();
  const { socket, connected }     = useSocket();
  const { message }               = App.useApp();
  const [queue, setQueue]         = useState([]);
  const [billingMap, setBilling]  = useState({});
  const [loading, setLoading]     = useState(false);
  const [doctors, setDoctors]     = useState([]);
  const [doctorId, setDoctorId]   = useState(user?.role === 'doctor' ? user.id : null);
  const [consultDrawer, setConsultDrawer] = useState({ open: false, patientId: null });
  const today = dayjs().format('YYYY-MM-DD');

  const isDoctor    = user?.role === 'doctor';
  const canEditFree = ['admin', 'assistant'].includes(user?.role);

  useEffect(() => {
    if (!isDoctor) appointmentsApi.doctors().then(setDoctors).catch(() => {});
  }, [isDoctor]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await appointmentsApi.queue(today);
      const filtered = doctorId ? data.filter(a => a.doctor_id === doctorId) : data;
      setQueue(filtered);
      // Load billing for each appointment
      const billingResults = await Promise.all(
        filtered.map(a => billingApi.getByAppointment(a.id).catch(() => null))
      );
      const map = {};
      filtered.forEach((a, i) => { if (billingResults[i]) map[a.id] = billingResults[i]; });
      setBilling(map);
    } catch {
      message.error('Failed to load queue');
    } finally {
      setLoading(false);
    }
  }, [today, doctorId, message]);

  useEffect(() => { load(); }, [load]);

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
          <Title level={4} style={{ margin: 0 }}>Today's Queue</Title>
          <Text type="secondary" style={{ fontSize: 13 }}>{dayjs().format('ddd, D MMM YYYY')}</Text>
          <Tooltip title={connected ? 'Live updates active' : 'Disconnected — refresh manually'}>
            <WifiOutlined style={{ color: connected ? '#52c41a' : '#ff4d4f', fontSize: 16 }} />
          </Tooltip>
        </Space>

        <Space wrap>
          {!isDoctor && (
            <Select
              style={{ width: 200 }}
              value={doctorId || ''}
              onChange={(v) => setDoctorId(v || null)}
              options={[
                { value: '', label: 'All Doctors' },
                ...doctors.map(d => ({ value: d.id, label: d.name }))
              ]}
            />
          )}
          <Button icon={<ReloadOutlined />} onClick={load} loading={loading}>
            Refresh
          </Button>
        </Space>
      </div>

      {/* ── Stats ── */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { label: 'Waiting',     count: waiting,    color: '#1677ff' },
          { label: 'With Doctor', count: inProgress, color: '#52c41a' },
          { label: 'Done',        count: done,       color: '#8c8c8c' },
        ].map(({ label, count, color }) => (
          <div key={label} style={{
            flex: 1, minWidth: 100, background: '#fff', borderRadius: 8,
            padding: '12px 20px', border: '1px solid #f0f0f0',
          }}>
            <Text style={{ fontSize: 28, fontWeight: 700, color, lineHeight: 1, display: 'block' }}>{count}</Text>
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
            const isActive = !['completed', 'cancelled', 'no_show'].includes(appt.status);
            const billing  = billingMap[appt.id];

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
                      {billing && BILLING_STATUS_TAG[billing.payment_status]}
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
                      {billing?.fee_type === 'free' && <Text type="secondary"><DollarOutlined /> Free</Text>}
                      {billing?.fee_amount && billing?.fee_type !== 'free' && (
                        <Text type="secondary">
                          <DollarOutlined /> {billing.fee_type === 'discounted'
                            ? `${billing.fee_amount - (billing.discount_amount || 0)} LL`
                            : `${billing.fee_amount} LL`}
                        </Text>
                      )}
                      {appt.notes && <Text type="secondary" style={{ fontStyle: 'italic' }}>{appt.notes}</Text>}
                    </Space>
                  }
                />

                {/* ── Actions ── */}
                <Space wrap style={{ marginLeft: 16 }}>
                  {/* ADMIN/ASSISTANT: full status dropdown — always reversible */}
                  {canEditFree && (
                    <Select
                      size="small"
                      value={appt.status}
                      style={{ width: 130 }}
                      options={STATUS_OPTIONS}
                      onChange={(v) => setStatus(appt.id, v)}
                    />
                  )}

                  {/* DOCTOR: forward-only buttons */}
                  {isDoctor && isActive && (
                    <>
                      {['scheduled', 'confirmed'].includes(appt.status) && (
                        <Button size="small" type="primary" icon={<UserOutlined />}
                          onClick={() => setStatus(appt.id, 'arrived')}>
                          Check In
                        </Button>
                      )}
                      {appt.status === 'arrived' && (
                        <Button size="small" type="primary"
                          style={{ background: '#52c41a', borderColor: '#52c41a' }}
                          icon={<CheckOutlined />}
                          onClick={() => setStatus(appt.id, 'in_progress')}>
                          Start
                        </Button>
                      )}
                      {appt.status === 'in_progress' && (
                        <Button size="small" type="primary"
                          style={{ background: '#8c8c8c', borderColor: '#8c8c8c' }}
                          icon={<CheckOutlined />}
                          onClick={() => setStatus(appt.id, 'completed')}>
                          Done
                        </Button>
                      )}
                    </>
                  )}

                  {/* DOCTOR: open consultation when patient has arrived */}
                  {isDoctor && ['arrived', 'in_progress'].includes(appt.status) && (
                    <Button
                      size="small"
                      icon={<FileTextOutlined />}
                      onClick={() => setConsultDrawer({ open: true, patientId: appt.patient_id })}
                    >
                      Open Consultation
                    </Button>
                  )}
                </Space>
              </List.Item>
            );
          }}
        />
      )}

      {/* Consultation drawer triggered from queue */}
      <ConsultationDrawer
        open={consultDrawer.open}
        patientId={consultDrawer.patientId}
        consultationId={null}
        onClose={() => setConsultDrawer({ open: false, patientId: null })}
        onSaved={() => {}}
      />
    </div>
  );
}
