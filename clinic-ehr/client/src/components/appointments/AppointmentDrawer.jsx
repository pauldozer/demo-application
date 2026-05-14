import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Drawer, Form, Select, DatePicker, Button, Space, App, Input, Popconfirm, Modal, Typography
} from 'antd';
import { SaveOutlined, DeleteOutlined, UserAddOutlined } from '@ant-design/icons';

const { Text } = Typography;
import dayjs from 'dayjs';
import { appointmentsApi } from '../../api/appointments.api';
import { patientsApi }     from '../../api/patients.api';
import { useAuth }         from '../../context/AuthContext';
import BillingPanel        from '../billing/BillingPanel';

const DURATIONS = [15, 20, 30, 45, 60].map(m => ({ value: m, label: `${m} min` }));
const TYPES     = ['Follow-up', 'New Patient', 'Procedure', 'Consultation', 'Other'];

export default function AppointmentDrawer({ open, appointment, prefillDate, prefillTime, onClose, onSaved }) {
  const [form]          = Form.useForm();
  const { user }        = useAuth();
  const { message }     = App.useApp();
  const [saving, setSaving]           = useState(false);
  const [cancelling, setCancelling]   = useState(false);
  const [quickOpen, setQuickOpen]     = useState(false);
  const [quickName, setQuickName]     = useState('');
  const [quickPhone, setQuickPhone]   = useState('');
  const [registering, setRegistering] = useState(false);
  const [doctors, setDoctors]         = useState([]);
  const [patientOpts, setPatientOpts] = useState([]);
  const [searching, setSearching]     = useState(false);
  const searchTimer                   = useRef(null);

  const isEdit = !!appointment;

  useEffect(() => {
    appointmentsApi.doctors().then(setDoctors).catch(() => {});
  }, []);

  useEffect(() => {
    if (!open) return;
    form.resetFields();

    if (appointment) {
      form.setFieldsValue({
        patient_id:   appointment.patient_id,
        doctor_id:    appointment.doctor_id,
        scheduled_at: dayjs(appointment.scheduled_at),
        duration_mins: appointment.duration_mins,
        type:         appointment.type,
        notes:        appointment.notes,
      });
      setPatientOpts([{
        value: appointment.patient_id,
        label: `${appointment.patient_name} — ${appointment.patient_number}`,
      }]);
    } else {
      const dateTime =
        prefillDate && prefillTime
          ? dayjs(`${prefillDate} ${prefillTime}`, 'YYYY-MM-DD HH:mm')
          : prefillDate
            ? dayjs(prefillDate).hour(9).minute(0)
            : dayjs().hour(9).minute(0);

      form.setFieldsValue({
        doctor_id:     user?.role === 'doctor' ? user.id : undefined,
        scheduled_at:  dateTime,
        duration_mins: 20,
      });
    }
  }, [open, appointment?.id, prefillDate, prefillTime]);

  const handlePatientSearch = useCallback((q) => {
    clearTimeout(searchTimer.current);
    if (!q || q.length < 2) return;
    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await patientsApi.search({ q, limit: 10 });
        setPatientOpts((res.data || res.patients || []).map(p => ({
          value: p.id,
          label: `${p.full_name} — ${p.patient_number}`,
        })));
      } finally {
        setSearching(false);
      }
    }, 250);
  }, []);

  const handleQuickRegister = async () => {
    if (!quickName.trim()) return;
    setRegistering(true);
    try {
      const patient = await patientsApi.create({
        full_name: quickName.trim(),
        phone:     quickPhone.trim() || undefined,
      });
      const opt = { value: patient.id, label: `${patient.full_name} — ${patient.patient_number}` };
      setPatientOpts(prev => [opt, ...prev]);
      form.setFieldValue('patient_id', patient.id);
      setQuickOpen(false);
      setQuickName('');
      setQuickPhone('');
      message.success(`${patient.full_name} registered as ${patient.patient_number}`);
    } catch {
      message.error('Failed to register patient');
    } finally {
      setRegistering(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      const payload = {
        patient_id:   values.patient_id,
        doctor_id:    values.doctor_id,
        scheduled_at: values.scheduled_at.toISOString(),
        duration_mins: values.duration_mins,
        type:         values.type || null,
        notes:        values.notes || null,
      };

      if (isEdit) {
        await appointmentsApi.update(appointment.id, payload);
        message.success('Appointment updated');
      } else {
        await appointmentsApi.create(payload);
        message.success('Appointment booked');
      }
      onSaved?.();
      onClose();
    } catch (err) {
      if (err?.errorFields) return;
      message.error(err.response?.data?.error || 'Failed to save appointment');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await appointmentsApi.cancel(appointment.id);
      message.success('Appointment cancelled');
      onSaved?.();
      onClose();
    } catch {
      message.error('Failed to cancel appointment');
    } finally {
      setCancelling(false);
    }
  };

  const isCancellable = isEdit && !['completed','cancelled','no_show'].includes(appointment?.status);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Appointment' : 'New Appointment'}
      width={480}
      destroyOnClose
      footer={
        <Space style={{ justifyContent: 'space-between', width: '100%' }}>
          <div>
            {isCancellable && (
              <Popconfirm
                title="Cancel this appointment?"
                onConfirm={handleCancel}
                okText="Yes, cancel"
                okButtonProps={{ danger: true }}
              >
                <Button danger icon={<DeleteOutlined />} loading={cancelling}>
                  Cancel Appointment
                </Button>
              </Popconfirm>
            )}
          </div>
          <Space>
            <Button onClick={onClose}>Close</Button>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              loading={saving}
              onClick={handleSubmit}
              disabled={appointment?.status === 'completed'}
            >
              {isEdit ? 'Save Changes' : 'Book Appointment'}
            </Button>
          </Space>
        </Space>
      }
    >
      <Form form={form} layout="vertical">
        <Form.Item name="patient_id" label="Patient" rules={[{ required: true, message: 'Select a patient' }]}>
          <Select
            showSearch
            filterOption={false}
            onSearch={handlePatientSearch}
            loading={searching}
            options={patientOpts}
            placeholder="Type name, ID, or phone to search…"
            notFoundContent={null}
          />
        </Form.Item>
        <div style={{ marginTop: -16, marginBottom: 16 }}>
          <Button
            type="link"
            size="small"
            icon={<UserAddOutlined />}
            style={{ padding: 0, fontSize: 12 }}
            onClick={() => setQuickOpen(true)}
          >
            Patient doesn't have a profile yet? Quick register
          </Button>
        </div>

        <Form.Item name="doctor_id" label="Doctor" rules={[{ required: true, message: 'Select a doctor' }]}>
          <Select
            options={doctors.map(d => ({ value: d.id, label: d.name }))}
            disabled={user?.role === 'doctor'}
            placeholder="Select doctor"
          />
        </Form.Item>

        <Form.Item name="scheduled_at" label="Date & Time" rules={[{ required: true, message: 'Set date and time' }]}>
          <DatePicker
            showTime={{ format: 'HH:mm', minuteStep: 15 }}
            format="DD/MM/YYYY HH:mm"
            style={{ width: '100%' }}
          />
        </Form.Item>

        <Form.Item name="duration_mins" label="Duration">
          <Select options={DURATIONS} />
        </Form.Item>

        <Form.Item name="type" label="Type">
          <Select
            options={TYPES.map(t => ({ value: t, label: t }))}
            allowClear
            placeholder="Select type"
          />
        </Form.Item>

        <Form.Item name="notes" label="Notes">
          <Input.TextArea rows={3} placeholder="Additional notes…" />
        </Form.Item>
      </Form>

      {/* Billing — shown only for existing appointments */}
      {isEdit && appointment?.id && (
        <BillingPanel
          appointmentId={appointment.id}
          readOnly={appointment?.status === 'completed' && user?.role === 'doctor'}
        />
      )}

      {/* Quick patient registration */}
      <Modal
        open={quickOpen}
        title={<Space><UserAddOutlined />Quick Patient Registration</Space>}
        onCancel={() => { setQuickOpen(false); setQuickName(''); setQuickPhone(''); }}
        onOk={handleQuickRegister}
        okText="Register & Select"
        okButtonProps={{ loading: registering, disabled: !quickName.trim() }}
        width={380}
        destroyOnClose
      >
        <Text type="secondary" style={{ display: 'block', marginBottom: 16, fontSize: 13 }}>
          Creates a minimal patient record. Full details can be completed when the patient arrives.
        </Text>
        <Space direction="vertical" style={{ width: '100%' }} size={12}>
          <div>
            <Text strong style={{ fontSize: 13 }}>Full Name *</Text>
            <Input
              value={quickName}
              onChange={e => setQuickName(e.target.value)}
              placeholder="e.g. محمد علي or Sarah Khalil"
              style={{ marginTop: 4 }}
              autoFocus
              onPressEnter={handleQuickRegister}
            />
          </div>
          <div>
            <Text strong style={{ fontSize: 13 }}>Phone (optional)</Text>
            <Input
              value={quickPhone}
              onChange={e => setQuickPhone(e.target.value)}
              placeholder="+961 xx xxx xxx"
              style={{ marginTop: 4 }}
            />
          </div>
        </Space>
      </Modal>
    </Drawer>
  );
}
