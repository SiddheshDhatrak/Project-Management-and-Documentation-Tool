'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  projectStorage,
  pageStorage,
  versionStorage,
  boardStorage,
  activityStorage,
  userStorage,
  currentProjectStorage,
} from '../storage';

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentProject, setCurrentProject] = useState(null);
  const [projects, setProjects] = useState([]);
  const [pages, setPages] = useState([]);
  const [currentPage, setCurrentPage] = useState(null);
  const [boards, setBoards] = useState([]);
  const [currentBoard, setCurrentBoard] = useState(null);
  const [activities, setActivities] = useState([]);
  const [collaborators, setCollaborators] = useState([]);

  // Initialize data from localStorage
  useEffect(() => {
    // Initialize or get current user
    let user = userStorage.get();
    if (!user) {
      user = {
        id: uuidv4(),
        name: `User ${Math.floor(Math.random() * 1000)}`,
        color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
        role: 'Owner', // Owner, Admin, Editor, Viewer
      };
      userStorage.set(user);
    }
    setCurrentUser(user);

    // Load projects
    let allProjects = projectStorage.getAll();
    if (allProjects.length === 0) {
      // Create default project
      const defaultProject = {
        id: uuidv4(),
        name: 'My First Project',
        description: 'Welcome to your first collaborative workspace',
        members: [user.id],
      };
      projectStorage.create(defaultProject);
      allProjects = [defaultProject];

      // Create default page
      const defaultPage = {
        id: uuidv4(),
        projectId: defaultProject.id,
        title: 'Getting Started',
        content: '',
        parentId: null,
        authorId: user.id,
      };
      pageStorage.create(defaultPage);

      // Create default board
      const defaultBoard = {
        id: uuidv4(),
        projectId: defaultProject.id,
        name: 'Sprint Board',
        columns: [
          { id: uuidv4(), title: 'To Do', cards: [] },
          { id: uuidv4(), title: 'In Progress', cards: [] },
          { id: uuidv4(), title: 'Done', cards: [] },
        ],
      };
      boardStorage.create(defaultBoard);
    }
    setProjects(allProjects);

    // Load current project
    let currentProjectId = currentProjectStorage.get();
    if (!currentProjectId || !allProjects.find(p => p.id === currentProjectId)) {
      currentProjectId = allProjects[0]?.id;
      if (currentProjectId) {
        currentProjectStorage.set(currentProjectId);
      }
    }
    const project = allProjects.find(p => p.id === currentProjectId);
    setCurrentProject(project);

    // Load pages for current project
    if (currentProjectId) {
      const projectPages = pageStorage.getByProject(currentProjectId);
      setPages(projectPages);
      if (projectPages.length > 0) {
        setCurrentPage(projectPages[0]);
      }

      // Load boards for current project
      const projectBoards = boardStorage.getByProject(currentProjectId);
      setBoards(projectBoards);
      if (projectBoards.length > 0) {
        setCurrentBoard(projectBoards[0]);
      }

      // Load activities
      const projectActivities = activityStorage.getByProject(currentProjectId);
      setActivities(projectActivities);
    }
  }, []);

  // Project operations
  const createProject = (name, description) => {
    const newProject = {
      id: uuidv4(),
      name,
      description,
      members: [currentUser.id],
    };
    projectStorage.create(newProject);
    const allProjects = projectStorage.getAll();
    setProjects(allProjects);
    switchProject(newProject.id);
    
    addActivity({
      type: 'project_created',
      projectId: newProject.id,
      userId: currentUser.id,
      userName: currentUser.name,
      details: `Created project "${name}"`,
    });
    
    return newProject;
  };

  const switchProject = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      setCurrentProject(project);
      currentProjectStorage.set(projectId);

      // Load project data
      const projectPages = pageStorage.getByProject(projectId);
      setPages(projectPages);
      setCurrentPage(projectPages[0] || null);

      const projectBoards = boardStorage.getByProject(projectId);
      setBoards(projectBoards);
      setCurrentBoard(projectBoards[0] || null);

      const projectActivities = activityStorage.getByProject(projectId);
      setActivities(projectActivities);
    }
  };

  // Page operations
  const createPage = (title, parentId = null) => {
    const newPage = {
      id: uuidv4(),
      projectId: currentProject.id,
      title,
      content: '',
      parentId,
      authorId: currentUser.id,
    };
    pageStorage.create(newPage);
    const updatedPages = pageStorage.getByProject(currentProject.id);
    setPages(updatedPages);
    setCurrentPage(newPage);

    addActivity({
      type: 'page_created',
      projectId: currentProject.id,
      userId: currentUser.id,
      userName: currentUser.name,
      resourceId: newPage.id,
      resourceName: title,
      details: `Created page "${title}"`,
    });

    return newPage;
  };

  const updatePage = (pageId, updates) => {
    const updatedPage = pageStorage.update(pageId, updates);
    if (updatedPage) {
      const updatedPages = pageStorage.getByProject(currentProject.id);
      setPages(updatedPages);
      
      if (currentPage?.id === pageId) {
        setCurrentPage(updatedPage);
      }

      // Create version snapshot for major edits
      if (updates.content) {
        createVersion(pageId, updates.content);
      }

      addActivity({
        type: 'page_updated',
        projectId: currentProject.id,
        userId: currentUser.id,
        userName: currentUser.name,
        resourceId: pageId,
        resourceName: updatedPage.title,
        details: `Updated page "${updatedPage.title}"`,
      });
    }
  };

  const deletePage = (pageId) => {
    const page = pageStorage.getById(pageId);
    if (page) {
      pageStorage.delete(pageId);
      const updatedPages = pageStorage.getByProject(currentProject.id);
      setPages(updatedPages);
      
      if (currentPage?.id === pageId) {
        setCurrentPage(updatedPages[0] || null);
      }

      addActivity({
        type: 'page_deleted',
        projectId: currentProject.id,
        userId: currentUser.id,
        userName: currentUser.name,
        resourceName: page.title,
        details: `Deleted page "${page.title}"`,
      });
    }
  };

  // Version history operations
  const createVersion = (pageId, content) => {
    const version = {
      id: uuidv4(),
      pageId,
      content,
      authorId: currentUser.id,
      authorName: currentUser.name,
    };
    versionStorage.create(version);
  };

  const getVersions = (pageId) => {
    return versionStorage.getByPage(pageId);
  };

  const restoreVersion = (pageId, versionId) => {
    const versions = versionStorage.getByPage(pageId);
    const version = versions.find(v => v.id === versionId);
    if (version) {
      updatePage(pageId, { content: version.content });
      
      addActivity({
        type: 'version_restored',
        projectId: currentProject.id,
        userId: currentUser.id,
        userName: currentUser.name,
        resourceId: pageId,
        details: `Restored previous version`,
      });
    }
  };

  // Board operations
  const createBoard = (name) => {
    const newBoard = {
      id: uuidv4(),
      projectId: currentProject.id,
      name,
      columns: [
        { id: uuidv4(), title: 'To Do', cards: [] },
        { id: uuidv4(), title: 'In Progress', cards: [] },
        { id: uuidv4(), title: 'Done', cards: [] },
      ],
    };
    boardStorage.create(newBoard);
    const updatedBoards = boardStorage.getByProject(currentProject.id);
    setBoards(updatedBoards);
    setCurrentBoard(newBoard);

    addActivity({
      type: 'board_created',
      projectId: currentProject.id,
      userId: currentUser.id,
      userName: currentUser.name,
      resourceId: newBoard.id,
      resourceName: name,
      details: `Created board "${name}"`,
    });

    return newBoard;
  };

  const updateBoard = (boardId, updates) => {
    const updatedBoard = boardStorage.update(boardId, updates);
    if (updatedBoard) {
      const updatedBoards = boardStorage.getByProject(currentProject.id);
      setBoards(updatedBoards);
      
      if (currentBoard?.id === boardId) {
        setCurrentBoard(updatedBoard);
      }
    }
  };

  const addActivity = (activity) => {
    activity.id = uuidv4();
    activity.projectId = activity.projectId || currentProject?.id;
    activityStorage.create(activity);
    
    if (activity.projectId === currentProject?.id) {
      const updatedActivities = activityStorage.getByProject(currentProject.id);
      setActivities(updatedActivities);
    }
  };

  const value = {
    currentUser,
    setCurrentUser,
    currentProject,
    projects,
    createProject,
    switchProject,
    pages,
    currentPage,
    setCurrentPage,
    createPage,
    updatePage,
    deletePage,
    getVersions,
    createVersion,
    restoreVersion,
    boards,
    currentBoard,
    setCurrentBoard,
    createBoard,
    updateBoard,
    activities,
    addActivity,
    collaborators,
    setCollaborators,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
