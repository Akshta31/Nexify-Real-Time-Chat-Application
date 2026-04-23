import { useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

export const useChat = (chatPartnerId) => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);

  // Fetch history
  useEffect(() => {
    if (!chatPartnerId) return;
    setLoading(true);
    api.get(`/messages/${chatPartnerId}`)
      .then(res => setMessages(res.data.messages))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [chatPartnerId]);

  // Socket listeners
  useEffect(() => {
    if (!socket || !chatPartnerId) return;

    const handleReceive = (msg) => {
      if (
        (msg.senderId === chatPartnerId && msg.receiverId === user?.userId) ||
        (msg.senderId === user?.userId && msg.receiverId === chatPartnerId)
      ) {
        setMessages(prev => {
          const exists = prev.find(m => m._id === msg._id);
          return exists ? prev : [...prev, msg];
        });
        // Mark as read
        if (msg.senderId === chatPartnerId) {
          socket.emit('messages_read', { senderId: chatPartnerId });
        }
      }
    };

    const handleSent = (msg) => {
      setMessages(prev => {
        const exists = prev.find(m => m._id === msg._id);
        return exists ? prev : [...prev, msg];
      });
    };

    const handleTyping = ({ userId, isTyping: typing }) => {
      if (userId === chatPartnerId) setIsTyping(typing);
    };

    const handleReadBy = ({ readBy }) => {
      if (readBy === chatPartnerId) {
        setMessages(prev => prev.map(m =>
          m.senderId === user?.userId ? { ...m, status: 'read' } : m
        ));
      }
    };

    socket.on('receive_message', handleReceive);
    socket.on('message_sent', handleSent);
    socket.on('user_typing', handleTyping);
    socket.on('messages_read_by', handleReadBy);

    return () => {
      socket.off('receive_message', handleReceive);
      socket.off('message_sent', handleSent);
      socket.off('user_typing', handleTyping);
      socket.off('messages_read_by', handleReadBy);
    };
  }, [socket, chatPartnerId, user?.userId]);

  const sendMessage = useCallback((text) => {
    if (!socket || !text?.trim() || !chatPartnerId) return;
    socket.emit('send_message', { receiverId: chatPartnerId, message: text });
    socket.emit('typing_stop', { receiverId: chatPartnerId });
  }, [socket, chatPartnerId]);

  const handleTypingStart = useCallback(() => {
    if (!socket || !chatPartnerId) return;
    socket.emit('typing_start', { receiverId: chatPartnerId });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing_stop', { receiverId: chatPartnerId });
    }, 2000);
  }, [socket, chatPartnerId]);

  return { messages, loading, isTyping, sendMessage, handleTypingStart };
};
