// Local storage utilities for data persistence

const STORAGE_KEYS = {
  PROJECTS: 'projects',
  PAGES: 'pages',
  VERSIONS: 'versions',
  BOARDS: 'boards',
  ACTIVITIES: 'activities',
  CURRENT_USER: 'currentUser',
  CURRENT_PROJECT: 'currentProject',
};

// Storage helpers
export const storage = {
  get: (key) => {
    if (typeof window === 'undefined') return null;
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return null;
    }
  },

  set: (key, value) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  },

  remove: (key) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  },

  clear: () => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  },
};

// Project operations
export const projectStorage = {
  getAll: () => storage.get(STORAGE_KEYS.PROJECTS) || [],
  
  getById: (id) => {
    const projects = projectStorage.getAll();
    return projects.find(p => p.id === id);
  },

  create: (project) => {
    const projects = projectStorage.getAll();
    projects.push({ ...project, createdAt: Date.now(), updatedAt: Date.now() });
    storage.set(STORAGE_KEYS.PROJECTS, projects);
    return project;
  },

  update: (id, updates) => {
    const projects = projectStorage.getAll();
    const index = projects.findIndex(p => p.id === id);
    if (index !== -1) {
      projects[index] = { ...projects[index], ...updates, updatedAt: Date.now() };
      storage.set(STORAGE_KEYS.PROJECTS, projects);
      return projects[index];
    }
    return null;
  },

  delete: (id) => {
    const projects = projectStorage.getAll();
    const filtered = projects.filter(p => p.id !== id);
    storage.set(STORAGE_KEYS.PROJECTS, filtered);
  },
};

// Page operations
export const pageStorage = {
  getAll: () => storage.get(STORAGE_KEYS.PAGES) || [],
  
  getByProject: (projectId) => {
    const pages = pageStorage.getAll();
    return pages.filter(p => p.projectId === projectId);
  },

  getById: (id) => {
    const pages = pageStorage.getAll();
    return pages.find(p => p.id === id);
  },

  create: (page) => {
    const pages = pageStorage.getAll();
    const newPage = { ...page, createdAt: Date.now(), updatedAt: Date.now() };
    pages.push(newPage);
    storage.set(STORAGE_KEYS.PAGES, pages);
    return newPage;
  },

  update: (id, updates) => {
    const pages = pageStorage.getAll();
    const index = pages.findIndex(p => p.id === id);
    if (index !== -1) {
      pages[index] = { ...pages[index], ...updates, updatedAt: Date.now() };
      storage.set(STORAGE_KEYS.PAGES, pages);
      return pages[index];
    }
    return null;
  },

  delete: (id) => {
    const pages = pageStorage.getAll();
    const filtered = pages.filter(p => p.id !== id);
    storage.set(STORAGE_KEYS.PAGES, filtered);
  },
};

// Version history operations
export const versionStorage = {
  getAll: () => storage.get(STORAGE_KEYS.VERSIONS) || [],
  
  getByPage: (pageId) => {
    const versions = versionStorage.getAll();
    return versions.filter(v => v.pageId === pageId).sort((a, b) => b.timestamp - a.timestamp);
  },

  create: (version) => {
    const versions = versionStorage.getAll();
    versions.push({ ...version, timestamp: Date.now() });
    storage.set(STORAGE_KEYS.VERSIONS, versions);
    return version;
  },

  delete: (id) => {
    const versions = versionStorage.getAll();
    const filtered = versions.filter(v => v.id !== id);
    storage.set(STORAGE_KEYS.VERSIONS, filtered);
  },
};

// Kanban board operations
export const boardStorage = {
  getAll: () => storage.get(STORAGE_KEYS.BOARDS) || [],
  
  getByProject: (projectId) => {
    const boards = boardStorage.getAll();
    return boards.filter(b => b.projectId === projectId);
  },

  getById: (id) => {
    const boards = boardStorage.getAll();
    return boards.find(b => b.id === id);
  },

  create: (board) => {
    const boards = boardStorage.getAll();
    const newBoard = { ...board, createdAt: Date.now(), updatedAt: Date.now() };
    boards.push(newBoard);
    storage.set(STORAGE_KEYS.BOARDS, boards);
    return newBoard;
  },

  update: (id, updates) => {
    const boards = boardStorage.getAll();
    const index = boards.findIndex(b => b.id === id);
    if (index !== -1) {
      boards[index] = { ...boards[index], ...updates, updatedAt: Date.now() };
      storage.set(STORAGE_KEYS.BOARDS, boards);
      return boards[index];
    }
    return null;
  },

  delete: (id) => {
    const boards = boardStorage.getAll();
    const filtered = boards.filter(b => b.id !== id);
    storage.set(STORAGE_KEYS.BOARDS, filtered);
  },
};

// Activity feed operations
export const activityStorage = {
  getAll: () => storage.get(STORAGE_KEYS.ACTIVITIES) || [],
  
  getByProject: (projectId) => {
    const activities = activityStorage.getAll();
    return activities.filter(a => a.projectId === projectId).sort((a, b) => b.timestamp - a.timestamp);
  },

  create: (activity) => {
    const activities = activityStorage.getAll();
    const newActivity = { ...activity, timestamp: Date.now() };
    activities.push(newActivity);
    // Keep only last 100 activities
    if (activities.length > 100) {
      activities.shift();
    }
    storage.set(STORAGE_KEYS.ACTIVITIES, activities);
    return newActivity;
  },

  clear: () => {
    storage.set(STORAGE_KEYS.ACTIVITIES, []);
  },
};

// Current user operations
export const userStorage = {
  get: () => storage.get(STORAGE_KEYS.CURRENT_USER),
  
  set: (user) => storage.set(STORAGE_KEYS.CURRENT_USER, user),
  
  clear: () => storage.remove(STORAGE_KEYS.CURRENT_USER),
};

// Current project operations
export const currentProjectStorage = {
  get: () => storage.get(STORAGE_KEYS.CURRENT_PROJECT),
  
  set: (projectId) => storage.set(STORAGE_KEYS.CURRENT_PROJECT, projectId),
  
  clear: () => storage.remove(STORAGE_KEYS.CURRENT_PROJECT),
};

export default {
  storage,
  projectStorage,
  pageStorage,
  versionStorage,
  boardStorage,
  activityStorage,
  userStorage,
  currentProjectStorage,
};
