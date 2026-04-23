import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center auth-bg">
        <div className="text-center fade-up">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-sky-200">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" fill="white"/>
            </svg>
          </div>
          <p className="font-display font-bold text-xl logo-text">Nexify</p>
          <svg className="animate-spin w-5 h-5 text-sky-400 mx-auto mt-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
        </div>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
