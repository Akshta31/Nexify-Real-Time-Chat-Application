import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import ProtectedRoute from './components/ProtectedRoute';
import AuthPage from './pages/AuthPage';
import ChatPage from './pages/ChatPage';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#fff',
                color: '#334155',
                borderRadius: '16px',
                border: '1px solid #e0f2fe',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: '14px',
                boxShadow: '0 4px 24px rgba(56,189,248,0.15)',
              },
              success: { iconTheme: { primary: '#0ea5e9', secondary: '#fff' } },
              error: { iconTheme: { primary: '#f43f5e', secondary: '#fff' } },
            }}
          />
          <Routes>
            <Route path="/login" element={<AuthPage />} />
            <Route path="/" element={
              <ProtectedRoute>
                <ChatPage />
              </ProtectedRoute>
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
