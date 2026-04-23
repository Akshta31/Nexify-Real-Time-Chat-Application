import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import ChatWindow from '../components/ChatWindow';
import { useSocket } from '../context/SocketContext';
import api from '../utils/api';

const ChatPage = () => {
  const [activeChatId, setActiveChatId] = useState(null);
  const [conversations, setConversations] = useState([]);
  const { socket } = useSocket();

  const loadConversations = useCallback(async () => {
    try {
      const res = await api.get('/messages/conversations/list');
      setConversations(res.data.conversations);
    } catch (err) { console.error(err); }
  }, []);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  // Refresh conversations when a new message arrives
  useEffect(() => {
    if (!socket) return;
    const handler = () => loadConversations();
    socket.on('receive_message', handler);
    socket.on('message_sent', handler);
    return () => {
      socket.off('receive_message', handler);
      socket.off('message_sent', handler);
    };
  }, [socket, loadConversations]);

  const handleSelectChat = (userId) => {
    setActiveChatId(userId);
    // Add to conversations list if not present
    setConversations(prev => {
      const exists = prev.find(c => c._id === userId);
      if (!exists) return [{ _id: userId, lastMessage: null }, ...prev];
      return prev;
    });
  };

  return (
    <div className="flex h-screen overflow-hidden bg-sky-50">
      {/* Sidebar */}
      <div className={`${activeChatId ? 'hidden md:flex' : 'flex'} w-full md:w-80 lg:w-96 flex-col flex-shrink-0`}>
        <Sidebar
          activeChatId={activeChatId}
          onSelectChat={handleSelectChat}
          conversations={conversations}
          loadConversations={loadConversations}
        />
      </div>

      {/* Chat area */}
      <div className={`${activeChatId ? 'flex' : 'hidden md:flex'} flex-1 flex-col overflow-hidden`}>
        {/* Back button on mobile */}
        {activeChatId && (
          <div className="md:hidden absolute top-4 left-4 z-20">
            <button
              onClick={() => setActiveChatId(null)}
              className="p-2 rounded-xl bg-white shadow-md text-slate-500"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </button>
          </div>
        )}
        <ChatWindow partnerId={activeChatId} />
      </div>
    </div>
  );
};

export default ChatPage;
