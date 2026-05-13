import React, { useState } from 'react';
import { Drawer, Form, Input, Button, Select, AutoComplete, Space, App } from 'antd';
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
  const [form]                  = Form.useForm();
  const { message }             = App.useApp();
  const [saving, setSaving]     = useState(false);
  const [acOptions, setAcOpts]  = useState([]);
  const [medIdRef, setMedIdRef] = useState(null); // tracks DB id when user picks from list

  // Search medication library for autocomplete suggestions
  const handleMedSearch = async (text) => {
    setMedIdRef(null); // clear any previous selection id when user re-types
    if (!text || text.length < 2) { setAcOpts([]); return; }
    try {
      const meds = await medicationsApi.search(text);
      setAcOpts(meds.map(m => ({
        // value = what gets placed in the text field on select
        value: [m.name, m.strength].filter(Boolean).join(' '),
        label: [m.name, m.strength, m.form && `(${m.form})`].filter(Boolean).join(' '),
        medicationId: m.id
      })));
    } catch { /* silent */ }
  };

  // When user picks a suggestion, capture the linked medication id
  const handleMedSelect = (_, option) => {
    setMedIdRef(option.medicationId);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      const rx = await prescriptionsApi.create({
        patient_id:      patientId,
        consultation_id: consultationId || undefined,
        medication_id:   medIdRef || undefined,       // null if free-text entry
        medication_name: values.medication_name.trim(),
        dosage:          values.dosage       || undefined,
        frequency:       values.frequency    || undefined,
        duration:        values.duration     || undefined,
        instructions:    values.instructions || undefined,
      });
      message.success(`${rx.medication_name} prescribed`);
      form.resetFields();
      setMedIdRef(null);
      setAcOpts([]);
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
        {/* AutoComplete: stores the drug name as plain text, supports free entry */}
        <Form.Item
          name="medication_name"
          label="Medication"
          rules={[{ required: true, message: 'Medication name is required' }]}
          tooltip="Type to search the medication library, or enter any name directly"
        >
          <AutoComplete
            options={acOptions}
            onSearch={handleMedSearch}
            onSelect={handleMedSelect}
            placeholder="e.g. Amoxicillin, Paracetamol 500mg…"
            allowClear
            onClear={() => { setMedIdRef(null); setAcOpts([]); }}
          />
        </Form.Item>

        <Form.Item name="dosage" label="Dosage">
          <Input placeholder="e.g. 500mg, 10mg/5ml, 1 tablet" />
        </Form.Item>

        <Form.Item name="frequency" label="Frequency">
          <Select
            showSearch allowClear
            placeholder="Select or type…"
            options={FREQ_OPTIONS.map(f => ({ value: f, label: f }))}
          />
        </Form.Item>

        <Form.Item name="duration" label="Duration">
          <Select
            showSearch allowClear
            placeholder="Select or type…"
            options={DUR_OPTIONS.map(d => ({ value: d, label: d }))}
          />
        </Form.Item>

        <Form.Item name="instructions" label="Special Instructions">
          <TextArea rows={3} placeholder="Take with food, avoid direct sunlight, etc." />
        </Form.Item>
      </Form>
    </Drawer>
  );
}
