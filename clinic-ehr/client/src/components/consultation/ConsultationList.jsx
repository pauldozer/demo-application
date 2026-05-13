import React, { useState, useEffect, useCallback } from 'react';
import { List, Button, Tag, Typography, Space, Empty, Spin, App } from 'antd';
import { PlusOutlined, FileTextOutlined, CheckCircleOutlined, EditOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { consultationsApi } from '../../api/consultations.api';
import { useAuth } from '../../context/AuthContext';
import ConsultationDrawer from './ConsultationDrawer';

const { Text } = Typography;

export default function ConsultationList({ patientId }) {
  const { user }                        = useAuth();
  const { message }                     = App.useApp();
  const [consultations, setConsults]    = useState([]);
  const [loading, setLoading]           = useState(false);
  const [drawerOpen, setDrawerOpen]     = useState(false);
  const [selectedId, setSelectedId]     = useState(null);

  const canCreate = ['doctor', 'admin'].includes(user?.role);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setConsults(await consultationsApi.listForPatient(patientId));
    } catch {
      message.error('Failed to load consultations');
    } finally {
      setLoading(false);
    }
  }, [patientId, message]);

  useEffect(() => { load(); }, [load]);

  const openNew   = () => { setSelectedId(null);  setDrawerOpen(true); };
  const openExist = (id) => { setSelectedId(id);  setDrawerOpen(true); };

  const handleSaved = (consult) => {
    load();
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>;

  return (
    <div>
      {canCreate && (
        <div style={{ marginBottom: 16 }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={openNew}>
            New Consultation
          </Button>
        </div>
      )}

      {consultations.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="No consultations on record"
        />
      ) : (
        <List
          dataSource={consultations}
          renderItem={(c) => (
            <List.Item
              style={{
                background: '#fff', borderRadius: 8, marginBottom: 8,
                padding: '12px 16px', border: '1px solid #f0f0f0',
                cursor: 'pointer'
              }}
              onClick={() => openExist(c.id)}
              actions={[
                <Button
                  key="open"
                  type="text"
                  size="small"
                  icon={c.status === 'complete' ? <FileTextOutlined /> : <EditOutlined />}
                >
                  {c.status === 'complete' ? 'View' : 'Continue'}
                </Button>
              ]}
            >
              <List.Item.Meta
                avatar={
                  c.status === 'complete'
                    ? <CheckCircleOutlined style={{ fontSize: 20, color: '#52c41a', marginTop: 2 }} />
                    : <EditOutlined style={{ fontSize: 20, color: '#fa8c16', marginTop: 2 }} />
                }
                title={
                  <Space wrap>
                    <Text strong>
                      {dayjs(c.visit_date).format('DD/MM/YYYY HH:mm')}
                    </Text>
                    <Tag color={c.status === 'complete' ? 'green' : 'orange'}>
                      {c.status === 'complete' ? 'Complete' : 'Draft'}
                    </Tag>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {c.doctor_name}
                    </Text>
                  </Space>
                }
                description={
                  <Space direction="vertical" size={2}>
                    {c.chief_complaint && (
                      <Text style={{ fontSize: 13 }}>
                        <Text type="secondary">CC: </Text>{c.chief_complaint}
                      </Text>
                    )}
                    {c.assessment && (
                      <Text style={{ fontSize: 13 }}>
                        <Text type="secondary">Dx: </Text>{c.assessment.slice(0, 120)}{c.assessment.length > 120 ? '…' : ''}
                      </Text>
                    )}
                    {(c.weight_kg || c.bp_systolic) && (
                      <Space size={12} style={{ fontSize: 12, color: '#888' }}>
                        {c.weight_kg  && <span>⚖ {c.weight_kg}kg</span>}
                        {c.bmi        && <span>BMI {c.bmi}</span>}
                        {c.bp_systolic && <span>BP {c.bp_systolic}/{c.bp_diastolic}</span>}
                        {c.pulse_bpm  && <span>♥ {c.pulse_bpm}bpm</span>}
                        {c.temp_celsius && <span>🌡 {c.temp_celsius}°C</span>}
                        {c.o2_sat_pct && <span>O₂ {c.o2_sat_pct}%</span>}
                      </Space>
                    )}
                    {c.follow_up_date && (
                      <Text style={{ fontSize: 12, color: '#1677ff' }}>
                        Follow-up: {dayjs(c.follow_up_date).format('DD/MM/YYYY')}
                      </Text>
                    )}
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      )}

      <ConsultationDrawer
        open={drawerOpen}
        patientId={patientId}
        consultationId={selectedId}
        onClose={() => setDrawerOpen(false)}
        onSaved={handleSaved}
      />
    </div>
  );
}
