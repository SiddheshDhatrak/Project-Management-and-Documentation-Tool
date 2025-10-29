// Database seed script
import { connectToDatabase, closeDatabase } from '../lib/db.js';
import { v4 as uuidv4 } from 'uuid';

async function seed() {
  try {
    const { db } = await connectToDatabase();
    console.log('Seeding database...');

    // Clear existing data (optional - comment out if you want to keep existing data)
    // await db.collection('projects').deleteMany({});
    // await db.collection('pages').deleteMany({});
    // await db.collection('boards').deleteMany({});
    // await db.collection('users').deleteMany({});

    // Create sample users
    const users = [
      {
        id: uuidv4(),
        name: 'John Doe',
        color: '#3b82f6',
        role: 'Owner',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        id: uuidv4(),
        name: 'Jane Smith',
        color: '#10b981',
        role: 'Admin',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        id: uuidv4(),
        name: 'Bob Wilson',
        color: '#f59e0b',
        role: 'Editor',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];

    for (const user of users) {
      await db.collection('users').updateOne(
        { id: user.id },
        { $set: user },
        { upsert: true }
      );
    }
    console.log(`✓ Created ${users.length} users`);

    // Create sample project
    const project = {
      id: uuidv4(),
      name: 'Sample Project',
      description: 'A sample project for testing',
      members: [users[0].id, users[1].id, users[2].id],
      memberRoles: {
        [users[0].id]: 'Owner',
        [users[1].id]: 'Admin',
        [users[2].id]: 'Editor',
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await db.collection('projects').insertOne(project);
    console.log(`✓ Created project: ${project.name}`);

    // Create sample pages
    const pages = [
      {
        id: uuidv4(),
        projectId: project.id,
        title: 'Getting Started',
        content: '<h1>Welcome</h1><p>This is your first page. Start editing to see real-time collaboration!</p>',
        parentId: null,
        authorId: users[0].id,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        id: uuidv4(),
        title: 'Project Overview',
        projectId: project.id,
        content: '<h1>Project Overview</h1><p>This project aims to build a collaborative documentation tool.</p>',
        parentId: null,
        authorId: users[0].id,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];

    for (const page of pages) {
      await db.collection('pages').insertOne(page);
    }
    console.log(`✓ Created ${pages.length} pages`);

    // Create sample board
    const board = {
      id: uuidv4(),
      projectId: project.id,
      name: 'Sprint Board',
      columns: [
        {
          id: uuidv4(),
          title: 'To Do',
          cards: [
            {
              id: uuidv4(),
              title: 'Set up development environment',
              description: 'Install dependencies and configure the project',
              labels: [],
              assignee: users[2].id,
              dueDate: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days from now
              linkedPageId: null,
              createdAt: Date.now(),
              createdBy: users[0].id,
            },
          ],
        },
        {
          id: uuidv4(),
          title: 'In Progress',
          cards: [
            {
              id: uuidv4(),
              title: 'Design database schema',
              description: 'Plan the MongoDB collections structure',
              labels: ['backend', 'priority'],
              assignee: users[1].id,
              dueDate: null,
              linkedPageId: pages[0].id,
              createdAt: Date.now(),
              createdBy: users[0].id,
            },
          ],
        },
        {
          id: uuidv4(),
          title: 'Done',
          cards: [],
        },
      ],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await db.collection('boards').insertOne(board);
    console.log(`✓ Created board: ${board.name}`);

    // Create sample activities
    const activities = [
      {
        id: uuidv4(),
        type: 'project_created',
        projectId: project.id,
        userId: users[0].id,
        userName: users[0].name,
        resourceId: project.id,
        resourceName: project.name,
        details: `Created project "${project.name}"`,
        timestamp: Date.now(),
      },
      {
        id: uuidv4(),
        type: 'page_created',
        projectId: project.id,
        userId: users[0].id,
        userName: users[0].name,
        resourceId: pages[0].id,
        resourceName: pages[0].title,
        details: `Created page "${pages[0].title}"`,
        timestamp: Date.now(),
      },
    ];

    for (const activity of activities) {
      await db.collection('activities').insertOne(activity);
    }
    console.log(`✓ Created ${activities.length} activities`);

    console.log('\n✅ Seed data created successfully!');
    console.log(`\nProject ID: ${project.id}`);
    console.log(`User IDs: ${users.map(u => u.id).join(', ')}`);

  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  } finally {
    await closeDatabase();
  }
}

// Run seed if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seed()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export default seed;

