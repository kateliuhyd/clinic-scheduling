import axios from 'axios';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
};

// Doctors
export const doctorAPI = {
  getAll: () => api.get('/doctors'),
  getById: (id) => api.get(`/doctors/${id}`),
  getByDepartment: (deptId) => api.get(`/doctors/department/${deptId}`),
};

// Services
export const serviceAPI = {
  getAll: () => api.get('/services'),
  getById: (id) => api.get(`/services/${id}`),
};

// Departments
export const departmentAPI = {
  getAll: () => api.get('/departments'),
};

// Slots
export const slotAPI = {
  getAvailable: (params) => api.get('/slots/available', { params }),
  getMySchedule: (params) => api.get('/slots/my-schedule', { params }),
  create: (data) => api.post('/slots', data),
  batchCreate: (data) => api.post('/slots/batch', data),
  close: (id) => api.put(`/slots/${id}/close`),
  delete: (id) => api.delete(`/slots/${id}`),
};

// Appointments
export const appointmentAPI = {
  book: (data) => api.post('/appointments', data),
  cancel: (id) => api.post(`/appointments/${id}/cancel`),
  complete: (id) => api.put(`/appointments/${id}/complete`),
  getMy: (status) => api.get('/appointments/my', { params: status ? { status } : {} }),
  getMyDoctor: (status) => api.get('/appointments/my-doctor', { params: status ? { status } : {} }),
  getByDoctor: (doctorId, status) => api.get(`/appointments/doctor/${doctorId}`, { params: status ? { status } : {} }),
  getAll: () => api.get('/appointments'),
  getById: (id) => api.get(`/appointments/${id}`),
};

// Admin
export const adminAPI = {
  getUsers: () => api.get('/admin/users'),
  toggleUserActive: (id) => api.put(`/admin/users/${id}/toggle-active`),
  getDashboard: () => api.get('/admin/dashboard'),
};

// Medical Records
export const medicalRecordAPI = {
  getMy: () => api.get('/medical-records/my'),
  getByPatient: (patientId) => api.get(`/medical-records/patient/${patientId}`),
  create: (data) => api.post('/medical-records', data),
};

// Messages
export const messageAPI = {
  getConversations: () => api.get('/messages/conversations'),
  getConversation: (partnerId) => api.get(`/messages/conversation/${partnerId}`),
  send: (data) => api.post('/messages', data),
};

export default api;
