import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card, Tabs, Descriptions, Tag, Button, Space,
  Typography, Skeleton, Alert, Avatar, Row, Col, App, Popconfirm
} from 'antd';
import {
  ArrowLeftOutlined, EditOutlined, AlertOutlined,
  HeartOutlined, FileTextOutlined, MedicineBoxOutlined,
  FolderOpenOutlined, DeleteOutlined, ScissorOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { patientsApi }       from '../api/patients.api';
import { useAuth }           from '../context/AuthContext';
import PatientForm           from '../components/patients/PatientForm';
import ConsultationList      from '../components/consultation/ConsultationList';
import MedicationList        from '../components/medications/MedicationList';
import FileManager           from '../components/files/FileManager';

const { Title, Text } = Typography;

const GENDER_LABEL = { male: 'Male', female: 'Female', other: 'Other' };
const GENDER_COLOR = { male: 'blue', female: 'magenta', other: 'default' };

export default function PatientDetailPage() {
  const { id }          = useParams();
  const navigate        = useNavigate();
  const { user }        = useAuth();
  const { message }     = App.useApp();
  const [patient, setP] = useState(null);
  const [loading, setL] = useState(true);
  const [showEdit, setE] = useState(false);
  const [deleting, setD] = useState(false);

  const loadPatient = async () => {
    try {
      setP(await patientsApi.getById(id));
    } catch {
      message.error('Patient not found');
      navigate('/patients');
    } finally {
      setL(false);
    }
  };

  useEffect(() => { loadPatient(); }, [id]); // eslint-disable-line

  const handleDelete = async () => {
    setD(true);
    try {
      await patientsApi.delete(id);
      message.success('Patient record permanently deleted');
      navigate('/patients');
    } catch {
      message.error('Failed to delete patient');
      setD(false);
    }
  };

  if (loading) return <Skeleton active paragraph={{ rows: 10 }} />;
  if (!patient) return null;

  const isAssistant = user?.role === 'assistant';

  const tabs = [
    {
      key: 'overview',
      label: <Space><FileTextOutlined />Overview</Space>,
      children: (
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={14}>
            <Card title="Patient Information" size="small">
              <Descriptions column={1} size="small" styles={{ label: { width: 140 } }}>
                <Descriptions.Item label="Patient ID">
                  <Tag style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                    {patient.patient_number}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Full Name">
                  <strong>{patient.full_name}</strong>
                </Descriptions.Item>
                {patient.full_name_en && (
                  <Descriptions.Item label="Name (EN)">
                    {patient.full_name_en}
                  </Descriptions.Item>
                )}
                <Descriptions.Item label="Date of Birth">
                  {patient.dob
                    ? `${dayjs(patient.dob).format('DD/MM/YYYY')}  (${patient.age} years old)`
                    : '—'}
                </Descriptions.Item>
                <Descriptions.Item label="Gender">
                  {patient.gender
                    ? <Tag color={GENDER_COLOR[patient.gender]}>{GENDER_LABEL[patient.gender]}</Tag>
                    : '—'}
                </Descriptions.Item>
                <Descriptions.Item label="Blood Type">
                  {patient.blood_type
                    ? <Tag color="error" style={{ fontWeight: 700 }}>{patient.blood_type}</Tag>
                    : '—'}
                </Descriptions.Item>
                <Descriptions.Item label="Phone">{patient.phone || '—'}</Descriptions.Item>
                {patient.phone_alt && (
                  <Descriptions.Item label="Alt. Phone">{patient.phone_alt}</Descriptions.Item>
                )}
                <Descriptions.Item label="Address">{patient.address || '—'}</Descriptions.Item>
                <Descriptions.Item label="Registered">
                  <Text type="secondary">
                    {dayjs(patient.created_at).format('DD/MM/YYYY')}
                    {patient.created_by_name && ` by ${patient.created_by_name}`}
                  </Text>
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>

          <Col xs={24} lg={10}>
            <Card
              title={<Space><AlertOutlined style={{ color: '#ff4d4f' }} />Allergies</Space>}
              size="small"
              style={{ marginBottom: 12 }}
            >
              {patient.allergies?.length
                ? <Space wrap size={[6, 6]}>
                    {patient.allergies.map((a, i) => <Tag key={i} color="error">{a}</Tag>)}
                  </Space>
                : <Text type="secondary">No known allergies</Text>}
            </Card>

            <Card
              title={<Space><HeartOutlined style={{ color: '#fa8c16' }} />Chronic Conditions</Space>}
              size="small"
              style={{ marginBottom: 12 }}
            >
              {patient.chronic_conditions?.length
                ? <Space wrap size={[6, 6]}>
                    {patient.chronic_conditions.map((c, i) => <Tag key={i} color="warning">{c}</Tag>)}
                  </Space>
                : <Text type="secondary">No chronic conditions</Text>}
            </Card>

            <Card
              title={<Space><ScissorOutlined style={{ color: '#722ed1' }} />Past Surgical History</Space>}
              size="small"
              style={{ marginBottom: 12 }}
            >
              {patient.past_surgical_history?.length
                ? <Space wrap size={[6, 6]}>
                    {patient.past_surgical_history.map((s, i) => <Tag key={i} color="purple">{s}</Tag>)}
                  </Space>
                : <Text type="secondary">No surgical history recorded</Text>}
            </Card>

            {patient.notes && (
              <Card title="Notes" size="small">
                <Text style={{ whiteSpace: 'pre-wrap' }}>{patient.notes}</Text>
              </Card>
            )}
          </Col>
        </Row>
      )
    },
    // Consultations and Medications are hidden from assistants
    ...(!isAssistant ? [
      {
        key: 'consultations',
        label: <Space><FileTextOutlined />Consultations</Space>,
        children: <ConsultationList patientId={id} />
      },
      {
        key: 'medications',
        label: <Space><MedicineBoxOutlined />Medications</Space>,
        children: <MedicationList patientId={id} />
      },
    ] : []),
    {
      key: 'files',
      label: <Space><FolderOpenOutlined />Files & Labs</Space>,
      children: <FileManager patientId={id} />
    }
  ];

  return (
    <div>
      {/* ── Header ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 14,
        marginBottom: 20, flexWrap: 'wrap'
      }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/patients')} />

        <Avatar
          size={52}
          style={{
            background: patient.gender === 'female' ? '#eb2f96' : '#1677ff',
            fontSize: 20, fontWeight: 700
          }}
        >
          {patient.full_name.charAt(0).toUpperCase()}
        </Avatar>

        <div style={{ flex: 1, minWidth: 0 }}>
          <Title level={4} style={{ margin: 0, whiteSpace: 'nowrap' }}>{patient.full_name}</Title>
          <Space wrap size={6}>
            <Tag style={{ fontFamily: 'monospace' }}>{patient.patient_number}</Tag>
            {patient.gender && (
              <Tag color={GENDER_COLOR[patient.gender]}>{GENDER_LABEL[patient.gender]}</Tag>
            )}
            {patient.blood_type && (
              <Tag color="error" style={{ fontWeight: 700 }}>{patient.blood_type}</Tag>
            )}
            {patient.dob && <Text type="secondary">{patient.age} years old</Text>}
          </Space>
        </div>

        <Space>
          <Button icon={<EditOutlined />} onClick={() => setE(true)}>Edit</Button>
          {user?.role === 'admin' && (
            <Popconfirm
              title="Permanently delete this patient?"
              description="This will remove all consultations, files, and medical records. This cannot be undone."
              onConfirm={handleDelete}
              okText="Delete permanently"
              okButtonProps={{ danger: true, loading: deleting }}
              cancelText="Cancel"
            >
              <Button danger icon={<DeleteOutlined />} loading={deleting}>
                Delete Patient
              </Button>
            </Popconfirm>
          )}
        </Space>
      </div>

      {/* ── Allergy banner ── */}
      {patient.allergies?.length > 0 && (
        <Alert
          type="error"
          showIcon
          icon={<AlertOutlined />}
          message={
            <span>
              <strong>ALLERGIES: </strong>
              {patient.allergies.join(' · ')}
            </span>
          }
          style={{ marginBottom: 16, fontWeight: 500 }}
          banner
        />
      )}

      <Tabs items={tabs} size="middle" />

      <PatientForm
        open={showEdit}
        patient={patient}
        onSuccess={(updated) => { setP(updated); setE(false); message.success('Patient updated'); }}
        onCancel={() => setE(false)}
      />
    </div>
  );
}
