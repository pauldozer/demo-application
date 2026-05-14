import api from './axios';

export const billingApi = {
  getByAppointment: (appointmentId) =>
    api.get(`/billing/${appointmentId}`).then(r => r.data),

  upsert: (data) =>
    api.post('/billing', data).then(r => r.data),
};
