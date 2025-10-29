// MongoDB database connection and utilities
import { MongoClient } from 'mongodb';

let client;
let db;

const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'pm_docs';

export async function connectToDatabase() {
  if (client && db) {
    return { client, db };
  }

  try {
    client = new MongoClient(MONGO_URL);
    await client.connect();
    db = client.db(DB_NAME);
    
    // Create indexes for better query performance
    await db.collection('projects').createIndex({ id: 1 }, { unique: true });
    await db.collection('pages').createIndex({ id: 1 }, { unique: true });
    await db.collection('pages').createIndex({ projectId: 1 });
    await db.collection('boards').createIndex({ id: 1 }, { unique: true });
    await db.collection('boards').createIndex({ projectId: 1 });
    await db.collection('versions').createIndex({ pageId: 1 });
    await db.collection('activities').createIndex({ projectId: 1, timestamp: -1 });
    await db.collection('users').createIndex({ id: 1 }, { unique: true });
    
    console.log('Connected to MongoDB');
    return { client, db };
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

export async function closeDatabase() {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}

// Helper to sanitize MongoDB documents (remove _id)
export function sanitizeDoc(doc) {
  if (!doc) return null;
  const { _id, ...rest } = doc;
  return rest;
}

export function sanitizeDocs(docs) {
  return docs.map(sanitizeDoc);
}

