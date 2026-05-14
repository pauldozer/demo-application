import React, { useState, useEffect, useCallback } from 'react';
import {
  Button, Select, Space, Typography, Tag, Spin, Tooltip, App, Badge, Empty
} from 'antd';
import {
  LeftOutlined, RightOutlined, PlusOutlined, CalendarOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { appointmentsApi } from '../api/appointments.api';
import { useAuth }         from '../context/AuthContext';
import { useSocket }       from '../context/SocketContext';
import AppointmentDrawer   from '../components/appointments/AppointmentDrawer';

const { Text, Title } = Typography;

// 8:00 AM – 8:00 PM, every 30 min
const SLOTS = [];
for (let h = 8; h < 20; h++) {
  SLOTS.push({ hour: h, minute: 0,  label: `${String(h).padStart(2,'0')}:00` });
  SLOTS.push({ hour: h, minute: 30, label: `${String(h).padStart(2,'0')}:30` });
}

const STATUS = {
  scheduled:   { color: '#1677ff', bg: '#e6f4ff', label: 'Scheduled' },
  confirmed:   { color: '#2f54eb', bg: '#f0f5ff', label: 'Confirmed' },
  arrived:     { color: '#d46b08', bg: '#fff7e6', label: 'Arrived'   },
  in_progress: { color: '#389e0d', bg: '#f6ffed', label: 'With Doctor' },
  completed:   { color: '#8c8c8c', bg: '#fafafa', label: 'Done'      },
  cancelled:   { color: '#cf1322', bg: '#fff1f0', label: 'Cancelled' },
  no_show:     { color: '#cf1322', bg: '#fff1f0', label: 'No Show'   },
};

function slotIndex(appt) {
  const t = dayjs(appt.scheduled_at);
  const mins = (t.hour() - 8) * 60 + t.minute();
  return Math.floor(mins / 30);
}

function ApptCard({ appt, onClick }) {
  const s = STATUS[appt.status] || STATUS.scheduled;
  return (
    <Tooltip title={`${appt.patient_name} · ${appt.type || ''} · ${appt.duration_mins}min`}>
      <div
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        style={{
          background: s.bg,
          border: `1px solid ${s.color}30`,
          borderLeft: `3px solid ${s.color}`,
          borderRadius: 4,
          padding: '2px 8px',
          cursor: 'pointer',
          fontSize: 12,
          lineHeight: '18px',
          minWidth: 0,
          flex: 1,
          overflow: 'hidden',
        }}
      >
        <div style={{ fontWeight: 600, color: s.color, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {dayjs(appt.scheduled_at).format('HH:mm')} · {appt.patient_name}
        </div>
        <div style={{ color: '#595959', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {appt.type || '—'} · {appt.duration_mins}min
          <span style={{ marginLeft: 6, color: s.color }}>● {s.label}</span>
        </div>
      </div>
    </Tooltip>
  );
}

export default function CalendarPage() {
  const { user }          = useAuth();
  const { socket }        = useSocket();
  const { message }       = App.useApp();
  const [date, setDate]   = useState(dayjs());
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading]           = useState(false);
  const [doctors, setDoctors]           = useState([]);
  const [doctorId, setDoctorId]         = useState(user?.role === 'doctor' ? user.id : null);
  const [drawerOpen, setDrawerOpen]     = useState(false);
  const [editAppt, setEditAppt]         = useState(null);
  const [prefillTime, setPrefillTime]   = useState(null);

  useEffect(() => {
    appointmentsApi.doctors().then(setDoctors).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { date: date.format('YYYY-MM-DD') };
      if (doctorId) params.doctor_id = doctorId;
      setAppointments(await appointmentsApi.list(params));
    } catch {
      message.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  }, [date, doctorId, message]);

  useEffect(() => { load(); }, [load]);

  // Real-time updates
  useEffect(() => {
    if (!socket) return;
    const handler = ({ date: d, queue }) => {
      if (d === date.format('YYYY-MM-DD')) {
        // Apply doctor filter client-side to the broadcast
        const filtered = doctorId ? queue.filter(a => a.doctor_id === doctorId) : queue;
        setAppointments(filtered);
      }
    };
    socket.on('queue:updated', handler);
    return () => socket.off('queue:updated', handler);
  }, [socket, date, doctorId]);

  const openNew = (slot) => {
    setEditAppt(null);
    setPrefillTime(slot ? `${String(slot.hour).padStart(2,'0')}:${String(slot.minute).padStart(2,'0')}` : null);
    setDrawerOpen(true);
  };

  const openEdit = (appt) => {
    setEditAppt(appt);
    setPrefillTime(null);
    setDrawerOpen(true);
  };

  const prevDay  = () => setDate(d => d.subtract(1, 'day'));
  const nextDay  = () => setDate(d => d.add(1, 'day'));
  const today    = () => setDate(dayjs());
  const isToday  = date.isSame(dayjs(), 'day');

  return (
    <div>
      {/* ── Header ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 12, marginBottom: 20
      }}>
        <Space wrap>
          <Button icon={<LeftOutlined />} onClick={prevDay} />
          <Title level={4} style={{ margin: 0, minWidth: 200, textAlign: 'center' }}>
            <CalendarOutlined style={{ marginRight: 8, color: '#1677ff' }} />
            {date.format('ddd, D MMM YYYY')}
            {isToday && <Tag color="blue" style={{ marginLeft: 8, fontSize: 11 }}>Today</Tag>}
          </Title>
          <Button icon={<RightOutlined />} onClick={nextDay} />
          {!isToday && <Button size="small" onClick={today}>Today</Button>}
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
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openNew(null)}>
            New Appointment
          </Button>
        </Space>
      </div>

      {/* ── Day View Grid ── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>
      ) : (
        <div style={{
          border: '1px solid #f0f0f0', borderRadius: 8, overflow: 'hidden',
          background: '#fff'
        }}>
          {SLOTS.map((slot, idx) => {
            const slotAppts = appointments.filter(a => slotIndex(a) === idx);
            const isHour = slot.minute === 0;

            return (
              <div
                key={idx}
                onClick={() => slotAppts.length === 0 && openNew(slot)}
                style={{
                  display: 'flex',
                  minHeight: 52,
                  borderBottom: idx < SLOTS.length - 1 ? `1px solid ${isHour ? '#e8e8e8' : '#f5f5f5'}` : 'none',
                  cursor: slotAppts.length === 0 ? 'pointer' : 'default',
                  background: slotAppts.length === 0 ? 'transparent' : undefined,
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => { if (slotAppts.length === 0) e.currentTarget.style.background = '#fafeff'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
              >
                {/* Time label */}
                <div style={{
                  width: 64, padding: '6px 12px 6px 16px',
                  color: isHour ? '#595959' : '#bfbfbf',
                  fontSize: 12, fontWeight: isHour ? 600 : 400,
                  flexShrink: 0, borderRight: '1px solid #f0f0f0',
                  display: 'flex', alignItems: 'flex-start',
                }}>
                  {slot.label}
                </div>

                {/* Appointment cards or empty area */}
                <div style={{
                  flex: 1, padding: '4px 8px',
                  display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap',
                }}>
                  {slotAppts.length === 0 ? (
                    <Text type="secondary" style={{ fontSize: 11, opacity: 0.4, pointerEvents: 'none' }}>
                      + click to book
                    </Text>
                  ) : (
                    slotAppts.map(a => (
                      <ApptCard key={a.id} appt={a} onClick={() => openEdit(a)} />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AppointmentDrawer
        open={drawerOpen}
        appointment={editAppt}
        prefillDate={date.format('YYYY-MM-DD')}
        prefillTime={prefillTime}
        onClose={() => setDrawerOpen(false)}
        onSaved={load}
      />
    </div>
  );
}
