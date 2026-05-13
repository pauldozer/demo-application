import React, { useState, useEffect, useCallback } from 'react';
import {
  List, Button, Tag, Typography, Space,
  Empty, Spin, Popconfirm, Tabs, App
} from 'antd';
import { PlusOutlined, StopOutlined, MedicineBoxOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { prescriptionsApi } from '../../api/prescriptions.api';
import { useAuth } from '../../context/AuthContext';
import PrescriptionDrawer from './PrescriptionDrawer';

const { Text } = Typography;

export default function MedicationList({ patientId }) {
  const { user }                      = useAuth();
  const { message }                   = App.useApp();
  const [rxList, setRxList]           = useState([]);
  const [loading, setLoading]         = useState(false);
  const [drawerOpen, setDrawerOpen]   = useState(false);

  const canPrescribe = ['doctor', 'admin'].includes(user?.role);

  const load = useCallback(async () => {
    setLoading(true);
    try { setRxList(await prescriptionsApi.listForPatient(patientId)); }
    catch { message.error('Failed to load medications'); }
    finally { setLoading(false); }
  }, [patientId, message]);

  useEffect(() => { load(); }, [load]);

  const handleStop = async (id) => {
    try {
      await prescriptionsApi.stop(id);
      message.success('Medication stopped');
      load();
    } catch {
      message.error('Failed to stop medication');
    }
  };

  const current  = rxList.filter(r => r.is_current);
  const history  = rxList.filter(r => !r.is_current);

  const RxItem = ({ rx, showStop }) => (
    <List.Item
      actions={showStop && canPrescribe ? [
        <Popconfirm
          key="stop"
          title="Mark this medication as stopped?"
          onConfirm={() => handleStop(rx.id)}
          okText="Stop"
          okButtonProps={{ danger: true }}
        >
          <Button type="text" size="small" danger icon={<StopOutlined />}>
            Stop
          </Button>
        </Popconfirm>
      ] : []}
      style={{ padding: '10px 0' }}
    >
      <List.Item.Meta
        avatar={
          <MedicineBoxOutlined
            style={{ fontSize: 18, color: rx.is_current ? '#1677ff' : '#aaa', marginTop: 3 }}
          />
        }
        title={
          <Space wrap>
            <Text strong>{rx.medication_name}</Text>
            {rx.dosage && <Tag>{rx.dosage}</Tag>}
          </Space>
        }
        description={
          <Space direction="vertical" size={2}>
            <Space size={16} style={{ fontSize: 13 }}>
              {rx.frequency && <Text type="secondary">{rx.frequency}</Text>}
              {rx.duration  && <Text type="secondary">for {rx.duration}</Text>}
            </Space>
            {rx.instructions && (
              <Text style={{ fontSize: 12, color: '#888' }}>{rx.instructions}</Text>
            )}
            <Text style={{ fontSize: 11, color: '#bbb' }}>
              Prescribed {dayjs(rx.prescribed_at).format('DD/MM/YYYY')} by Dr. {rx.doctor_name}
              {rx.stopped_at && ` · Stopped ${dayjs(rx.stopped_at).format('DD/MM/YYYY')}`}
            </Text>
          </Space>
        }
      />
    </List.Item>
  );

  if (loading) return <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>;

  return (
    <div>
      {canPrescribe && (
        <div style={{ marginBottom: 16 }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setDrawerOpen(true)}>
            Prescribe
          </Button>
        </div>
      )}

      <Tabs
        size="small"
        items={[
          {
            key: 'current',
            label: `Current (${current.length})`,
            children: current.length === 0
              ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No active medications" />
              : <List dataSource={current} renderItem={(rx) => <RxItem rx={rx} showStop />} />
          },
          {
            key: 'history',
            label: `History (${history.length})`,
            children: history.length === 0
              ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No medication history" />
              : <List dataSource={history} renderItem={(rx) => <RxItem rx={rx} showStop={false} />} />
          }
        ]}
      />

      <PrescriptionDrawer
        open={drawerOpen}
        patientId={patientId}
        onClose={() => setDrawerOpen(false)}
        onAdded={load}
      />
    </div>
  );
}
