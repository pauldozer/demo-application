import React from 'react';
import { Row, Col, Form, InputNumber, Divider, Typography, Tag } from 'antd';

const { Text } = Typography;

function calcBMI(w, h) {
  if (!w || !h) return null;
  return (parseFloat(w) / Math.pow(parseFloat(h) / 100, 2)).toFixed(1);
}

function bmiCategory(bmi) {
  if (!bmi) return null;
  const n = parseFloat(bmi);
  if (n < 18.5) return { label: 'Underweight', color: 'blue' };
  if (n < 25)   return { label: 'Normal',      color: 'green' };
  if (n < 30)   return { label: 'Overweight',  color: 'orange' };
  return             { label: 'Obese',         color: 'red' };
}

export default function VitalsSection({ form }) {
  const weight = Form.useWatch('weight_kg', form);
  const height = Form.useWatch('height_cm', form);
  const bmi    = calcBMI(weight, height);
  const cat    = bmiCategory(bmi);

  return (
    <>
      <Divider orientation="left" plain style={{ marginTop: 0, fontSize: 13, color: '#888' }}>
        Vitals
      </Divider>

      <Row gutter={[16, 0]}>
        <Col xs={12} sm={6}>
          <Form.Item name="weight_kg" label="Weight (kg)">
            <InputNumber
              min={0} max={500} precision={1} step={0.5}
              style={{ width: '100%' }}
              placeholder="kg"
            />
          </Form.Item>
        </Col>
        <Col xs={12} sm={6}>
          <Form.Item name="height_cm" label="Height (cm)">
            <InputNumber
              min={0} max={250} precision={1}
              style={{ width: '100%' }}
              placeholder="cm"
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item label="BMI">
            <div style={{
              height: 32, display: 'flex', alignItems: 'center', gap: 8
            }}>
              {bmi
                ? <>
                    <Text strong style={{ fontSize: 16 }}>{bmi}</Text>
                    {cat && <Tag color={cat.color}>{cat.label}</Tag>}
                  </>
                : <Text type="secondary" style={{ fontSize: 12 }}>
                    Enter weight + height
                  </Text>
              }
            </div>
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={[16, 0]}>
        <Col xs={12} sm={6}>
          <Form.Item label="BP Systolic">
            <Form.Item name="bp_systolic" noStyle>
              <InputNumber
                min={0} max={300}
                style={{ width: '100%' }}
                placeholder="mmHg"
                addonAfter="sys"
              />
            </Form.Item>
          </Form.Item>
        </Col>
        <Col xs={12} sm={6}>
          <Form.Item label="BP Diastolic">
            <Form.Item name="bp_diastolic" noStyle>
              <InputNumber
                min={0} max={200}
                style={{ width: '100%' }}
                placeholder="mmHg"
                addonAfter="dia"
              />
            </Form.Item>
          </Form.Item>
        </Col>
        <Col xs={12} sm={4}>
          <Form.Item name="pulse_bpm" label="Pulse">
            <InputNumber min={0} max={300} style={{ width: '100%' }} placeholder="bpm" />
          </Form.Item>
        </Col>
        <Col xs={12} sm={4}>
          <Form.Item name="temp_celsius" label="Temp (°C)">
            <InputNumber min={30} max={45} precision={1} style={{ width: '100%' }} placeholder="°C" />
          </Form.Item>
        </Col>
        <Col xs={12} sm={4}>
          <Form.Item name="o2_sat_pct" label="O₂ Sat (%)">
            <InputNumber min={0} max={100} style={{ width: '100%' }} placeholder="%" />
          </Form.Item>
        </Col>
      </Row>
    </>
  );
}
