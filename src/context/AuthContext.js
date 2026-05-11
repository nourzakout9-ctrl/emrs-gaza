// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from "react";
import { getUserByUsername, updateUser } from "../firebase/service";

const Ctx = createContext();
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("emrs_session");
      if (saved) setUser(JSON.parse(saved));
    } catch {}
    setLoading(false);
  }, []);

  async function login(username, password) {
    const u = await getUserByUsername(username.trim());
    if (!u) throw new Error("Username not found.");
    if (u.password !== password) throw new Error("Incorrect password.");
    if (u.active === false) throw new Error("This account is disabled.");
    const session = { ...u, activeView: u.role };
    localStorage.setItem("emrs_session", JSON.stringify(session));
    setUser(session);
    return session;
  }

  function switchView(view) {
    const updated = { ...user, activeView: view };
    localStorage.setItem("emrs_session", JSON.stringify(updated));
    setUser(updated);
  }

  async function changePassword(newPw) {
    await updateUser(user.id, { password: newPw });
    const updated = { ...user, password: newPw };
    localStorage.setItem("emrs_session", JSON.stringify(updated));
    setUser(updated);
  }

  function logout() {
    localStorage.removeItem("emrs_session");
    setUser(null);
  }

  const effectiveRole = user?.activeView || user?.role || null;

  return (
    <Ctx.Provider value={{ user, effectiveRole, loading, login, logout, switchView, changePassword }}>
      {!loading && children}
    </Ctx.Provider>
  );
}
