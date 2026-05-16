import React, { useState, useEffect, useCallback } from 'react';
import {
  List, Button, Tag, Typography, Space, Select, Spin,
  Empty, App, Tooltip, InputNumber
} from 'antd';
import {
  ReloadOutlined, CheckOutlined, UserOutlined,
  ClockCircleOutlined, StopOutlined, WifiOutlined,
  FileTextOutlined, DollarOutlined, CloseOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { appointmentsApi }  from '../api/appointments.api';
import { billingApi }       from '../api/billing.api';
import { useAuth }          from '../context/AuthContext';
import { useSocket }        from '../context/SocketContext';
import ConsultationDrawer   from '../components/consultation/ConsultationDrawer';

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
  const [customInputs, setCustomInputs]   = useState({}); // { apptId: { show: bool, amount: number } }
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

            // Net fee calculation
            const netFee = billing
              ? billing.fee_type === 'free' ? 0
              : billing.fee_type === 'discounted'
                ? parseFloat(billing.fee_amount || 0) - parseFloat(billing.discount_amount || 0)
                : parseFloat(billing.fee_amount || 0)
              : null;

            const commPct      = parseFloat(appt.doctor_commission_pct || 0);
            const clinicShare  = netFee != null && netFee > 0 ? +(netFee * commPct / 100).toFixed(2) : null;
            const doctorShare  = clinicShare != null ? +(netFee - clinicShare).toFixed(2) : null;
            const defaultFee   = parseFloat(appt.doctor_default_fee || 0);

            const fmtUSD = (n) => `$${parseFloat(n || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

            const customInput = customInputs[appt.id] || { show: false, amount: null };

            const quickBillingAction = async (payStatus, feeType, feeAmount) => {
              try {
                // Use passed amount → existing fee → doctor default fee
                const effectiveAmount = feeAmount !== undefined
                  ? feeAmount
                  : (billing?.fee_amount != null ? billing.fee_amount : (defaultFee > 0 ? defaultFee : null));
                const effectiveType = feeType ?? billing?.fee_type ?? (effectiveAmount ? 'custom' : 'full');

                const updated = await billingApi.upsert({
                  appointment_id:  appt.id,
                  fee_type:        effectiveType,
                  fee_amount:      effectiveAmount,
                  discount_amount: billing?.discount_amount ?? null,
                  payment_status:  payStatus,
                });
                setBilling(prev => ({ ...prev, [appt.id]: updated }));
                setCustomInputs(prev => ({ ...prev, [appt.id]: { show: false, amount: null } }));
              } catch {
                message.error('Failed to update billing');
              }
            };

            const handleSetCustom = () => {
              const amt = customInput.amount;
              if (!amt || amt <= 0) { message.warning('Enter a valid amount'); return; }
              quickBillingAction('pending', 'custom', amt);
            };

            // Show action buttons when: no billing OR payment is pending
            const showActions = !billing || billing.payment_status === 'pending';
            // Mark Paid: admin/assistant only
            const showMarkPaid = canEditFree && showActions;
            // Waive + Custom $: doctors can use these too
            const showWaiveAndCustom = showActions;
            // Undo: admin/assistant can undo paid or waived; doctors can only undo waived
            const canUndo = billing && (
              canEditFree
                ? ['paid', 'waived'].includes(billing.payment_status)
                : billing.payment_status === 'waived'
            );

            return (
              <List.Item
                style={{
                  background: '#fff', borderRadius: 8, marginBottom: 8,
                  padding: '12px 16px', border: '1px solid #f0f0f0',
                  opacity: appt.status === 'cancelled' ? 0.5 : 1,
                  flexDirection: 'column', alignItems: 'stretch',
                }}
              >
                {/* ── Top row: patient info + actions ── */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <Space wrap>
                      <Text strong style={{ fontSize: 15 }}>
                        {dayjs(appt.scheduled_at).format('HH:mm')}
                      </Text>
                      <Text strong>{appt.patient_name}</Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>{appt.patient_number}</Text>
                      <Tag color={s.color}>{s.icon} {s.label}</Tag>
                      {appt.type && <Tag>{appt.type}</Tag>}
                    </Space>
                    <div style={{ marginTop: 4 }}>
                      <Space size={16} style={{ fontSize: 12 }}>
                        <Text type="secondary">{appt.doctor_name}</Text>
                        <Text type="secondary">{appt.duration_mins}min</Text>
                        {appt.check_in_time && (
                          <Text type="secondary">In {dayjs(appt.check_in_time).format('HH:mm')}</Text>
                        )}
                        {appt.notes && <Text type="secondary" style={{ fontStyle: 'italic' }}>{appt.notes}</Text>}
                      </Space>
                    </div>
                  </div>

                  {/* Status + workflow actions */}
                  <Space wrap>
                    {/* Admin/assistant control queue status */}
                    {canEditFree && (
                      <Select size="small" value={appt.status} style={{ width: 130 }}
                        options={STATUS_OPTIONS} onChange={(v) => setStatus(appt.id, v)} />
                    )}
                    {/* Doctors open consultation only — no status control */}
                    {isDoctor && ['arrived','in_progress'].includes(appt.status) && (
                      <Button size="small" icon={<FileTextOutlined />}
                        onClick={() => setConsultDrawer({ open: true, patientId: appt.patient_id })}>
                        Consultation
                      </Button>
                    )}
                  </Space>
                </div>

                {/* ── Billing row — always visible ── */}
                <div style={{
                  marginTop: 10, paddingTop: 8,
                  borderTop: '1px dashed #f0f0f0',
                }}>
                  {/* Fee + status line */}
                  <Space wrap style={{ marginBottom: 6 }}>
                    <DollarOutlined style={{ color: '#52c41a', fontSize: 14 }} />

                    {!billing && defaultFee > 0 && (
                      <Text type="secondary" style={{ fontSize: 12 }}>Default: {fmtUSD(defaultFee)}</Text>
                    )}
                    {!billing && defaultFee === 0 && <Text type="secondary" style={{ fontSize: 12 }}>No fee set</Text>}

                    {billing && netFee !== null && (
                      <Text strong style={{ fontSize: 13 }}>
                        {netFee === 0 && billing.fee_type !== 'free' ? '—' : fmtUSD(netFee)}
                      </Text>
                    )}

                    {billing?.payment_status === 'paid'   && <Tag color="green" style={{ fontWeight: 600 }}>✓ Paid</Tag>}
                    {billing?.payment_status === 'waived' && <Tag color="default">Waived by doctor</Tag>}
                    {billing?.payment_status === 'pending' && netFee > 0 && <Tag color="orange">Pending</Tag>}
                    {billing?.fee_type === 'free' && <Tag color="default">Free</Tag>}
                  </Space>

                  {/* Commission split — shown when there's a real fee and commission is set */}
                  {netFee > 0 && commPct > 0 && (
                    <div style={{ marginBottom: 8 }}>
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        Doctor receives: <strong>{fmtUSD(doctorShare)}</strong>
                        &nbsp;·&nbsp;
                        Clinic ({commPct}%): <strong>{fmtUSD(clinicShare)}</strong>
                      </Text>
                    </div>
                  )}

                  {/* Action buttons row */}
                  <Space wrap size={6}>
                    {/* Mark Paid — admin/assistant only */}
                    {showMarkPaid && (
                      <Button size="small" type="primary"
                        style={{ background: '#52c41a', borderColor: '#52c41a' }}
                        onClick={() => quickBillingAction('paid')}>
                        Mark Paid
                      </Button>
                    )}

                    {showWaiveAndCustom && (
                      <>
                        <Tooltip title="Doctor decided not to charge — fee is waived">
                          <Button size="small" onClick={() => quickBillingAction('waived')}>
                            Waive
                          </Button>
                        </Tooltip>

                        {/* Custom amount */}
                        {customInput.show ? (
                          <Space size={4}>
                            <InputNumber
                              size="small"
                              min={0} step={5}
                              placeholder="Amount $"
                              value={customInput.amount}
                              style={{ width: 110 }}
                              prefix="$"
                              onChange={(v) => setCustomInputs(prev => ({
                                ...prev, [appt.id]: { show: true, amount: v }
                              }))}
                              onPressEnter={handleSetCustom}
                              autoFocus
                            />
                            <Button size="small" type="primary" onClick={handleSetCustom}>Set</Button>
                            <Button size="small" icon={<CloseOutlined />}
                              onClick={() => setCustomInputs(prev => ({
                                ...prev, [appt.id]: { show: false, amount: null }
                              }))} />
                          </Space>
                        ) : (
                          <Button size="small"
                            onClick={() => setCustomInputs(prev => ({
                              ...prev, [appt.id]: { show: true, amount: billing?.fee_amount ?? (defaultFee > 0 ? defaultFee : null) }
                            }))}>
                            Custom $
                          </Button>
                        )}
                      </>
                    )}

                    {canUndo && (
                      <Button size="small" type="text" style={{ color: '#bfbfbf', fontSize: 11 }}
                        onClick={() => quickBillingAction('pending')}>
                        Undo
                      </Button>
                    )}
                  </Space>
                </div>
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
