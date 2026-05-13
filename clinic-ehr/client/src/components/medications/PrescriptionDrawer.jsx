import React, { useState } from 'react';
import { Drawer, Form, Input, Button, Select, Space, App } from 'antd';
import { medicationsApi } from '../../api/medications.api';
import { prescriptionsApi } from '../../api/prescriptions.api';

const { TextArea } = Input;

const FREQ_OPTIONS = [
  'Once daily', 'Twice daily', 'Three times daily', 'Four times daily',
  'Every 8 hours', 'Every 12 hours', 'At bedtime', 'As needed (PRN)',
  'Once weekly', 'Twice weekly'
];
const DUR_OPTIONS = [
  '3 days', '5 days', '7 days', '10 days', '14 days',
  '1 month', '2 months', '3 months', '6 months', 'Ongoing / chronic'
];

export default function PrescriptionDrawer({ open, patientId, consultationId, onClose, onAdded }) {
  const [form]                = Form.useForm();
  const { message }           = App.useApp();
  const [saving, setSaving]   = useState(false);
  const [medOptions, setMedOpts] = useState([]);
  const [searching, setSearching] = useState(false);

  const searchMeds = async (q) => {
    if (!q || q.length < 2) return;
    setSearching(true);
    try {
      const meds = await medicationsApi.search(q);
      setMedOpts(meds.map(m => ({
        value: m.id,
        label: `${m.name}${m.strength ? ' ' + m.strength : ''}${m.form ? ' (' + m.form + ')' : ''}`,
        name: m.name
      })));
    } catch { /* silent */ }
    finally { setSearching(false); }
  };

  const handleMedSelect = (val, option) => {
    form.setFieldsValue({ medication_id: val, medication_name: option.name });
  };

  const handleMedSearch = (val) => {
    form.setFieldsValue({ medication_name: val, medication_id: undefined });
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      const rx = await prescriptionsApi.create({
        patient_id:      patientId,
        consultation_id: consultationId || undefined,
        medication_id:   values.medication_id   || undefined,
        medication_name: values.medication_name,
        dosage:          values.dosage          || undefined,
        frequency:       values.frequency       || undefined,
        duration:        values.duration        || undefined,
        instructions:    values.instructions    || undefined,
      });
      message.success(`${rx.medication_name} prescribed`);
      form.resetFields();
      onAdded?.(rx);
      onClose();
    } catch (err) {
      if (err?.errorFields) return;
      message.error(err.response?.data?.error || 'Failed to prescribe');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Prescribe Medication"
      width={520}
      footer={
        <Space style={{ justifyContent: 'flex-end', width: '100%' }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" loading={saving} onClick={handleSubmit}>
            Prescribe
          </Button>
        </Space>
      }
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        {/* Medication name — searchable autocomplete with free-text fallback */}
        <Form.Item
          name="medication_name"
          label="Medication"
          rules={[{ required: true, message: 'Medication name is required' }]}
        >
          <Select
            showSearch
            allowClear
            placeholder="Type medication name…"
            filterOption={false}
            onSearch={(v) => { searchMeds(v); handleMedSearch(v); }}
            onSelect={handleMedSelect}
            loading={searching}
            notFoundContent={null}
            options={medOptions}
            mode={undefined}
          />
        </Form.Item>

        {/* Hidden medication_id for DB link */}
        <Form.Item name="medication_id" hidden><Input /></Form.Item>

        <Form.Item name="dosage" label="Dosage">
          <Input placeholder="e.g. 500mg, 10mg/5ml" />
        </Form.Item>

        <Form.Item name="frequency" label="Frequency">
          <Select
            showSearch
            allowClear
            placeholder="Select or type…"
            options={FREQ_OPTIONS.map(f => ({ value: f, label: f }))}
          />
        </Form.Item>

        <Form.Item name="duration" label="Duration">
          <Select
            showSearch
            allowClear
            placeholder="Select or type…"
            options={DUR_OPTIONS.map(d => ({ value: d, label: d }))}
          />
        </Form.Item>

        <Form.Item name="instructions" label="Instructions / Notes">
          <TextArea rows={3} placeholder="Take with food, avoid alcohol, etc." />
        </Form.Item>
      </Form>
    </Drawer>
  );
}
