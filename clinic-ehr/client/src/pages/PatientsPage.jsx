import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Table, Button, Input, Space, Tag, Typography,
  Card, Avatar, Tooltip, App
} from 'antd';
import {
  UserAddOutlined, SearchOutlined,
  EyeOutlined, EditOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { patientsApi } from '../api/patients.api';
import PatientForm from '../components/patients/PatientForm';

const { Title, Text } = Typography;

const GENDER_COLOR = { male: 'blue', female: 'magenta', other: 'default' };
const GENDER_LABEL = { male: 'M', female: 'F', other: '?' };

export default function PatientsPage() {
  const navigate          = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { message }       = App.useApp();

  const [patients, setPatients]     = useState([]);
  const [total, setTotal]           = useState(0);
  const [loading, setLoading]       = useState(false);
  const [page, setPage]             = useState(1);
  const [searchText, setSearchText] = useState(searchParams.get('q') || '');
  const [showForm, setShowForm]     = useState(false);
  const [editing, setEditing]       = useState(null);
  const debounce                    = useRef(null);

  const load = useCallback(async (q, pg = 1) => {
    setLoading(true);
    try {
      const res = await patientsApi.search({ q, page: pg, limit: 20 });
      setPatients(res.data);
      setTotal(res.total);
    } catch {
      message.error('Failed to load patients');
    } finally {
      setLoading(false);
    }
  }, [message]);

  // Reload when URL query changes (from global header search)
  useEffect(() => {
    const q = searchParams.get('q') || '';
    setSearchText(q);
    setPage(1);
    load(q, 1);
  }, [searchParams.get('q')]); // eslint-disable-line

  const handleSearch = (value) => {
    setSearchText(value);
    clearTimeout(debounce.current);
    debounce.current = setTimeout(() => {
      setPage(1);
      if (value.trim()) setSearchParams({ q: value });
      else setSearchParams({});
    }, 250);
  };

  const handleFormSuccess = (patient, isEdit) => {
    message.success(
      isEdit
        ? 'Patient updated successfully'
        : `Patient ${patient.patient_number} registered`
    );
    setShowForm(false);
    setEditing(null);
    load(searchText, page);
  };

  const columns = [
    {
      title: 'Patient',
      key: 'patient',
      render: (_, r) => (
        <Space>
          <Avatar
            size={36}
            style={{
              background: r.gender === 'female' ? '#eb2f96' : '#1677ff',
              fontSize: 15, fontWeight: 600, flexShrink: 0
            }}
          >
            {r.full_name.charAt(0).toUpperCase()}
          </Avatar>
          <div>
            <div style={{ fontWeight: 500, lineHeight: 1.3 }}>{r.full_name}</div>
            {r.full_name_en && (
              <Text type="secondary" style={{ fontSize: 12 }}>{r.full_name_en}</Text>
            )}
          </div>
        </Space>
      )
    },
    {
      title: 'ID',
      dataIndex: 'patient_number',
      width: 130,
      render: (v) => <Tag style={{ fontFamily: 'monospace' }}>{v}</Tag>
    },
    {
      title: 'Age',
      key: 'age',
      width: 90,
      render: (_, r) => r.dob
        ? <div>
            <div style={{ fontWeight: 500 }}>{r.age} yrs</div>
            <Text type="secondary" style={{ fontSize: 11 }}>
              {dayjs(r.dob).format('DD/MM/YYYY')}
            </Text>
          </div>
        : <Text type="secondary">—</Text>
    },
    {
      title: 'G',
      key: 'gender',
      width: 48,
      align: 'center',
      render: (_, r) => r.gender
        ? <Tag color={GENDER_COLOR[r.gender]} style={{ margin: 0 }}>
            {GENDER_LABEL[r.gender]}
          </Tag>
        : '—'
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      width: 140,
      render: (v) => v || <Text type="secondary">—</Text>
    },
    {
      title: 'Allergies',
      dataIndex: 'allergies',
      width: 200,
      render: (arr) => arr?.length
        ? <Space size={4} wrap>
            {arr.slice(0, 2).map((a, i) => (
              <Tag key={i} color="error" style={{ fontSize: 11 }}>{a}</Tag>
            ))}
            {arr.length > 2 && <Tag style={{ fontSize: 11 }}>+{arr.length - 2}</Tag>}
          </Space>
        : null
    },
    {
      title: 'Conditions',
      dataIndex: 'chronic_conditions',
      render: (arr) => arr?.length
        ? <Space size={4} wrap>
            {arr.slice(0, 2).map((c, i) => (
              <Tag key={i} color="warning" style={{ fontSize: 11 }}>{c}</Tag>
            ))}
            {arr.length > 2 && <Tag style={{ fontSize: 11 }}>+{arr.length - 2}</Tag>}
          </Space>
        : null
    },
    {
      title: '',
      key: 'actions',
      width: 80,
      render: (_, r) => (
        <Space onClick={(e) => e.stopPropagation()}>
          <Tooltip title="View profile">
            <Button
              type="text" size="small" icon={<EyeOutlined />}
              onClick={() => navigate(`/patients/${r.id}`)}
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              type="text" size="small" icon={<EditOutlined />}
              onClick={() => { setEditing(r); setShowForm(true); }}
            />
          </Tooltip>
        </Space>
      )
    }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', marginBottom: 20 }}>
        <Title level={4} style={{ margin: 0 }}>Patients</Title>
        <Button
          type="primary"
          icon={<UserAddOutlined />}
          onClick={() => { setEditing(null); setShowForm(true); }}
        >
          New Patient
        </Button>
      </div>

      <Card styles={{ body: { padding: '16px 24px' } }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <Input
            size="large"
            placeholder="Search by name (Arabic / English), patient ID, or phone…"
            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
            value={searchText}
            onChange={(e) => handleSearch(e.target.value)}
            allowClear
            style={{ maxWidth: 520 }}
          />
          {total > 0 && (
            <Text type="secondary">
              {total.toLocaleString()} patient{total !== 1 ? 's' : ''}
            </Text>
          )}
        </div>

        <Table
          dataSource={patients}
          columns={columns}
          rowKey="id"
          loading={loading}
          size="middle"
          pagination={{
            total,
            current: page,
            pageSize: 20,
            showSizeChanger: false,
            showTotal: (t) => `${t.toLocaleString()} patients`,
            onChange: (pg) => { setPage(pg); load(searchText, pg); }
          }}
          onRow={(record) => ({
            onClick: () => navigate(`/patients/${record.id}`),
            style: { cursor: 'pointer' }
          })}
        />
      </Card>

      <PatientForm
        open={showForm}
        patient={editing}
        onSuccess={handleFormSuccess}
        onCancel={() => { setShowForm(false); setEditing(null); }}
      />
    </div>
  );
}
