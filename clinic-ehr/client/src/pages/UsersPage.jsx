import React, { useState, useEffect } from 'react';
import {
  Table, Button, Tag, Space, Typography, Card,
  Modal, Form, Input, Select, Switch, App, InputNumber, Tooltip
} from 'antd';
import { UserAddOutlined, KeyOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { usersApi } from '../api/users.api';
import { useAuth } from '../context/AuthContext';

const { Title, Text } = Typography;
const { Option } = Select;

const ROLE_COLOR = { admin: 'purple', doctor: 'blue', assistant: 'green' };

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const { message }           = App.useApp();
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setForm]   = useState(false);
  const [showPwModal, setPw]  = useState(false);
  const [editing, setEdit]    = useState(null);
  const [form]                = Form.useForm();
  const [pwForm]              = Form.useForm();

  if (currentUser?.role !== 'admin') {
    return <div>Access denied.</div>;
  }

  const load = async () => {
    setLoading(true);
    try { setUsers(await usersApi.list()); }
    catch { message.error('Failed to load users'); }
    finally { setLoading(false); }
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
