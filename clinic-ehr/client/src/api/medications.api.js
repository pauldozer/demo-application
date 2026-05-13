import api from './axios';

export const medicationsApi = {
  search: (q = '') =>
    api.get('/medications', { params: { q } }).then(r => r.data),
};
