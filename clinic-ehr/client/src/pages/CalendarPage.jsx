import React, { useState, useEffect, useCallback } from 'react';
import {
  Button, Select, Space, Typography, Tag, Spin, Tooltip, App, Segmented
} from 'antd';
import {
  LeftOutlined, RightOutlined, PlusOutlined, CalendarOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import { appointmentsApi } from '../api/appointments.api';
import { useAuth }         from '../context/AuthContext';
import { useSocket }       from '../context/SocketContext';
import AppointmentDrawer   from '../components/appointments/AppointmentDrawer';

dayjs.extend(isoWeek);

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
  return Math.floor(((t.hour() - 8) * 60 + t.minute()) / 30);
}

function ApptCard({ appt, onClick }) {
  const s = STATUS[appt.status] || STATUS.scheduled;
  return (
    <Tooltip title={`${appt.patient_name} · ${appt.type || ''} · ${appt.duration_mins}min`}>
      <div
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        style={{
          background: s.bg, border: `1px solid ${s.color}30`,
          borderLeft: `3px solid ${s.color}`, borderRadius: 4,
          padding: '2px 6px', cursor: 'pointer', fontSize: 11,
          lineHeight: '16px', overflow: 'hidden', marginBottom: 2,
        }}
      >
        <div style={{ fontWeight: 600, color: s.color, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {dayjs(appt.scheduled_at).format('HH:mm')} · {appt.patient_name}
        </div>
        <div style={{ color: '#595959', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {appt.type || '—'} · {s.label}
        </div>
      </div>
    </Tooltip>
  );
}

export default function CalendarPage() {
  const { user }          = useAuth();
  const { socket }        = useSocket();
  const { message }       = App.useApp();
  const [view, setView]   = useState('day');           // 'day' | 'week'
  const [date, setDate]   = useState(dayjs());         // selected day (day view) or any day in week (week view)
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading]           = useState(false);
  const [doctors, setDoctors]           = useState([]);
  const [doctorId, setDoctorId]         = useState(user?.role === 'doctor' ? user.id : null);
  const [drawerOpen, setDrawerOpen]     = useState(false);
  const [editAppt, setEditAppt]         = useState(null);
  const [prefillTime, setPrefillTime]   = useState(null);
  const [prefillDay, setPrefillDay]     = useState(null);

  const isDoctor = user?.role === 'doctor';

  useEffect(() => {
    if (!isDoctor) appointmentsApi.doctors().then(setDoctors).catch(() => {});
  }, [isDoctor]);

  // Week start/end (Mon–Sun)
  const weekStart = date.startOf('isoWeek');
  const weekDays  = Array.from({ length: 7 }, (_, i) => weekStart.add(i, 'day'));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = view === 'week'
        ? { from: weekStart.format('YYYY-MM-DD'), to: weekStart.add(6, 'day').format('YYYY-MM-DD') }
        : { date: date.format('YYYY-MM-DD') };
      if (doctorId) params.doctor_id = doctorId;
      setAppointments(await appointmentsApi.list(params));
    } catch {
      message.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  }, [date, view, doctorId, message]);

  useEffect(() => { load(); }, [load]);

  // Real-time Socket.io updates
  useEffect(() => {
    if (!socket) return;
    const handler = ({ date: d, queue }) => {
      const filtered = doctorId ? queue.filter(a => a.doctor_id === doctorId) : queue;
      if (view === 'day' && d === date.format('YYYY-MM-DD')) {
        setAppointments(filtered);
      } else if (view === 'week') {
        // Refresh if the updated date falls in the current week
        const updated = dayjs(d);
        if (!updated.isBefore(weekStart) && !updated.isAfter(weekStart.add(6, 'day'))) {
          load();
        }
      }
    };
    socket.on('queue:updated', handler);
    return () => socket.off('queue:updated', handler);
  }, [socket, date, view, doctorId, weekStart]);

  const openNew = (slot, day) => {
    setEditAppt(null);
    setPrefillTime(slot ? `${String(slot.hour).padStart(2,'0')}:${String(slot.minute).padStart(2,'0')}` : null);
    setPrefillDay(day ? day.format('YYYY-MM-DD') : null);
    setDrawerOpen(true);
  };

  const openEdit = (appt) => {
    setEditAppt(appt);
    setPrefillTime(null);
    setPrefillDay(null);
    setDrawerOpen(true);
  };

  const isToday = (d) => d.isSame(dayjs(), 'day');

  // ── Day View ──────────────────────────────────────────
  const DayView = () => (
    <div style={{ border: '1px solid #f0f0f0', borderRadius: 8, overflow: 'hidden', background: '#fff' }}>
      {SLOTS.map((slot, idx) => {
        const slotAppts = appointments.filter(a => slotIndex(a) === idx);
        const isHour    = slot.minute === 0;
        return (
          <div
            key={idx}
            onClick={() => slotAppts.length === 0 && openNew(slot, date)}
            style={{
              display: 'flex', minHeight: 52,
              borderBottom: idx < SLOTS.length - 1 ? `1px solid ${isHour ? '#e8e8e8' : '#f5f5f5'}` : 'none',
              cursor: slotAppts.length === 0 ? 'pointer' : 'default',
            }}
            onMouseEnter={e => { if (slotAppts.length === 0) e.currentTarget.style.background = '#fafeff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          >
            <div style={{
              width: 64, padding: '6px 12px 6px 16px', flexShrink: 0,
              color: isHour ? '#595959' : '#bfbfbf',
              fontSize: 12, fontWeight: isHour ? 600 : 400,
              borderRight: '1px solid #f0f0f0', display: 'flex', alignItems: 'flex-start',
            }}>
              {slot.label}
            </div>
            <div style={{ flex: 1, padding: '4px 8px', display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
              {slotAppts.length === 0
                ? <Text type="secondary" style={{ fontSize: 11, opacity: 0.4, pointerEvents: 'none' }}>+ click to book</Text>
                : slotAppts.map(a => <ApptCard key={a.id} appt={a} onClick={() => openEdit(a)} />)
              }
            </div>
          </div>
        );
      })}
    </div>
  );

  // ── Week View ─────────────────────────────────────────
  const WeekView = () => (
    <div style={{ border: '1px solid #f0f0f0', borderRadius: 8, overflow: 'auto', background: '#fff' }}>
      {/* Day headers */}
      <div style={{ display: 'flex', borderBottom: '2px solid #e8e8e8', position: 'sticky', top: 0, background: '#fff', zIndex: 1 }}>
        <div style={{ width: 64, flexShrink: 0, borderRight: '1px solid #f0f0f0' }} />
        {weekDays.map((d, i) => (
          <div key={i} style={{
            flex: 1, padding: '8px 4px', textAlign: 'center', minWidth: 100,
            borderRight: i < 6 ? '1px solid #f0f0f0' : 'none',
            background: isToday(d) ? '#e6f4ff' : 'transparent',
          }}>
            <Text style={{ fontSize: 11, color: '#888', display: 'block' }}>
              {d.format('ddd')}
            </Text>
            <Text strong style={{ fontSize: 13, color: isToday(d) ? '#1677ff' : 'inherit' }}>
              {d.format('D MMM')}
            </Text>
          </div>
        ))}
      </div>

      {/* Time rows */}
      {SLOTS.map((slot, idx) => {
        const isHour = slot.minute === 0;
        return (
          <div key={idx} style={{
            display: 'flex', minHeight: 48,
            borderBottom: idx < SLOTS.length - 1 ? `1px solid ${isHour ? '#e8e8e8' : '#f5f5f5'}` : 'none',
          }}>
            {/* Time label */}
            <div style={{
              width: 64, flexShrink: 0, padding: '4px 8px 4px 12px',
              color: isHour ? '#595959' : '#bfbfbf',
              fontSize: 11, fontWeight: isHour ? 600 : 400,
              borderRight: '1px solid #f0f0f0', display: 'flex', alignItems: 'flex-start',
            }}>
              {slot.label}
            </div>

            {/* Day cells */}
            {weekDays.map((day, di) => {
              const dayAppts = appointments.filter(a => {
                const t = dayjs(a.scheduled_at);
                return t.isSame(day, 'day') && slotIndex(a) === idx;
              });
              return (
                <div
                  key={di}
                  onClick={() => dayAppts.length === 0 && openNew(slot, day)}
                  style={{
                    flex: 1, minWidth: 100, padding: '2px 4px',
                    borderRight: di < 6 ? '1px solid #f0f0f0' : 'none',
                    background: isToday(day) ? '#fafeff' : 'transparent',
                    cursor: dayAppts.length === 0 ? 'pointer' : 'default',
                  }}
                  onMouseEnter={e => { if (dayAppts.length === 0) e.currentTarget.style.background = '#f0f7ff'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = isToday(day) ? '#fafeff' : 'transparent'; }}
                >
                  {dayAppts.map(a => <ApptCard key={a.id} appt={a} onClick={() => openEdit(a)} />)}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );

  // Navigation
  const prevPeriod = () => setDate(d => view === 'week' ? d.subtract(1, 'week') : d.subtract(1, 'day'));
  const nextPeriod = () => setDate(d => view === 'week' ? d.add(1, 'week')     : d.add(1, 'day'));
  const goToday    = () => setDate(dayjs());

  const dateLabel = view === 'week'
    ? `${weekStart.format('D MMM')} – ${weekStart.add(6, 'day').format('D MMM YYYY')}`
    : date.format('ddd, D MMM YYYY');

  const isCurrent = view === 'week'
    ? dayjs().isSame(weekStart, 'week')
    : date.isSame(dayjs(), 'day');

  return (
    <div>
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <Space wrap>
          <Button icon={<LeftOutlined />} onClick={prevPeriod} />
          <Title level={4} style={{ margin: 0, minWidth: 220, textAlign: 'center' }}>
            <CalendarOutlined style={{ marginRight: 8, color: '#1677ff' }} />
            {dateLabel}
            {isCurrent && <Tag color="blue" style={{ marginLeft: 8, fontSize: 11 }}>Current</Tag>}
          </Title>
          <Button icon={<RightOutlined />} onClick={nextPeriod} />
          {!isCurrent && <Button size="small" onClick={goToday}>Today</Button>}
        </Space>

        <Space wrap>
          <Segmented
            options={[{ label: 'Day', value: 'day' }, { label: 'Week', value: 'week' }]}
            value={view}
            onChange={setView}
          />
          {!isDoctor && (
            <Select
              style={{ width: 200 }}
              placeholder="All doctors"
              allowClear
              value={doctorId || undefined}
              onChange={(v) => setDoctorId(v ?? null)}
              options={doctors.map(d => ({ value: d.id, label: d.name }))}
            />
          )}
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openNew(null, date)}>
            New Appointment
          </Button>
        </Space>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>
      ) : view === 'week' ? <WeekView /> : <DayView />}

      <AppointmentDrawer
        open={drawerOpen}
        appointment={editAppt}
        prefillDate={prefillDay || date.format('YYYY-MM-DD')}
        prefillTime={prefillTime}
        onClose={() => setDrawerOpen(false)}
        onSaved={load}
      />
    </div>
  );
}
