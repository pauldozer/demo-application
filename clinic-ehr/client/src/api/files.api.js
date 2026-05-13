import api from './axios';
import axios from 'axios';

export const filesApi = {
  listForPatient: (patientId) =>
    api.get(`/patients/${patientId}/files`).then(r => r.data),

  upload: (formData, onProgress) => {
    // patient_id goes in the query string so multer's destination callback can read it
    // before the multipart body fields are fully parsed
    const patientId = formData.get('patient_id');
    return axios.post(`/api/files/upload?patient_id=${patientId}`, formData, {
      withCredentials: true,
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => onProgress?.(Math.round((e.loaded / e.total) * 100))
    }).then(r => r.data);
  },

  downloadUrl: (id) => `/api/files/${id}/download`,

  delete: (id) =>
    api.delete(`/files/${id}`).then(r => r.data),
};
