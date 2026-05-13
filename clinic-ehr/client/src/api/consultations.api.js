import api from './axios';

export const consultationsApi = {
  listForPatient: (patientId) =>
    api.get(`/patients/${patientId}/consultations`).then(r => r.data),

  getById: (id) =>
    api.get(`/consultations/${id}`).then(r => r.data),

  create: (data) =>
    api.post('/consultations', data).then(r => r.data),

  update: (id, data) =>
    api.put(`/consultations/${id}`, data).then(r => r.data),

  complete: (id, data = {}) =>
    api.put(`/consultations/${id}/complete`, data).then(r => r.data),
};
