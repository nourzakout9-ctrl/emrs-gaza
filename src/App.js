// src/App.js
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { LangProvider } from "./context/LangContext";
import Landing   from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import Requests  from "./pages/Requests";
import Hospitals from "./pages/Hospitals";
import Staff     from "./pages/Staff";
import Reports   from "./pages/Reports";
import "./index.css";

function Guard({ children, adminOnly }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading"><div className="spin"/></div>;
  if (!user)   return <Navigate to="/" replace />;
  if (adminOnly && user.role !== "admin") return <Navigate to="/dashboard" replace />;
  return children;
}

function GuestOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading"><div className="spin"/></div>;
  return user ? <Navigate to="/dashboard" replace /> : children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/"           element={<GuestOnly><Landing /></GuestOnly>} />
      <Route path="/dashboard"  element={<Guard><Dashboard /></Guard>} />
      <Route path="/requests"   element={<Guard><Requests /></Guard>} />
      <Route path="/hospitals"  element={<Guard><Hospitals /></Guard>} />
      <Route path="/staff"      element={<Guard adminOnly><Staff /></Guard>} />
      <Route path="/reports"    element={<Guard adminOnly><Reports /></Guard>} />
      <Route path="*"           element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <LangProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </LangProvider>
  );
}
