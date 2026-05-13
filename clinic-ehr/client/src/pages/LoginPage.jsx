import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, Alert, Space } from 'antd';
import { UserOutlined, LockOutlined, MedicineBoxOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';

const { Title, Text } = Typography;

export default function LoginPage() {
  const { user, login }     = useAuth();
  const navigate            = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');

  if (user) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async ({ username, password }) => {
    setLoading(true);
    setError('');
    try {
      await login(username, password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1677ff 0%, #003eb3 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Header */}
        <Space direction="vertical" align="center" style={{ width: '100%', marginBottom: 32 }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <MedicineBoxOutlined style={{ fontSize: 36, color: '#fff' }} />
          </div>
          <Title level={2} style={{ color: '#fff', margin: 0 }}>Clinic EHR</Title>
          <Text style={{ color: 'rgba(255,255,255,0.75)' }}>
            Electronic Health Records
          </Text>
        </Space>

        {/* Card */}
        <Card
          style={{ borderRadius: 12, boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}
          styles={{ body: { padding: '36px 40px 28px' } }}
        >
          <Title level={4} style={{ margin: '0 0 24px', textAlign: 'center' }}>
            Sign in to your account
          </Title>

          {error && (
            <Alert
              message={error}
              type="error"
              showIcon
              closable
              onClose={() => setError('')}
              style={{ marginBottom: 20 }}
            />
          )}

          <Form layout="vertical" onFinish={handleSubmit} size="large" autoComplete="on">
            <Form.Item
              name="username"
              rules={[{ required: true, message: 'Please enter your username' }]}
            >
              <Input
                prefix={<UserOutlined style={{ color: '#bfbfbf' }} />}
                placeholder="Username"
                autoComplete="username"
                autoFocus
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: 'Please enter your password' }]}
              style={{ marginBottom: 24 }}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
                placeholder="Password"
                autoComplete="current-password"
              />
            </Form.Item>

            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              style={{ height: 44, fontSize: 15 }}
            >
              Sign In
            </Button>
          </Form>
        </Card>

        <Text style={{ display: 'block', textAlign: 'center', color: 'rgba(255,255,255,0.5)',
                       marginTop: 24, fontSize: 12 }}>
          Secure local network access only
        </Text>
      </div>
    </div>
  );
}
