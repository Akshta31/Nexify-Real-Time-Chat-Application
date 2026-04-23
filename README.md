# 💬 Nexify — Real-Time Chat Application

A full-featured, real-time chat application built with the **MERN stack** and **Socket.IO**. Connect with others using unique User IDs — no phone number required.

![Nexify Preview](https://img.shields.io/badge/Stack-MERN-38bdf8?style=for-the-badge)
![Socket.IO](https://img.shields.io/badge/RealTime-Socket.IO-010101?style=for-the-badge)
![Tailwind CSS](https://img.shields.io/badge/UI-Tailwind_CSS-38bdf8?style=for-the-badge)

---

## ✨ Features

- 🔐 **User Authentication** — Register/login with a unique User ID (no phone required)
- 💬 **Real-Time Messaging** — Instant delivery via Socket.IO
- ✅ **Read Receipts** — Sent (✓), Delivered (✓✓), Read (✓✓ blue)
- 🟢 **Online/Offline Status** — Live presence indicators with last seen
- ⌨️ **Typing Indicators** — "User is typing..." with animated dots
- 😊 **Emoji Support** — Full emoji picker integrated
- 📋 **Chat History** — All messages persisted in MongoDB
- 🔍 **User Search** — Find and add contacts by User ID
- 📱 **Responsive Design** — Works on mobile and desktop
- 🎨 **Sky Blue + White Theme** — Clean, modern, minimal UI

---

## 🏗️ Architecture

```
nexify/
├── server/                    # Node.js + Express backend
│   ├── index.js               # Entry point, Express + Socket.IO setup
│   ├── models/
│   │   ├── User.js            # User schema (userId, contacts, lastSeen...)
│   │   └── Message.js         # Message schema (senderId, receiverId, status...)
│   ├── routes/
│   │   ├── auth.js            # Register, login, profile
│   │   ├── users.js           # Search, contacts management
│   │   └── messages.js        # Chat history, conversations
│   ├── socket/
│   │   └── socketHandler.js   # Real-time events handler
│   └── middleware/
│       └── auth.js            # JWT middleware
│
└── client/                    # React.js frontend
    └── src/
        ├── context/
        │   ├── AuthContext.js  # Authentication state
        │   └── SocketContext.js # Socket.IO connection
        ├── hooks/
        │   └── useChat.js     # Chat logic hook
        ├── pages/
        │   ├── AuthPage.jsx   # Login/Register
        │   └── ChatPage.jsx   # Main chat layout
        └── components/
            ├── Sidebar.jsx    # Contact list, search, conversations
            └── ChatWindow.jsx # Message area, input, emoji picker
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- MongoDB (local or [MongoDB Atlas](https://www.mongodb.com/atlas))

### 1. Clone & Install

```bash
git clone https://github.com/yourusername/nexify.git
cd nexify

# Install all dependencies at once
npm run install:all
```

### 2. Configure Environment

```bash
# Copy the example env file for the server
cp server/.env.example server/.env
```

Edit `server/.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/nexify
JWT_SECRET=your_super_secret_key_here
CLIENT_URL=http://localhost:3000
```

For the React client, create `client/.env`:
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
```

### 3. Run Development Servers

```bash
# Run both frontend and backend together
npm run dev

# Or run separately:
npm run dev:server    # Backend on :5000
npm run dev:client    # Frontend on :3000
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🗄️ Database Schemas

### User
```js
{
  userId: String,        // Unique ID (e.g. "john_doe") — login identity
  username: String,      // Display name
  password: String,      // Bcrypt hashed
  avatar: String,        // Profile picture URL
  bio: String,
  contacts: [String],    // Array of userIds
  isOnline: Boolean,
  lastSeen: Date,
  socketId: String       // Active socket connection
}
```

### Message
```js
{
  senderId: String,      // userId of sender
  receiverId: String,    // userId of receiver
  message: String,       // Message content (max 2000 chars)
  status: String,        // 'sent' | 'delivered' | 'read'
  timestamp: Date
}
```

---

## 🔌 Socket.IO Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `send_message` | Client → Server | Send a new message |
| `receive_message` | Server → Client | New incoming message |
| `message_sent` | Server → Client | Confirmation to sender |
| `typing_start` | Client → Server | User started typing |
| `typing_stop` | Client → Server | User stopped typing |
| `user_typing` | Server → Client | Broadcast typing status |
| `messages_read` | Client → Server | Mark messages as read |
| `messages_read_by` | Server → Client | Read receipt update |
| `online_users` | Server → Client | List of online users |
| `contact_status_change` | Server → Client | Contact went online/offline |

---

## 🌐 REST API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |
| PATCH | `/api/auth/profile` | Update profile |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/search?q=` | Search users by ID |
| GET | `/api/users/:userId` | Get user profile |
| GET | `/api/users/contacts/list` | Get contact list |
| POST | `/api/users/contact/add` | Add a contact |
| DELETE | `/api/users/contact/:id` | Remove a contact |

### Messages
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/messages/:userId` | Get chat history |
| GET | `/api/messages/conversations/list` | Get all conversations |
| DELETE | `/api/messages/:messageId` | Delete a message |

---

## 🔮 Bonus Features Roadmap

- [ ] 👤 Profile picture upload (Cloudinary)
- [ ] 🖼️ Image/file sharing in chat
- [ ] 👥 Group chats
- [ ] 🔔 Push notifications
- [ ] 🌙 Dark mode toggle
- [ ] 🔒 End-to-end encryption
- [ ] 📍 Message reactions

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router v6 |
| Styling | Tailwind CSS, Custom CSS animations |
| Real-time | Socket.IO Client v4 |
| HTTP Client | Axios |
| Backend | Node.js, Express.js |
| WebSockets | Socket.IO Server v4 |
| Database | MongoDB, Mongoose |
| Auth | JWT, bcryptjs |

Screenshots: 
Login/ REGISTER Page:
![Login](https://github.com/Akshta31/Nexify-Real-Time-Chat-Application/blob/c8ea9846dd2771da038dfbafe1c5cf14e63e8599/Screenshots/login.png)

 Real Time Chat:
 ![Alt Text](image-url)
 





