import api from './axios';

export const billingApi = {
  getByAppointment: (appointmentId) =>
    api.get(`/billing/${appointmentId}`).then(r => r.data),

  upsert: (data) =>
    api.post('/billing', data).then(r => r.data),

  revenue: (params = {}) =>
    api.get('/billing/revenue', { params }).then(r => r.data),

  analytics: (params = {}) =>
    api.get('/billing/analytics', { params }).then(r => r.data),
};
