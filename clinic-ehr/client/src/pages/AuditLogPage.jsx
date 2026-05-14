import React, { useState, useEffect, useCallback } from 'react';
import {
  Table, Select, DatePicker, Button, Space, Typography, Tag,
  Input, App, Tooltip, Descriptions
} from 'antd';
import { ReloadOutlined, SearchOutlined, AuditOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { auditApi } from '../api/audit.api';

const { Text, Title } = Typography;
const { RangePicker } = DatePicker;

const ENTITY_COLORS = {
  patient:      'blue',
  consultation: 'green',
  appointment:  'orange',
  patient_file: 'purple',
  prescription: 'cyan',
  user:         'volcano',
};

const ACTION_LABELS = {
  create_patient:            'Create Patient',
  update_patient:            'Update Patient',
  delete_patient:            'Delete Patient',
  create_consultation:       'Create Consultation',
  update_consultation:       'Update Consultation',
  complete_consultation:     'Complete Consultation',
  create_prescription:       'Prescribe Medication',
  stop_prescription:         'Stop Medication',
  upload_file:               'Upload File',
  download_file:             'Download File',
  delete_file:               'Delete File',
  create_appointment:        'Book Appointment',
  cancel_appointment:        'Cancel Appointment',
  update_appointment_status: 'Update Appointment Status',
  create_user:               'Create User',
  update_user:               'Update User',
};

const ENTITY_TYPES = ['patient', 'consultation', 'appointment', 'patient_file', 'prescription', 'user'];

export default function AuditLogPage() {
  const { message }    = App.useApp();
  const [logs, setLogs]         = useState([]);
  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(false);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [filters, setFilters]   = useState({
    action: '', entity_type: '', user_id: '', from: '', to: ''
  });

  useEffect(() => {
    auditApi.users().then(setUsers).catch(() => {});
  }, []);

  const load = useCallback(async (p = page) => {
    setLoading(true);
    try {
      const params = { page: p, limit: 50, ...filters };
      Object.keys(params).forEach(k => !params[k] && delete params[k]);
      const res = await auditApi.list(params);
      setLogs(res.logs);
      setTotal(res.total);
    } catch {
      message.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }, [page, filters, message]);

  useEffect(() => { load(1); setPage(1); }, [filters]);
  useEffect(() => { load(page); }, [page]);

  const columns = [
    {
      title: 'When',
      dataIndex: 'created_at',
      width: 160,
      render: (v) => (
        <Tooltip title={dayjs(v).format('DD/MM/YYYY HH:mm:ss')}>
          <Text style={{ fontSize: 13 }}>{dayjs(v).format('DD/MM/YYYY HH:mm')}</Text>
        </Tooltip>
      ),
    },
    {
      title: 'User',
      dataIndex: 'user_name',
      width: 160,
      render: (name, row) => (
        <Space direction="vertical" size={0}>
          <Text style={{ fontSize: 13 }}>{name || '—'}</Text>
          {row.user_role && (
            <Text type="secondary" style={{ fontSize: 11, textTransform: 'capitalize' }}>
              {row.user_role}
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: 'Action',
      dataIndex: 'action',
      width: 200,
      render: (v) => (
        <Text style={{ fontSize: 13 }}>{ACTION_LABELS[v] || v}</Text>
      ),
    },
    {
      title: 'Entity',
      dataIndex: 'entity_type',
      width: 130,
      render: (type, row) => (
        <Space direction="vertical" size={0}>
          {type && (
            <Tag color={ENTITY_COLORS[type] || 'default'} style={{ textTransform: 'capitalize' }}>
              {type.replace('_', ' ')}
            </Tag>
          )}
          {row.entity_id && (
            <Text type="secondary" style={{ fontSize: 10 }}>
              {row.entity_id.slice(0, 8)}…
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: 'IP',
      dataIndex: 'ip_address',
      width: 120,
      render: (v) => <Text type="secondary" style={{ fontSize: 12 }}>{v || '—'}</Text>,
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <Space align="center">
          <AuditOutlined style={{ fontSize: 20, color: '#722ed1' }} />
          <Title level={4} style={{ margin: 0 }}>Audit Log</Title>
          <Text type="secondary" style={{ fontSize: 13 }}>{total} events</Text>
        </Space>
        <Button icon={<ReloadOutlined />} onClick={() => load(page)} loading={loading}>
          Refresh
        </Button>
      </div>

      {/* ── Filters ── */}
      <Space wrap style={{ marginBottom: 16 }}>
        <Input
          prefix={<SearchOutlined />}
          placeholder="Search action…"
          style={{ width: 180 }}
          allowClear
          onChange={(e) => setFilters(f => ({ ...f, action: e.target.value }))}
        />
        <Select
          placeholder="Entity type"
          allowClear
          style={{ width: 160 }}
          options={ENTITY_TYPES.map(t => ({ value: t, label: t.replace('_', ' ') }))}
          onChange={(v) => setFilters(f => ({ ...f, entity_type: v || '' }))}
        />
        <Select
          placeholder="User"
          allowClear
          showSearch
          optionFilterProp="label"
          style={{ width: 180 }}
          options={users.map(u => ({ value: u.id, label: u.name }))}
          onChange={(v) => setFilters(f => ({ ...f, user_id: v || '' }))}
        />
        <RangePicker
          format="DD/MM/YYYY"
          onChange={(dates) => setFilters(f => ({
            ...f,
            from: dates?.[0]?.format('YYYY-MM-DD') || '',
            to:   dates?.[1]?.format('YYYY-MM-DD') || '',
          }))}
        />
      </Space>

      <Table
        rowKey="id"
        dataSource={logs}
        columns={columns}
        loading={loading}
        size="small"
        scroll={{ x: 800 }}
        pagination={{
          current: page,
          total,
          pageSize: 50,
          showSizeChanger: false,
          showTotal: (t) => `${t} events`,
          onChange: (p) => setPage(p),
        }}
        expandable={{
          expandedRowRender: (row) => (
            <Descriptions size="small" column={1} style={{ maxWidth: 600 }}>
              {row.new_values && (
                <Descriptions.Item label="New values">
                  <Text code style={{ fontSize: 11 }}>
                    {JSON.stringify(row.new_values, null, 2)}
                  </Text>
                </Descriptions.Item>
              )}
              {row.old_values && (
                <Descriptions.Item label="Old values">
                  <Text code style={{ fontSize: 11 }}>
                    {JSON.stringify(row.old_values, null, 2)}
                  </Text>
                </Descriptions.Item>
              )}
              {row.entity_id && (
                <Descriptions.Item label="Entity ID">
                  <Text copyable style={{ fontSize: 11 }}>{row.entity_id}</Text>
                </Descriptions.Item>
              )}
            </Descriptions>
          ),
          rowExpandable: (row) => !!(row.new_values || row.old_values || row.entity_id),
        }}
      />
    </div>
  );
}
