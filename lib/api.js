// Client-side API helper for making requests to the backend
import axios from 'axios';

const API_BASE = typeof window !== 'undefined' ? '/api' : 'http://localhost:3000/api';

// Generic request helper
async function request(endpoint, options = {}) {
  try {
    const response = await axios({
      url: `${API_BASE}${endpoint}`,
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    return response.data;
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    throw error;
  }
}

// Projects API
export const projectsAPI = {
  getAll: (userId) => request(`/projects${userId ? `?userId=${userId}` : ''}`),
  getById: (id) => request(`/projects?id=${id}`),
  create: (data) => request('/projects', { method: 'POST', data }),
  update: (data) => request('/projects', { method: 'PUT', data }),
  delete: (id) => request(`/projects?id=${id}`, { method: 'DELETE' }),
};

// Pages API
export const pagesAPI = {
  getByProject: (projectId) => request(`/pages?projectId=${projectId}`),
  getById: (id) => request(`/pages?id=${id}`),
  create: (data) => request('/pages', { method: 'POST', data }),
  update: (data) => request('/pages', { method: 'PUT', data }),
  delete: (id) => request(`/pages?id=${id}`, { method: 'DELETE' }),
};

// Boards API
export const boardsAPI = {
  getByProject: (projectId) => request(`/boards?projectId=${projectId}`),
  getById: (id) => request(`/boards?id=${id}`),
  create: (data) => request('/boards', { method: 'POST', data }),
  update: (data) => request('/boards', { method: 'PUT', data }),
  delete: (id) => request(`/boards?id=${id}`, { method: 'DELETE' }),
};

// Versions API
export const versionsAPI = {
  getByPage: (pageId) => request(`/versions?pageId=${pageId}`),
  create: (data) => request('/versions', { method: 'POST', data }),
  delete: (id) => request(`/versions?id=${id}`, { method: 'DELETE' }),
};

// Activities API
export const activitiesAPI = {
  getByProject: (projectId, limit = 100) => request(`/activities?projectId=${projectId}&limit=${limit}`),
  create: (data) => request('/activities', { method: 'POST', data }),
};

// Users API
export const usersAPI = {
  getById: (id) => request(`/users?id=${id}`),
  createOrUpdate: (data) => request('/users', { method: 'POST', data }),
};

