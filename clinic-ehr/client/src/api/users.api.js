import api from './axios';

export const usersApi = {
  list:          ()           => api.get('/users').then(r => r.data),
  create:        (data)       => api.post('/users', data).then(r => r.data),
  update:        (id, data)   => api.put(`/users/${id}`, data).then(r => r.data),
  resetPassword: (id, pw)     => api.put(`/users/${id}/reset-password`, { new_password: pw }).then(r => r.data),
};
