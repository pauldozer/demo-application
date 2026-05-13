import api from './axios';

export const statsApi = {
  overview: () => api.get('/stats/overview').then(r => r.data),
};
