import api from './axios';

export const authApi = {
  login:   (username, password) =>
    api.post('/auth/login', { username, password }).then(r => r.data),

  logout:  () =>
    api.post('/auth/logout').then(r => r.data),

  me:      () =>
    api.get('/auth/me').then(r => r.data),

  changePassword: (current_password, new_password) =>
    api.put('/auth/password', { current_password, new_password }).then(r => r.data),
};
