const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { WebSocketServer } = require('ws');
const { v4: uuidv4 } = require('uuid');

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

const clients = new Map();
const rooms = new Map();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // WebSocket server
  const wss = new WebSocketServer({ server, path: '/api/ws' });

  wss.on('connection', (ws) => {
    const clientId = uuidv4();
    const clientInfo = {
      id: clientId,
      ws,
      rooms: new Set(),
      user: null,
    };
    
    clients.set(ws, clientInfo);
    console.log(`WebSocket client connected: ${clientId}`);

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        handleMessage(ws, message, clientInfo);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });

    ws.on('close', () => {
      console.log(`WebSocket client disconnected: ${clientId}`);
      clientInfo.rooms.forEach(roomId => {
        leaveRoom(clientInfo, roomId);
      });
      clients.delete(ws);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    ws.send(JSON.stringify({
      type: 'connected',
      clientId,
    }));
  });

  function handleMessage(ws, message, clientInfo) {
    const { type, data } = message;

    switch (type) {
      case 'join':
        handleJoin(clientInfo, data);
        break;
      case 'leave':
        handleLeave(clientInfo, data);
        break;
      case 'presence':
        handlePresence(clientInfo, data);
        break;
      case 'cursor':
        handleCursor(clientInfo, data);
        break;
      case 'update':
        handleUpdate(clientInfo, data);
        break;
      case 'activity':
        handleActivity(clientInfo, data);
        break;
      default:
        console.log('Unknown WebSocket message type:', type);
    }
  }

  function handleJoin(clientInfo, data) {
    const { roomId, user } = data;
    
    clientInfo.user = user;
    clientInfo.rooms.add(roomId);

    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Set());
    }
    rooms.get(roomId).add(clientInfo);

    broadcast(roomId, {
      type: 'user_joined',
      user,
      clientId: clientInfo.id,
    }, clientInfo);

    const roomUsers = Array.from(rooms.get(roomId))
      .filter(c => c.id !== clientInfo.id && c.user)
      .map(c => ({ ...c.user, clientId: c.id }));

    clientInfo.ws.send(JSON.stringify({
      type: 'room_users',
      users: roomUsers,
    }));

    console.log(`User ${user.name} joined room ${roomId}`);
  }

  function handleLeave(clientInfo, data) {
    const { roomId } = data;
    leaveRoom(clientInfo, roomId);
  }

  function leaveRoom(clientInfo, roomId) {
    if (clientInfo.rooms.has(roomId)) {
      clientInfo.rooms.delete(roomId);
      
      const room = rooms.get(roomId);
      if (room) {
        room.delete(clientInfo);
        
        broadcast(roomId, {
          type: 'user_left',
          clientId: clientInfo.id,
          user: clientInfo.user,
        }, clientInfo);

        if (room.size === 0) {
          rooms.delete(roomId);
        }
      }
    }
  }

  function handlePresence(clientInfo, data) {
    const { roomId, isTyping, selection } = data;
    
    broadcast(roomId, {
      type: 'presence',
      clientId: clientInfo.id,
      user: clientInfo.user,
      isTyping,
      selection,
    }, clientInfo);
  }

  function handleCursor(clientInfo, data) {
    const { roomId, position } = data;
    
    broadcast(roomId, {
      type: 'cursor',
      clientId: clientInfo.id,
      user: clientInfo.user,
      position,
    }, clientInfo);
  }

  function handleUpdate(clientInfo, data) {
    const { roomId, changes } = data;
    
    broadcast(roomId, {
      type: 'update',
      clientId: clientInfo.id,
      changes,
    }, clientInfo);
  }

  function handleActivity(clientInfo, data) {
    const { roomId, activity } = data;
    
    broadcast(roomId, {
      type: 'activity',
      activity: {
        ...activity,
        userName: clientInfo.user?.name,
        userId: clientInfo.user?.id,
      },
    }, clientInfo);
  }

  function broadcast(roomId, message, excludeClient = null) {
    const room = rooms.get(roomId);
    if (!room) return;

    const messageStr = JSON.stringify(message);
    
    room.forEach(clientInfo => {
      if (clientInfo !== excludeClient && clientInfo.ws.readyState === 1) {
        try {
          clientInfo.ws.send(messageStr);
        } catch (error) {
          console.error('Error sending WebSocket message:', error);
        }
      }
    });
  }

  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
