import api from './axios';

export const appointmentsApi = {
  list:          (params)         => api.get('/appointments', { params }).then(r => r.data),
  queue:         (date)           => api.get('/appointments/queue', { params: { date } }).then(r => r.data),
  doctors:       ()               => api.get('/appointments/doctors').then(r => r.data),
  getById:       (id)             => api.get(`/appointments/${id}`).then(r => r.data),
  create:        (data)           => api.post('/appointments', data).then(r => r.data),
  update:        (id, data)       => api.put(`/appointments/${id}`, data).then(r => r.data),
  updateStatus:  (id, status)     => api.patch(`/appointments/${id}/status`, { status }).then(r => r.data),
  cancel:        (id)             => api.delete(`/appointments/${id}`).then(r => r.data),
};
