import React, { useEffect, useState } from 'react';
import {
  Segmented, InputNumber, Select, Input, Space, Typography, Tag, Spin, App
} from 'antd';
import { DollarOutlined } from '@ant-design/icons';
import { billingApi } from '../../api/billing.api';

const { Text } = Typography;

const FEE_TYPES = [
  { value: 'full',       label: 'Full' },
  { value: 'discounted', label: 'Discounted' },
  { value: 'free',       label: 'Free' },
  { value: 'custom',     label: 'Custom' },
];

const PAY_STATUS_OPTS = [
  { value: 'pending', label: 'Pending' },
  { value: 'paid',    label: 'Paid' },
  { value: 'waived',  label: 'Waived' },
];

export const BILLING_STATUS_TAG = {
  pending: <Tag color="orange">Pending</Tag>,
  paid:    <Tag color="green">Paid</Tag>,
  waived:  <Tag color="default">Waived</Tag>,
};

export default function BillingPanel({ appointmentId, readOnly = false }) {
  const { message }       = App.useApp();
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [feeType, setFeeType]     = useState('full');
  const [feeAmount, setFeeAmount] = useState(null);
  const [discount, setDiscount]   = useState(null);
  const [payStatus, setPayStatus] = useState('pending');
  const [notes, setNotes]         = useState('');

  useEffect(() => {
    if (!appointmentId) { setLoading(false); return; }
    billingApi.getByAppointment(appointmentId)
      .then(b => {
        if (b) {
          setFeeType(b.fee_type || 'full');
          setFeeAmount(b.fee_amount ? parseFloat(b.fee_amount) : null);
          setDiscount(b.discount_amount ? parseFloat(b.discount_amount) : null);
          setPayStatus(b.payment_status || 'pending');
          setNotes(b.notes || '');
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [appointmentId]);

  const save = async () => {
    if (!appointmentId) return;
    setSaving(true);
    try {
      await billingApi.upsert({
        appointment_id:  appointmentId,
        fee_type:        feeType,
        fee_amount:      feeType === 'free' ? null : feeAmount,
        discount_amount: feeType === 'discounted' ? discount : null,
        payment_status:  payStatus,
        notes:           notes || null,
      });
      message.success('Billing saved');
    } catch {
      message.error('Failed to save billing');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spin size="small" />;

  return (
    <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 16, marginTop: 8 }}>
      <Space align="center" style={{ marginBottom: 12 }}>
        <DollarOutlined style={{ color: '#52c41a', fontSize: 16 }} />
        <Text strong style={{ fontSize: 14 }}>Billing</Text>
      </Space>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Fee type */}
        <div>
          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
            Fee Type
          </Text>
          <Segmented
            options={FEE_TYPES}
            value={feeType}
            onChange={v => { setFeeType(v); if (!readOnly) save(); }}
            disabled={readOnly}
            size="small"
          />
        </div>

        {/* Amount */}
        {feeType !== 'free' && (
          <Space>
            <div>
              <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                {feeType === 'discounted' ? 'Original Amount' : 'Amount'} (LL)
              </Text>
              <InputNumber
                value={feeAmount}
                onChange={setFeeAmount}
                onBlur={save}
                min={0}
                style={{ width: 120 }}
                placeholder="0"
                disabled={readOnly}
              />
            </div>
            {feeType === 'discounted' && (
              <div>
                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                  Discount (LL)
                </Text>
                <InputNumber
                  value={discount}
                  onChange={setDiscount}
                  onBlur={save}
                  min={0}
                  style={{ width: 120 }}
                  placeholder="0"
                  disabled={readOnly}
                />
              </div>
            )}
          </Space>
        )}

        {/* Payment status */}
        <div>
          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
            Payment Status
          </Text>
          <Select
            value={payStatus}
            options={PAY_STATUS_OPTS}
            onChange={v => { setPayStatus(v); if (!readOnly) setTimeout(save, 0); }}
            style={{ width: 130 }}
            size="small"
            disabled={readOnly}
          />
        </div>

        {/* Notes */}
        {!readOnly && (
          <div>
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
              Notes
            </Text>
            <Input
              value={notes}
              onChange={e => setNotes(e.target.value)}
              onBlur={save}
              placeholder="Optional billing notes…"
              size="small"
            />
          </div>
        )}

        {saving && <Text type="secondary" style={{ fontSize: 11 }}>Saving…</Text>}
      </div>
    </div>
  );
}
