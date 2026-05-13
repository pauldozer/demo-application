import api from './axios';

export const prescriptionsApi = {
  listForPatient: (patientId) =>
    api.get(`/patients/${patientId}/prescriptions`).then(r => r.data),

  create: (data) =>
    api.post('/prescriptions', data).then(r => r.data),

  stop: (id) =>
    api.put(`/prescriptions/${id}/stop`).then(r => r.data),
};
