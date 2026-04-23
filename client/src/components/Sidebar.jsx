import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../utils/api';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const Avatar = ({ user, size = 'md', showOnline = false, isOnline = false }) => {
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-11 h-11 text-sm', lg: 'w-14 h-14 text-base' };
  const dotSizes = { sm: 'w-2 h-2', md: 'w-2.5 h-2.5', lg: 'w-3 h-3' };
  const colors = ['from-sky-400 to-sky-600','from-violet-400 to-violet-600','from-emerald-400 to-emerald-600','from-amber-400 to-amber-600','from-rose-400 to-rose-600'];
  const colorIdx = user?.userId?.charCodeAt(0) % colors.length || 0;

  return (
    <div className="relative flex-shrink-0">
      {user?.avatar ? (
        <img src={user.avatar} alt={user.username} className={`${sizes[size]} rounded-full object-cover`} />
      ) : (
        <div className={`${sizes[size]} rounded-full bg-gradient-to-br ${colors[colorIdx]} flex items-center justify-center font-semibold text-white`}>
          {user?.username?.[0]?.toUpperCase() || '?'}
        </div>
      )}
      {showOnline && (
        <span className={`absolute bottom-0 right-0 ${dotSizes[size]} rounded-full border-2 border-white ${isOnline ? 'bg-emerald-400 online-pulse' : 'bg-slate-300'}`} />
      )}
    </div>
  );
};

const Sidebar = ({ activeChatId, onSelectChat, conversations, loadConversations }) => {
  const { user, logout } = useAuth();
  const { isUserOnline } = useSocket();
  const [tab, setTab] = useState('chats'); // 'chats' | 'contacts' | 'search'
  const [contacts, setContacts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  // Load contacts
  const loadContacts = useCallback(async () => {
    try {
      const res = await api.get('/users/contacts/list');
      setContacts(res.data.contacts);
    } catch (err) { console.error(err); }
  }, []);

  useEffect(() => { loadContacts(); }, [loadContacts]);

  // Search users
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    const t = setTimeout(async () => {
      try {
        const res = await api.get(`/users/search?q=${searchQuery}`);
        setSearchResults(res.data.users);
      } catch (err) { console.error(err); }
      finally { setSearching(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const addContact = async (targetUserId) => {
    try {
      await api.post('/users/contact/add', { targetUserId });
      toast.success('Contact added!');
      loadContacts();
      onSelectChat(targetUserId);
      setTab('chats');
      setSearchQuery('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add contact');
    }
  };

  const getLastMsg = (conv) => {
    const msg = conv?.lastMessage;
    if (!msg) return '';
    if (msg.senderId === user?.userId) return `You: ${msg.message}`;
    return msg.message;
  };

  const getUnreadCount = (conv) => {
    // Would need backend support; placeholder
    return 0;
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-sky-50">
      {/* Header */}
      <div className="px-4 pt-5 pb-3 border-b border-sky-50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" fill="white"/>
              </svg>
            </div>
            <span className="font-display font-bold text-lg logo-text">Nexify</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowProfile(!showProfile)}
              className="p-2 rounded-xl hover:bg-sky-50 transition-colors"
              title="Profile"
            >
              <Avatar user={user} size="sm" />
            </button>
            <button
              onClick={logout}
              className="p-2 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-400 transition-colors"
              title="Logout"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Profile mini */}
        {showProfile && (
          <div className="mb-3 p-3 rounded-2xl bg-sky-50 border border-sky-100 fade-up">
            <div className="flex items-center gap-3">
              <Avatar user={user} size="md" showOnline isOnline />
              <div>
                <p className="font-semibold text-sm text-slate-700">{user?.username}</p>
                <p className="text-xs text-sky-500">@{user?.userId}</p>
              </div>
            </div>
          </div>
        )}

        {/* Search bar */}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setTab('search'); }}
            placeholder="Search users by ID..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-sky-50 border border-sky-100 text-sm text-slate-600 placeholder-slate-300 focus:outline-none focus:border-sky-300 focus:bg-white transition-all"
          />
          {searchQuery && (
            <button onClick={() => { setSearchQuery(''); setSearchResults([]); setTab('chats'); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500">
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      {!searchQuery && (
        <div className="flex border-b border-sky-50 px-2">
          {['chats', 'contacts'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-3 text-xs font-semibold capitalize transition-colors ${
                tab === t ? 'text-sky-500 border-b-2 border-sky-400' : 'text-slate-400 hover:text-slate-600'
              }`}>
              {t}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Search results */}
        {tab === 'search' && (
          <div className="p-2">
            {searching && (
              <div className="flex justify-center py-8">
                <svg className="animate-spin w-5 h-5 text-sky-400" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
              </div>
            )}
            {!searching && searchResults.length === 0 && searchQuery.length >= 2 && (
              <p className="text-center text-slate-400 text-sm py-8">No users found</p>
            )}
            {searchResults.map(u => (
              <div key={u.userId} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-sky-50 transition-colors group">
                <Avatar user={u} size="md" showOnline isOnline={isUserOnline(u.userId)} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-slate-700">{u.username}</p>
                  <p className="text-xs text-sky-400">@{u.userId}</p>
                </div>
                <button onClick={() => addContact(u.userId)}
                  className="opacity-0 group-hover:opacity-100 px-3 py-1.5 rounded-xl bg-sky-100 text-sky-600 text-xs font-semibold hover:bg-sky-200 transition-all">
                  Add
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Chats list */}
        {tab === 'chats' && (
          <div className="p-2 space-y-0.5">
            {conversations.length === 0 && (
              <div className="text-center py-12 text-slate-400">
                <svg className="w-12 h-12 mx-auto mb-3 text-sky-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                </svg>
                <p className="text-sm font-medium">No conversations yet</p>
                <p className="text-xs mt-1">Search for users to start chatting</p>
              </div>
            )}
            {conversations.map(conv => {
              const partnerId = conv._id;
              const msg = conv.lastMessage;
              const isActive = activeChatId === partnerId;
              return (
                <ConvItem key={partnerId} partnerId={partnerId} msg={msg}
                  isActive={isActive} isOnline={isUserOnline(partnerId)}
                  onSelect={() => onSelectChat(partnerId)} />
              );
            })}
          </div>
        )}

        {/* Contacts list */}
        {tab === 'contacts' && (
          <div className="p-2 space-y-0.5">
            {contacts.length === 0 && (
              <div className="text-center py-12 text-slate-400">
                <svg className="w-12 h-12 mx-auto mb-3 text-sky-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
                </svg>
                <p className="text-sm font-medium">No contacts yet</p>
                <p className="text-xs mt-1">Search and add users</p>
              </div>
            )}
            {contacts.map(c => (
              <div key={c.userId}
                onClick={() => { onSelectChat(c.userId); setTab('chats'); }}
                className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all hover:bg-sky-50 ${activeChatId === c.userId ? 'chat-active' : ''}`}>
                <Avatar user={c} size="md" showOnline isOnline={isUserOnline(c.userId)} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-slate-700 truncate">{c.username}</p>
                  <p className="text-xs text-slate-400">@{c.userId}</p>
                </div>
                {isUserOnline(c.userId) && (
                  <span className="text-xs text-emerald-500 font-medium">Online</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Conversation item with lazy-loaded partner info
const ConvItem = ({ partnerId, msg, isActive, isOnline, onSelect }) => {
  const [partner, setPartner] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    api.get(`/users/${partnerId}`)
      .then(res => setPartner(res.data.user))
      .catch(() => {});
  }, [partnerId]);

  const timeAgo = msg?.timestamp
    ? formatDistanceToNow(new Date(msg.timestamp), { addSuffix: false })
    : '';

  const preview = msg
    ? (msg.senderId === user?.userId ? `You: ${msg.message}` : msg.message)
    : 'Start a conversation';

  const colors = ['from-sky-400 to-sky-600','from-violet-400 to-violet-600','from-emerald-400 to-emerald-600','from-amber-400 to-amber-600','from-rose-400 to-rose-600'];
  const colorIdx = partnerId?.charCodeAt(0) % colors.length || 0;

  return (
    <div onClick={onSelect}
      className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all ${isActive ? 'chat-active' : 'hover:bg-sky-50'}`}>
      <div className="relative flex-shrink-0">
        {partner?.avatar ? (
          <img src={partner.avatar} alt="" className="w-11 h-11 rounded-full object-cover" />
        ) : (
          <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${colors[colorIdx]} flex items-center justify-center text-white font-semibold text-sm`}>
            {partner?.username?.[0]?.toUpperCase() || partnerId?.[0]?.toUpperCase()}
          </div>
        )}
        <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${isOnline ? 'bg-emerald-400' : 'bg-slate-300'}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="font-semibold text-sm text-slate-700 truncate">{partner?.username || partnerId}</p>
          <span className="text-xs text-slate-400 flex-shrink-0 ml-1">{timeAgo}</span>
        </div>
        <p className="text-xs text-slate-400 truncate mt-0.5">{preview}</p>
      </div>
    </div>
  );
};

export { Avatar };
export default Sidebar;
