import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Spin, Button, Space } from 'antd';
import { PrinterOutlined, CloseOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { consultationsApi } from '../api/consultations.api';
import { patientsApi }      from '../api/patients.api';
import { prescriptionsApi } from '../api/prescriptions.api';

export default function PrintConsultationPage() {
  const { id } = useParams();
  const [consult,  setConsult]  = useState(null);
  const [patient,  setPatient]  = useState(null);
  const [rxList,   setRxList]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');

  useEffect(() => {
    (async () => {
      try {
        const c = await consultationsApi.getById(id);
        setConsult(c);
        const [p, allRx] = await Promise.all([
          patientsApi.getById(c.patient_id),
          prescriptionsApi.listForPatient(c.patient_id),
        ]);
        setPatient(p);
        setRxList(allRx.filter(r => r.consultation_id === id));
      } catch {
        setError('Failed to load consultation data.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
      <Spin size="large" />
    </div>
  );

  if (error) return <div style={{ padding: 40, color: 'red' }}>{error}</div>;

  const vitals = [
    consult.weight_kg   && `Weight: ${consult.weight_kg} kg`,
    consult.height_cm   && `Height: ${consult.height_cm} cm`,
    consult.bmi         && `BMI: ${consult.bmi}`,
    consult.bp_systolic && `BP: ${consult.bp_systolic}/${consult.bp_diastolic} mmHg`,
    consult.pulse_bpm   && `Pulse: ${consult.pulse_bpm} bpm`,
    consult.temp_celsius && `Temp: ${consult.temp_celsius}°C`,
    consult.o2_sat_pct  && `O₂: ${consult.o2_sat_pct}%`,
  ].filter(Boolean);

  return (
    <>
      {/* Print controls — hidden on print */}
      <div className="no-print" style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: '#f5f5f5', padding: '8px 16px',
        borderBottom: '1px solid #ddd',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <span style={{ fontWeight: 600, fontSize: 14 }}>Consultation Summary — Print Preview</span>
        <Space>
          <Button icon={<CloseOutlined />} onClick={() => window.close()}>Close</Button>
          <Button type="primary" icon={<PrinterOutlined />} onClick={() => window.print()}>
            Print
          </Button>
        </Space>
      </div>

      {/* Printable content */}
      <div style={{ maxWidth: 720, margin: '56px auto 40px', padding: '0 24px', fontFamily: 'Georgia, serif' }}>
        {/* Clinic header */}
        <div style={{ textAlign: 'center', borderBottom: '2px solid #333', paddingBottom: 12, marginBottom: 20 }}>
          <h1 style={{ margin: 0, fontSize: 22 }}>Clinic EHR</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#555' }}>Medical Consultation Summary</p>
        </div>

        {/* Patient + visit info */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 24px', marginBottom: 20, fontSize: 13 }}>
          <div><b>Patient:</b> {patient?.full_name}</div>
          <div><b>Visit Date:</b> {dayjs(consult.visit_date).format('DD/MM/YYYY HH:mm')}</div>
          <div><b>Patient #:</b> {patient?.patient_number}</div>
          <div><b>Doctor:</b> {consult.doctor_name}</div>
          {patient?.dob && <div><b>Date of Birth:</b> {dayjs(patient.dob).format('DD/MM/YYYY')}</div>}
          {patient?.phone && <div><b>Phone:</b> {patient.phone}</div>}
        </div>

        {/* Chief complaint */}
        {consult.chief_complaint && (
          <Section title="Chief Complaint">
            <p style={{ margin: 0 }}>{consult.chief_complaint}</p>
          </Section>
        )}

        {/* Vitals */}
        {vitals.length > 0 && (
          <Section title="Vitals">
            <p style={{ margin: 0 }}>{vitals.join('  ·  ')}</p>
          </Section>
        )}

        {/* SOAP */}
        {consult.subjective  && <Section title="S — Subjective"><Pre>{consult.subjective}</Pre></Section>}
        {consult.objective   && <Section title="O — Objective"><Pre>{consult.objective}</Pre></Section>}
        {consult.assessment  && <Section title="A — Assessment"><Pre>{consult.assessment}</Pre></Section>}
        {consult.plan        && <Section title="P — Plan"><Pre>{consult.plan}</Pre></Section>}

        {/* Prescriptions */}
        {rxList.length > 0 && (
          <Section title="Prescriptions">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #aaa' }}>
                  <th style={{ textAlign: 'left', padding: '4px 8px 4px 0' }}>Medication</th>
                  <th style={{ textAlign: 'left', padding: '4px 8px' }}>Dosage</th>
                  <th style={{ textAlign: 'left', padding: '4px 8px' }}>Frequency</th>
                  <th style={{ textAlign: 'left', padding: '4px 8px' }}>Duration</th>
                </tr>
              </thead>
              <tbody>
                {rxList.map((rx, i) => (
                  <tr key={rx.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '4px 8px 4px 0' }}>{rx.medication_name}</td>
                    <td style={{ padding: '4px 8px' }}>{rx.dosage || '—'}</td>
                    <td style={{ padding: '4px 8px' }}>{rx.frequency || '—'}</td>
                    <td style={{ padding: '4px 8px' }}>{rx.duration || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        )}

        {/* Follow-up */}
        {(consult.follow_up_date || consult.follow_up_notes) && (
          <Section title="Follow-up">
            {consult.follow_up_date && (
              <p style={{ margin: '0 0 4px' }}>
                <b>Date:</b> {dayjs(consult.follow_up_date).format('DD/MM/YYYY')}
              </p>
            )}
            {consult.follow_up_notes && <p style={{ margin: 0 }}>{consult.follow_up_notes}</p>}
          </Section>
        )}

        {/* Signature line */}
        <div style={{ marginTop: 48, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
          <div style={{ borderTop: '1px solid #333', paddingTop: 6, fontSize: 12, textAlign: 'center' }}>
            Doctor Signature
          </div>
          <div style={{ borderTop: '1px solid #333', paddingTop: 6, fontSize: 12, textAlign: 'center' }}>
            Date
          </div>
        </div>

        <p style={{ fontSize: 11, color: '#999', textAlign: 'center', marginTop: 32 }}>
          Printed {dayjs().format('DD/MM/YYYY HH:mm')} — Clinic EHR
        </p>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; }
        }
      `}</style>
    </>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <h3 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase',
        letterSpacing: '0.05em', color: '#444', borderBottom: '1px solid #ddd',
        paddingBottom: 4, marginBottom: 8 }}>{title}</h3>
      {children}
    </div>
  );
}

function Pre({ children }) {
  return (
    <p style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: 13, lineHeight: 1.6 }}>
      {children}
    </p>
  );
}
