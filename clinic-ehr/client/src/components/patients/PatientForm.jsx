import React, { useEffect } from 'react';
import {
  Modal, Form, Input, Select, DatePicker,
  Row, Col, Divider, App
} from 'antd';
import dayjs from 'dayjs';
import { patientsApi } from '../../api/patients.api';

const { TextArea } = Input;
const { Option }   = Select;

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const COMMON_ALLERGIES  = [
  'Penicillin', 'Amoxicillin', 'Aspirin', 'Ibuprofen', 'Sulfa drugs', 'Codeine',
  'Latex', 'Peanuts', 'Tree nuts', 'Shellfish', 'Eggs', 'Milk',
  'Contrast dye', 'Iodine', 'Other',
];
const COMMON_CONDITIONS = [
  'Hypertension', 'Diabetes Type 1', 'Diabetes Type 2', 'Hyperlipidemia',
  'Asthma', 'COPD', 'Hypothyroidism', 'Hyperthyroidism',
  'Heart disease / CAD', 'Heart failure', 'Atrial fibrillation',
  'CKD', 'Epilepsy', 'Stroke / TIA', 'Depression', 'Anxiety',
  'GERD', 'Obesity', 'Anemia', 'Other',
];
const COMMON_SURGERIES  = [
  'Appendectomy', 'Cholecystectomy', 'C-section', 'Tonsillectomy',
  'Hernia repair', 'Knee replacement', 'Hip replacement',
  'CABG', 'Hysterectomy', 'Thyroidectomy', 'Prostatectomy',
  'Cataract surgery', 'Spinal surgery', 'Other',
];

export default function PatientForm({ open, patient, onSuccess, onCancel }) {
  const [form]  = Form.useForm();
  const { message } = App.useApp();
  const isEdit  = !!patient?.id;

  useEffect(() => {
    if (!open) return;
    if (patient) {
      form.setFieldsValue({
        ...patient,
        dob: patient.dob ? dayjs(patient.dob) : null,
      });
    } else {
      form.resetFields();
    }
  }, [open, patient, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        ...values,
        dob: values.dob ? values.dob.format('YYYY-MM-DD') : null,
        full_name:  values.full_name?.trim(),
        full_name_en: values.full_name_en?.trim() || null,
      };

      const result = isEdit
        ? await patientsApi.update(patient.id, payload)
        : await patientsApi.create(payload);

      form.resetFields();
      onSuccess(result, isEdit);
    } catch (err) {
      if (err?.errorFields) return; // Ant Design validation error
      message.error(err.response?.data?.error || 'Failed to save patient. Please try again.');
    }
  };

  return (
    <Modal
      open={open}
      title={isEdit ? 'Edit Patient' : 'Register New Patient'}
      onCancel={onCancel}
      onOk={handleOk}
      okText={isEdit ? 'Save Changes' : 'Register Patient'}
      cancelText="Cancel"
      width={760}
      destroyOnClose
      styles={{ body: { paddingTop: 8 } }}
    >
      <Form form={form} layout="vertical" size="middle" requiredMark="optional">

        {/* ── Basic info ── */}
        <Divider orientation="left" plain style={{ marginTop: 4 }}>Basic Information</Divider>

        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              name="full_name"
              label="Full Name (Arabic / Primary)"
              rules={[{ required: true, message: 'Full name is required' }]}
              tooltip="Accepts Arabic, French, or English. This is the primary display name."
            >
              <Input placeholder="e.g. محمد علي  /  Jean Dupont  /  John Smith" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="full_name_en"
              label="Full Name (English / Transliteration)"
              tooltip="Optional English version for search compatibility."
            >
              <Input placeholder="English version (optional)" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} sm={8}>
            <Form.Item name="dob" label="Date of Birth">
              <DatePicker
                format="DD/MM/YYYY"
                placeholder="DD/MM/YYYY"
                style={{ width: '100%' }}
                disabledDate={(d) => d?.isAfter(dayjs())}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item name="gender" label="Gender">
              <Select placeholder="Select" allowClear>
                <Option value="male">Male</Option>
                <Option value="female">Female</Option>
                <Option value="other">Other</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item name="blood_type" label="Blood Type">
              <Select placeholder="Unknown" allowClear>
                {BLOOD_TYPES.map(t => <Option key={t} value={t}>{t}</Option>)}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        {/* ── Contact ── */}
        <Divider orientation="left" plain>Contact</Divider>

        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item name="phone" label="Phone Number">
              <Input placeholder="+961 70 123 456" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item name="phone_alt" label="Alternative Phone">
              <Input placeholder="+961 01 123 456" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="address" label="Address">
          <Input placeholder="City, Area, Street" />
        </Form.Item>

        {/* ── Medical history ── */}
        <Divider orientation="left" plain>Medical History</Divider>

        <Form.Item
          name="allergies"
          label="Allergies"
          tooltip="Type any allergy and press Enter, or pick from common ones."
        >
          <Select
            mode="tags"
            placeholder="Add allergies — type or choose from list"
            tokenSeparators={[',']}
            options={COMMON_ALLERGIES.map(a => ({ value: a, label: a }))}
            allowClear
          />
        </Form.Item>

        <Form.Item
          name="chronic_conditions"
          label="Chronic Conditions"
          tooltip="Type any condition and press Enter, or pick from common ones."
        >
          <Select
            mode="tags"
            placeholder="Add conditions — type or choose from list"
            tokenSeparators={[',']}
            options={COMMON_CONDITIONS.map(c => ({ value: c, label: c }))}
            allowClear
          />
        </Form.Item>

        <Form.Item
          name="past_surgical_history"
          label="Past Surgical History"
          tooltip="Type any surgery and press Enter, or pick from common ones."
        >
          <Select
            mode="tags"
            placeholder="Add surgeries — type or choose from list"
            tokenSeparators={[',']}
            options={COMMON_SURGERIES.map(s => ({ value: s, label: s }))}
            allowClear
          />
        </Form.Item>

        <Form.Item name="notes" label="Notes">
          <TextArea rows={3} placeholder="Any additional notes about this patient…" />
        </Form.Item>

      </Form>
    </Modal>
  );
}
