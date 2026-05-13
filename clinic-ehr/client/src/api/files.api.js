import api from './axios';
import axios from 'axios';

export const filesApi = {
  listForPatient: (patientId) =>
    api.get(`/patients/${patientId}/files`).then(r => r.data),

  upload: (formData, onProgress) =>
    axios.post('/api/files/upload', formData, {
      withCredentials: true,
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => onProgress?.(Math.round((e.loaded / e.total) * 100))
    }).then(r => r.data),

  downloadUrl: (id) => `/api/files/${id}/download`,

  delete: (id) =>
    api.delete(`/files/${id}`).then(r => r.data),
};
