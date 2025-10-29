'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

export const useWebSocket = (roomId, user, onMessage) => {
  const ws = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [remoteUsers, setRemoteUsers] = useState([]);
  const reconnectTimeout = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 3;

  const connect = useCallback(() => {
    if (typeof window === 'undefined' || !roomId || !user) return;
    if (reconnectAttempts.current >= maxReconnectAttempts) {
      console.log('Max WebSocket reconnection attempts reached. Running in offline mode.');
      return;
    }

    try {
      // Create WebSocket connection
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/ws`;
      
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        reconnectAttempts.current = 0;
        
        // Join the room
        ws.current.send(JSON.stringify({
          type: 'join',
          data: { roomId, user },
        }));
      };

      ws.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          switch (message.type) {
            case 'connected':
              console.log('Connected with client ID:', message.clientId);
              break;
            
            case 'room_users':
              setRemoteUsers(message.users);
              break;
            
            case 'user_joined':
              setRemoteUsers(prev => [...prev, { ...message.user, clientId: message.clientId }]);
              break;
            
            case 'user_left':
              setRemoteUsers(prev => prev.filter(u => u.clientId !== message.clientId));
              break;
            
            default:
              if (onMessage) {
                onMessage(message);
              }
          }
        } catch (error) {
          console.error('Error processing message:', error);
        }
      };

      ws.current.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        setRemoteUsers([]);
        
        // Attempt to reconnect only if under max attempts
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current += 1;
          reconnectTimeout.current = setTimeout(() => {
            console.log(`Attempting to reconnect... (${reconnectAttempts.current}/${maxReconnectAttempts})`);
            connect();
          }, 3000);
        }
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Error creating WebSocket:', error);
      reconnectAttempts.current = maxReconnectAttempts; // Stop trying
    }
  }, [roomId, user, onMessage]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
      
      if (ws.current) {
        if (ws.current.readyState === WebSocket.OPEN) {
          ws.current.send(JSON.stringify({
            type: 'leave',
            data: { roomId },
          }));
        }
        ws.current.close();
      }
    };
  }, [connect, roomId]);

  const sendMessage = useCallback((type, data) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type, data: { ...data, roomId } }));
    }
  }, [roomId]);

  const sendPresence = useCallback((isTyping, selection = null) => {
    sendMessage('presence', { isTyping, selection });
  }, [sendMessage]);

  const sendCursor = useCallback((position) => {
    sendMessage('cursor', { position });
  }, [sendMessage]);

  const sendUpdate = useCallback((changes) => {
    sendMessage('update', { changes });
  }, [sendMessage]);

  const sendActivity = useCallback((activity) => {
    sendMessage('activity', { activity });
  }, [sendMessage]);

  return {
    isConnected,
    remoteUsers,
    sendPresence,
    sendCursor,
    sendUpdate,
    sendActivity,
  };
};
