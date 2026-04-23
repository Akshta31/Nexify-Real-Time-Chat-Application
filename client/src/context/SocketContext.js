import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    if (!user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
      return;
    }

    const token = localStorage.getItem('nexify_token');
    if (!token) return;

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      setIsConnected(true);
      console.log('Socket connected:', socket.id);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('online_users', (users) => {
      setOnlineUsers(users);
    });

    socket.on('contact_status_change', ({ userId, isOnline }) => {
      setOnlineUsers(prev =>
        isOnline
          ? [...new Set([...prev, userId])]
          : prev.filter(id => id !== userId)
      );
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user]);

  const isUserOnline = (userId) => onlineUsers.includes(userId);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, isConnected, onlineUsers, isUserOnline }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
