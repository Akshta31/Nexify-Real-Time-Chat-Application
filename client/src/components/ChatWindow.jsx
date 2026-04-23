import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useChat } from '../hooks/useChat';
import { Avatar } from './Sidebar';
import api from '../utils/api';
import { format, isToday, isYesterday } from 'date-fns';
import EmojiPicker from 'emoji-picker-react';

const ReadReceipt = ({ status }) => {
  if (status === 'read') return (
    <span className="text-sky-400">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <polyline points="20 6 9 17 4 12"/><polyline points="20 6 9 17 4 12" transform="translate(4,0)"/>
      </svg>
    </span>
  );
  if (status === 'delivered') return (
    <span className="text-slate-400">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <polyline points="20 6 9 17 4 12"/><polyline points="20 6 9 17 4 12" transform="translate(4,0)"/>
      </svg>
    </span>
  );
  return (
    <span className="text-slate-300">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    </span>
  );
};

const DateDivider = ({ date }) => {
  const label = isToday(date) ? 'Today' : isYesterday(date) ? 'Yesterday' : format(date, 'MMM d, yyyy');
  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 h-px bg-sky-100" />
      <span className="text-xs text-slate-400 bg-sky-50 px-3 py-1 rounded-full font-medium">{label}</span>
      <div className="flex-1 h-px bg-sky-100" />
    </div>
  );
};

const ChatWindow = ({ partnerId }) => {
  const { user } = useAuth();
  const { isUserOnline } = useSocket();
  const { messages, loading, isTyping, sendMessage, handleTypingStart } = useChat(partnerId);
  const [partner, setPartner] = useState(null);
  const [input, setInput] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const emojiRef = useRef(null);

  // Fetch partner info
  useEffect(() => {
    if (!partnerId) return;
    api.get(`/users/${partnerId}`).then(res => setPartner(res.data.user)).catch(() => {});
  }, [partnerId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Close emoji picker on outside click
  useEffect(() => {
    const handler = (e) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target)) setShowEmoji(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSend = useCallback(() => {
    if (!input.trim()) return;
    sendMessage(input.trim());
    setInput('');
    setShowEmoji(false);
    inputRef.current?.focus();
  }, [input, sendMessage]);

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const onEmojiClick = (emojiData) => {
    setInput(prev => prev + emojiData.emoji);
    inputRef.current?.focus();
  };

  // Group messages by date
  const groupedMessages = [];
  let lastDate = null;
  messages.forEach((msg, i) => {
    const msgDate = new Date(msg.timestamp);
    const dateKey = format(msgDate, 'yyyy-MM-dd');
    if (dateKey !== lastDate) {
      groupedMessages.push({ type: 'divider', date: msgDate, key: `divider-${i}` });
      lastDate = dateKey;
    }
    groupedMessages.push({ type: 'message', ...msg });
  });

  const isOnline = isUserOnline(partnerId);

  if (!partnerId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-sky-50/50">
        <div className="text-center fade-up">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-sky-100 to-sky-200 flex items-center justify-center mx-auto mb-5">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="1.5">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
            </svg>
          </div>
          <h3 className="text-xl font-display font-bold text-slate-600 mb-2">Welcome to Nexify</h3>
          <p className="text-slate-400 text-sm max-w-xs">Select a conversation or search for users to start chatting</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-white">
      {/* Chat header */}
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-sky-50 glass sticky top-0 z-10">
        <Avatar user={partner || { userId: partnerId }} size="md" showOnline isOnline={isOnline} />
        <div className="flex-1">
          <p className="font-semibold text-slate-700">{partner?.username || partnerId}</p>
          <p className="text-xs text-slate-400">
            {isOnline ? (
              <span className="text-emerald-500 font-medium">● Online</span>
            ) : partner?.lastSeen ? (
              `Last seen ${format(new Date(partner.lastSeen), 'MMM d, h:mm a')}`
            ) : (
              `@${partnerId}`
            )}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button className="p-2 rounded-xl hover:bg-sky-50 text-slate-400 hover:text-sky-500 transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
          </button>
          <button className="p-2 rounded-xl hover:bg-sky-50 text-slate-400 hover:text-sky-500 transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4" style={{ background: 'linear-gradient(180deg, #f8fbff 0%, #fff 100%)' }}>
        {loading && (
          <div className="space-y-3 px-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                <div className={`skeleton h-10 rounded-2xl ${i % 2 === 0 ? 'w-48' : 'w-56'}`} />
              </div>
            ))}
          </div>
        )}

        {!loading && groupedMessages.map((item) => {
          if (item.type === 'divider') return <DateDivider key={item.key} date={item.date} />;
          const isMine = item.senderId === user?.userId;
          return (
            <div key={item._id} className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-1.5`}>
              <div className={`max-w-[70%] group ${isMine ? 'msg-out' : 'msg-in'}`}>
                <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed relative
                  ${isMine
                    ? 'bg-gradient-to-br from-sky-500 to-sky-400 text-white rounded-br-md shadow-sm shadow-sky-200'
                    : 'bg-white text-slate-700 border border-sky-50 rounded-bl-md shadow-sm'
                  }`}>
                  {item.message}
                </div>
                <div className={`flex items-center gap-1 mt-0.5 px-1 ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <span className="text-[10px] text-slate-400">
                    {format(new Date(item.timestamp), 'h:mm a')}
                  </span>
                  {isMine && <ReadReceipt status={item.status} />}
                </div>
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start mb-2 msg-in">
            <div className="bg-white border border-sky-50 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm flex items-center gap-1.5">
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="px-4 py-3 border-t border-sky-50 bg-white relative">
        {/* Emoji picker */}
        {showEmoji && (
          <div ref={emojiRef} className="absolute bottom-full mb-2 left-4 z-50 shadow-xl rounded-2xl overflow-hidden fade-up">
            <EmojiPicker onEmojiClick={onEmojiClick} width={300} height={360} />
          </div>
        )}

        <div className="flex items-end gap-2">
          <button
            onClick={() => setShowEmoji(!showEmoji)}
            className={`p-2.5 rounded-xl transition-colors flex-shrink-0 ${showEmoji ? 'bg-sky-100 text-sky-500' : 'hover:bg-sky-50 text-slate-400 hover:text-sky-500'}`}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M8 13s1.5 2 4 2 4-2 4-2"/>
              <line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>
            </svg>
          </button>

          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => { setInput(e.target.value); handleTypingStart(); }}
              onKeyDown={handleKey}
              placeholder="Type a message..."
              rows={1}
              style={{ resize: 'none', maxHeight: '120px' }}
              className="w-full px-4 py-3 rounded-2xl bg-sky-50 border border-sky-100 text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:border-sky-300 focus:bg-white transition-all overflow-hidden"
              onInput={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
              }}
            />
          </div>

          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="send-btn w-11 h-11 rounded-2xl bg-gradient-to-br from-sky-500 to-sky-400 flex items-center justify-center flex-shrink-0 shadow-md shadow-sky-200 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M22 2L11 13M22 2L15 22 11 13 2 9l20-7z" fill="white"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
