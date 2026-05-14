import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Drawer, Form, Input, DatePicker, Button, Space, Tag, Typography,
  Divider, Row, Col, Select, App, Spin, Alert, Popconfirm
} from 'antd';
import {
  SaveOutlined, CheckCircleOutlined, ClockCircleOutlined, PrinterOutlined, DeleteOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { consultationsApi } from '../../api/consultations.api';
import { useAuth } from '../../context/AuthContext';
import VitalsSection from './VitalsSection';

const { TextArea } = Input;
const { Text }     = Typography;

const SOAP = [
  { key: 'subjective',  label: 'S — Subjective',  hint: 'Patient\'s own description of symptoms…' },
  { key: 'objective',   label: 'O — Objective',   hint: 'Clinical findings, examination results…' },
  { key: 'assessment',  label: 'A — Assessment',  hint: 'Diagnosis / differential diagnosis…' },
  { key: 'plan',        label: 'P — Plan',         hint: 'Treatment, referrals, follow-up actions…' },
];

export default function ConsultationDrawer({ open, patientId, consultationId, onClose, onSaved }) {
  const [form]              = Form.useForm();
  const { user }            = useAuth();
  const { message }         = App.useApp();
  const [loading, setLoading]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [saveStatus, setSaveStatus] = useState(''); // '' | 'saving' | 'saved' | 'error'
  const [consult, setConsult]   = useState(null);
  const [localId, setLocalId]   = useState(consultationId || null);
  const autoSaveTimer           = useRef(null);
  const creationPromise         = useRef(null); // prevents duplicate draft creation
  const isNew                   = !consultationId;

  // ── Load existing consultation ──────────────────────
  useEffect(() => {
    if (!open) return;
    setLocalId(consultationId || null);
    setConsult(null);
    form.resetFields();
    setSaveStatus('');
    creationPromise.current = null;

    if (consultationId) {
      setLoading(true);
      consultationsApi.getById(consultationId)
        .then(data => {
          setConsult(data);
          form.setFieldsValue({
            ...data,
            visit_date:      data.visit_date ? dayjs(data.visit_date) : dayjs(),
            follow_up_date:  data.follow_up_date ? dayjs(data.follow_up_date) : null,
          });
        })
        .catch(() => message.error('Failed to load consultation'))
        .finally(() => setLoading(false));
    } else {
      form.setFieldsValue({ visit_date: dayjs() });
    }
  }, [open, consultationId]);

  // ── Auto-save every 30s ─────────────────────────────
  const doAutoSave = useCallback(async () => {
    if (!localId) return;
    const values = form.getFieldsValue();
    setSaveStatus('saving');
    try {
      await consultationsApi.update(localId, flattenValues(values));
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(''), 4000);
    } catch {
      setSaveStatus('error');
    }
  }, [localId, form]);

  const scheduleAutoSave = useCallback(() => {
    clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(doAutoSave, 30_000);
  }, [doAutoSave]);

  useEffect(() => () => clearTimeout(autoSaveTimer.current), []);

  // ── Flatten form values for the API ────────────────
  function flattenValues(v) {
    return {
      ...v,
      visit_date:     v.visit_date?.toISOString()     || null,
      follow_up_date: v.follow_up_date?.format('YYYY-MM-DD') || null,
    };
  }

  // ── Create draft (idempotent — concurrent calls share one promise) ──
  const ensureCreated = useCallback(async () => {
    if (localId) return localId;
    // If a creation is already in flight, wait for it instead of creating a second draft
    if (!creationPromise.current) {
      const values = form.getFieldsValue();
      creationPromise.current = consultationsApi
        .create({ patient_id: patientId, ...flattenValues(values) })
        .then(created => {
          setLocalId(created.id);
          setConsult(created);
          return created.id;
        })
        .finally(() => { creationPromise.current = null; });
    }
    return creationPromise.current;
  }, [localId, patientId, form]);

  const handleChange = useCallback(() => {
    if (!localId) return; // don't auto-save until draft is created
    scheduleAutoSave();
  }, [localId, scheduleAutoSave]);

  // ── Save Draft ──────────────────────────────────────
  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      const id = await ensureCreated();
      const values = form.getFieldsValue();
      const saved = await consultationsApi.update(id, flattenValues(values));
      message.success('Draft saved');
      onSaved?.(saved, false);
      onClose(); // close so list refreshes cleanly; reopen via "Continue"
    } catch (err) {
      message.error(err.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  // ── Mark Complete ───────────────────────────────────
  const handleComplete = async () => {
    try {
      const values = await form.validateFields(['chief_complaint']);
      setSaving(true);
      const id = await ensureCreated();
      const finalData = flattenValues(form.getFieldsValue());
      const saved = await consultationsApi.complete(id, finalData);
      message.success('Consultation completed');
      onSaved?.(saved, true);
      onClose();
    } catch (err) {
      if (err?.errorFields) return;
      message.error(err.response?.data?.error || 'Failed to complete');
    } finally {
      setSaving(false);
    }
  };

  const isComplete = consult?.status === 'complete';
  const canEdit    = !isComplete || user?.role === 'admin';

  const SaveIndicator = () => {
    if (!saveStatus) return null;
    const map = {
      saving: { icon: <ClockCircleOutlined />, text: 'Saving…',    color: '#888' },
      saved:  { icon: <CheckCircleOutlined />, text: 'Saved',      color: '#52c41a' },
      error:  { icon: null,                    text: 'Save failed', color: '#ff4d4f' },
    };
    const s = map[saveStatus];
    return (
      <Text style={{ fontSize: 12, color: s.color }}>
        {s.icon} {s.text}
      </Text>
    );
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={Math.min(860, window.innerWidth - 40)}
      title={
        <Space>
          <span>{isNew ? 'New Consultation' : 'Consultation'}</span>
          {consult?.status && (
            <Tag color={consult.status === 'complete' ? 'green' : 'orange'}>
              {consult.status === 'complete' ? 'Complete' : 'Draft'}
            </Tag>
          )}
          {isComplete && <Tag color="default">Read-only</Tag>}
        </Space>
      }
      extra={<SaveIndicator />}
      footer={
        <Space style={{ justifyContent: 'space-between', width: '100%' }}>
          <Space>
            {localId && (
              <Button
                icon={<PrinterOutlined />}
                onClick={() => window.open(`/print/consultation/${localId}`, '_blank')}
              >
                Print
              </Button>
            )}
            {localId && ['doctor','admin'].includes(user?.role) && (
              <Popconfirm
                title="Delete this consultation?"
                description="This will permanently remove the consultation and its vitals."
                onConfirm={async () => {
                  try {
                    await consultationsApi.delete(localId);
                    message.success('Consultation deleted');
                    onSaved?.();
                    onClose();
                  } catch (err) {
                    message.error(err.response?.data?.error || 'Failed to delete');
                  }
                }}
                okText="Delete"
                okButtonProps={{ danger: true }}
              >
                <Button danger icon={<DeleteOutlined />}>Delete</Button>
              </Popconfirm>
            )}
          </Space>
          {canEdit && (
          <Space>
            <Button onClick={onClose}>Close</Button>
            <Button
              icon={<SaveOutlined />}
              loading={saving}
              onClick={handleSaveDraft}
              disabled={isComplete}
            >
              Save Draft
            </Button>
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              loading={saving}
              onClick={handleComplete}
              disabled={isComplete}
            >
              Mark Complete
            </Button>
          </Space>
          )}
        </Space>
      }
      destroyOnClose
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}><Spin size="large" /></div>
      ) : (
        <Form
          form={form}
          layout="vertical"
          onValuesChange={handleChange}
          disabled={isComplete && user?.role !== 'admin'}
        >
          {isComplete && (
            <Alert
              type="info"
              message="This consultation is complete and locked."
              style={{ marginBottom: 16 }}
              showIcon
            />
          )}

          {/* ── Header row ── */}
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="visit_date"
                label="Visit Date & Time"
                rules={[{ required: true }]}
              >
                <DatePicker showTime format="DD/MM/YYYY HH:mm" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="chief_complaint"
                label="Chief Complaint"
                rules={[{ required: true, message: 'Chief complaint is required to complete' }]}
              >
                <Input placeholder="Reason for visit…" />
              </Form.Item>
            </Col>
          </Row>

          {/* ── Vitals ── */}
          <VitalsSection form={form} />

          {/* ── SOAP Notes ── */}
          <Divider orientation="left" plain style={{ fontSize: 13, color: '#888' }}>
            SOAP Notes
          </Divider>

          {SOAP.map(({ key, label, hint }) => (
            <Form.Item key={key} name={key} label={label}>
              <TextArea
                rows={4}
                placeholder={hint}
                style={{ fontFamily: 'inherit', resize: 'vertical' }}
              />
            </Form.Item>
          ))}

          {/* ── Follow-up ── */}
          <Divider orientation="left" plain style={{ fontSize: 13, color: '#888' }}>
            Follow-up
          </Divider>
          <Row gutter={16}>
            <Col xs={24} sm={8}>
              <Form.Item name="follow_up_date" label="Follow-up Date">
                <div>
                  <Space size={4} wrap style={{ marginBottom: 6 }}>
                    {[
                      { label: '2 wks',   n: 2,  unit: 'week' },
                      { label: '1 month', n: 1,  unit: 'month' },
                      { label: '3 months',n: 3,  unit: 'month' },
                      { label: '1 year',  n: 1,  unit: 'year' },
                    ].map(({ label, n, unit }) => (
                      <Button
                        key={label}
                        size="small"
                        type="dashed"
                        disabled={isComplete && user?.role !== 'admin'}
                        onClick={() => form.setFieldValue('follow_up_date', dayjs().add(n, unit))}
                      >
                        {label}
                      </Button>
                    ))}
                  </Space>
                  <DatePicker
                    format="DD/MM/YYYY"
                    style={{ width: '100%' }}
                    disabledDate={(d) => d?.isBefore(dayjs(), 'day')}
                    value={form.getFieldValue('follow_up_date')}
                    onChange={(v) => form.setFieldValue('follow_up_date', v)}
                  />
                </div>
              </Form.Item>
            </Col>
            <Col xs={24} sm={16}>
              <Form.Item name="follow_up_notes" label="Follow-up Notes">
                <Input placeholder="Instructions for next visit…" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      )}
    </Drawer>
  );
}
