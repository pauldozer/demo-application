import React, { useState, useEffect } from 'react';
import {
  Table, Button, Tag, Space, Typography, Card,
  Modal, Form, Input, Select, Switch, App, InputNumber, Tooltip, Divider
} from 'antd';
import { UserAddOutlined, KeyOutlined, PercentageOutlined, SaveOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { usersApi } from '../api/users.api';
import { useAuth } from '../context/AuthContext';

const { Title, Text } = Typography;
const { Option } = Select;

const ROLE_COLOR = { admin: 'purple', doctor: 'blue', assistant: 'green' };

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const { message }           = App.useApp();
  const [users, setUsers]         = useState([]);
  const [loading, setLoading]     = useState(false);
  const [showForm, setForm]       = useState(false);
  const [showPwModal, setPw]      = useState(false);
  const [editing, setEdit]        = useState(null);
  const [form]                    = Form.useForm();
  const [pwForm]                  = Form.useForm();
  // Commission quick-edit state: { [userId]: { commission_pct, default_fee, saving } }
  const [commEdits, setCommEdits] = useState({});

  if (currentUser?.role !== 'admin') {
    return <div>Access denied.</div>;
  }

  const load = async () => {
    setLoading(true);
    try {
      const list = await usersApi.list();
      setUsers(list);
      // Initialise commission quick-edit from loaded data
      const edits = {};
      list.filter(u => u.role === 'doctor').forEach(u => {
        edits[u.id] = {
          commission_pct: parseFloat(u.commission_pct || 0),
          default_fee:    u.default_fee != null ? parseFloat(u.default_fee) : null,
          saving: false,
        };
      });
      setCommEdits(edits);
    }
    catch { message.error('Failed to load users'); }
    finally { setLoading(false); }
  };

  const saveCommission = async (userId) => {
    const edit = commEdits[userId];
    if (!edit) return;
    setCommEdits(prev => ({ ...prev, [userId]: { ...prev[userId], saving: true } }));
    try {
      await usersApi.update(userId, {
        commission_pct: edit.commission_pct,
        default_fee:    edit.default_fee,
      });
      message.success('Commission saved');
      load();
    } catch (err) {
      message.error(err.response?.data?.error || 'Failed to save');
    } finally {
      setCommEdits(prev => ({ ...prev, [userId]: { ...prev[userId], saving: false } }));
    }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line

  const openCreate = () => { setEdit(null); form.resetFields(); setForm(true); };
  const openEdit   = (u) => {
    setEdit(u);
    form.setFieldsValue({
      name:           u.name,
      role:           u.role,
      is_active:      u.is_active,
      commission_pct: parseFloat(u.commission_pct || 0),
      default_fee:    u.default_fee != null ? parseFloat(u.default_fee) : null,
    });
    setForm(true);
  };
  const openPw = (u) => { setEdit(u); pwForm.resetFields(); setPw(true); };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      if (editing) {
        await usersApi.update(editing.id, values);
        message.success('User updated');
      } else {
        await usersApi.create(values);
        message.success('User created');
      }
      setForm(false);
      load();
    } catch (err) {
      if (err?.errorFields) return;
      message.error(err.response?.data?.error || 'Failed to save user');
    }
  };

  const handlePwReset = async () => {
    try {
      const { new_password } = await pwForm.validateFields();
      await usersApi.resetPassword(editing.id, new_password);
      message.success('Password reset successfully');
      setPw(false);
    } catch (err) {
      if (err?.errorFields) return;
      message.error(err.response?.data?.error || 'Failed to reset password');
    }
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      render: (v, r) => (
        <Space>
          <Text strong>{v}</Text>
          {r.id === currentUser.id && <Tag>You</Tag>}
        </Space>
      )
    },
    { title: 'Username', dataIndex: 'username',
      render: (v) => <Text code>{v}</Text> },
    {
      title: 'Role',
      dataIndex: 'role',
      render: (v) => <Tag color={ROLE_COLOR[v]} style={{ textTransform: 'capitalize' }}>{v}</Tag>
    },
    {
      title: 'Commission',
      dataIndex: 'commission_pct',
      width: 110,
      render: (v, r) => r.role === 'doctor'
        ? <Tooltip title="Clinic's share of this doctor's revenue"><Tag color="purple">{parseFloat(v || 0)}%</Tag></Tooltip>
        : <Text type="secondary" style={{ fontSize: 12 }}>—</Text>
    },
    {
      title: 'Default Fee',
      dataIndex: 'default_fee',
      width: 110,
      render: (v, r) => r.role === 'doctor' && v != null
        ? <Text strong style={{ color: '#52c41a' }}>${parseFloat(v).toFixed(0)}</Text>
        : <Text type="secondary" style={{ fontSize: 12 }}>—</Text>
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      width: 90,
      render: (v) => v ? <Tag color="success">Active</Tag> : <Tag>Inactive</Tag>
    },
    {
      title: 'Created',
      dataIndex: 'created_at',
      width: 120,
      render: (v) => dayjs(v).format('DD/MM/YYYY')
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 160,
      render: (_, r) => (
        <Space>
          <Button size="small" onClick={() => openEdit(r)}>Edit</Button>
          <Button size="small" icon={<KeyOutlined />} onClick={() => openPw(r)}>
            Password
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', marginBottom: 20 }}>
        <Title level={4} style={{ margin: 0 }}>User Management</Title>
        <Button type="primary" icon={<UserAddOutlined />} onClick={openCreate}>
          Add User
        </Button>
      </div>

      {/* ── Doctor Commission & Fee Settings ── */}
      {users.filter(u => u.role === 'doctor').length > 0 && (
        <Card
          style={{ marginBottom: 20, borderRadius: 8 }}
          title={
            <Space>
              <PercentageOutlined style={{ color: '#722ed1' }} />
              Doctor Commission & Default Fee
            </Space>
          }
        >
          <Table
            dataSource={users.filter(u => u.role === 'doctor')}
            rowKey="id"
            size="small"
            pagination={false}
            columns={[
              {
                title: 'Doctor',
                dataIndex: 'name',
                render: (v) => <Text strong>{v}</Text>
              },
              {
                title: 'Clinic Commission %',
                key: 'commission_pct',
                width: 200,
                render: (_, r) => (
                  <InputNumber
                    size="small"
                    min={0} max={100} step={5}
                    value={commEdits[r.id]?.commission_pct ?? parseFloat(r.commission_pct || 0)}
                    formatter={v => `${v}%`}
                    parser={v => v.replace('%', '')}
                    style={{ width: 100 }}
                    onChange={(v) => setCommEdits(prev => ({
                      ...prev, [r.id]: { ...prev[r.id], commission_pct: v ?? 0 }
                    }))}
                  />
                )
              },
              {
                title: 'Default Consultation Fee ($)',
                key: 'default_fee',
                width: 220,
                render: (_, r) => (
                  <InputNumber
                    size="small"
                    min={0} step={10}
                    value={commEdits[r.id]?.default_fee ?? (r.default_fee != null ? parseFloat(r.default_fee) : null)}
                    formatter={v => v != null && v !== '' ? `$ ${v}` : ''}
                    parser={v => v.replace(/\$\s?/, '')}
                    placeholder="No default"
                    style={{ width: 130 }}
                    onChange={(v) => setCommEdits(prev => ({
                      ...prev, [r.id]: { ...prev[r.id], default_fee: v }
                    }))}
                  />
                )
              },
              {
                title: '',
                key: 'save',
                width: 80,
                render: (_, r) => (
                  <Button
                    size="small"
                    type="primary"
                    icon={<SaveOutlined />}
                    loading={commEdits[r.id]?.saving}
                    onClick={() => saveCommission(r.id)}
                  >
                    Save
                  </Button>
                )
              },
            ]}
          />
          <div style={{ marginTop: 8, fontSize: 12, color: '#8c8c8c' }}>
            Commission % = the clinic's share of each consultation fee. Doctor receives the remainder.
          </div>
        </Card>
      )}

      <Divider style={{ margin: '0 0 20px' }} />

      <Card styles={{ body: { padding: 0 } }}>
        <Table
          dataSource={users}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={false}
          size="middle"
        />
      </Card>

      {/* ── Create / Edit user ── */}
      <Modal
        open={showForm}
        title={editing ? 'Edit User' : 'Add New User'}
        onOk={handleSave}
        onCancel={() => setForm(false)}
        okText={editing ? 'Save Changes' : 'Create User'}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="name" label="Full Name"
            rules={[{ required: true, message: 'Name is required' }]}>
            <Input placeholder="Dr. Jane Smith" />
          </Form.Item>

          {!editing && (
            <Form.Item name="username" label="Username"
              rules={[
                { required: true, message: 'Username is required' },
                { pattern: /^[a-z0-9._-]+$/, message: 'Lowercase letters, numbers, . _ - only' }
              ]}>
              <Input placeholder="dr.smith" />
            </Form.Item>
          )}

          {!editing && (
            <Form.Item name="password" label="Password"
              rules={[
                { required: true, message: 'Password is required' },
                { min: 8, message: 'At least 8 characters' },
                { pattern: /[A-Z]/, message: 'Must contain an uppercase letter' },
                { pattern: /[0-9]/,  message: 'Must contain a number' },
              ]}>
              <Input.Password placeholder="Minimum 8 characters, 1 uppercase, 1 number" />
            </Form.Item>
          )}

          <Form.Item name="role" label="Role"
            rules={[{ required: true, message: 'Role is required' }]}>
            <Select placeholder="Select role">
              <Option value="doctor">Doctor</Option>
              <Option value="assistant">Assistant / Secretary</Option>
              <Option value="admin">Admin</Option>
            </Select>
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prev, curr) => prev.role !== curr.role}
          >
            {({ getFieldValue }) => getFieldValue('role') === 'doctor' && (
              <>
                <Form.Item
                  name="commission_pct"
                  label="Clinic Commission %"
                  tooltip="Percentage of each consultation fee that goes to the clinic. Doctor receives the remainder."
                  rules={[{ type: 'number', min: 0, max: 100, message: '0–100' }]}
                >
                  <InputNumber
                    min={0} max={100} step={5}
                    formatter={v => `${v}%`}
                    parser={v => v.replace('%', '')}
                    style={{ width: '100%' }}
                    placeholder="e.g. 30 (clinic takes 30%)"
                  />
                </Form.Item>
                <Form.Item
                  name="default_fee"
                  label="Default Consultation Fee ($)"
                  tooltip="Standard fee pre-filled when billing this doctor's appointments. Can be overridden per appointment."
                  rules={[{ type: 'number', min: 0, message: 'Must be 0 or more' }]}
                >
                  <InputNumber
                    min={0} step={10}
                    formatter={v => v ? `$ ${v}` : ''}
                    parser={v => v.replace(/\$\s?/, '')}
                    style={{ width: '100%' }}
                    placeholder="e.g. 80"
                  />
                </Form.Item>
              </>
            )}
          </Form.Item>

          {editing && (
            <Form.Item name="is_active" label="Account Status" valuePropName="checked">
              <Switch
                checkedChildren="Active"
                unCheckedChildren="Inactive"
                disabled={editing?.id === currentUser?.id}
              />
            </Form.Item>
          )}
        </Form>
      </Modal>

      {/* ── Reset password ── */}
      <Modal
        open={showPwModal}
        title={`Reset Password — ${editing?.name}`}
        onOk={handlePwReset}
        onCancel={() => setPw(false)}
        okText="Reset Password"
        destroyOnClose
      >
        <Form form={pwForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="new_password" label="New Password"
            rules={[
              { required: true, message: 'Password is required' },
              { min: 8, message: 'At least 8 characters' },
              { pattern: /[A-Z]/, message: 'Must contain an uppercase letter' },
              { pattern: /[0-9]/,  message: 'Must contain a number' },
            ]}>
            <Input.Password placeholder="New password" />
          </Form.Item>
          <Form.Item name="confirm" label="Confirm Password"
            dependencies={['new_password']}
            rules={[
              { required: true },
              ({ getFieldValue }) => ({
                validator(_, v) {
                  if (!v || getFieldValue('new_password') === v) return Promise.resolve();
                  return Promise.reject('Passwords do not match');
                }
              })
            ]}>
            <Input.Password placeholder="Confirm new password" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
