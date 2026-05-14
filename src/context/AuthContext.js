// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from "react";
import { getUserByUsername, updateUser } from "../firebase/service";

const Ctx = createContext();
export const useAuth = () => useContext(Ctx);

// مدّة الجلسة بالميلي ثانية
const SESSION_MAX_AGE  = 24 * 60 * 60 * 1000;  // 24 ساعة كحدّ أقصى
const SESSION_IDLE_MAX = 2  * 60 * 60 * 1000;  // ساعتين إذا أغلق المتصفح

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  // عند فتح الصفحة: تحقق من صلاحية الجلسة
  useEffect(() => {
    try {
      const saved = localStorage.getItem("emrs_session");
      if (saved) {
        const session = JSON.parse(saved);
        const now = Date.now();
        const loginTime = session.loginTime || 0;
        const lastActive = session.lastActive || 0;
        
        // فحص 1: هل مضى أكثر من 24 ساعة منذ تسجيل الدخول؟
        if (now - loginTime > SESSION_MAX_AGE) {
          localStorage.removeItem("emrs_session");
          setLoading(false);
          return;
        }
        
        // فحص 2: هل مضى أكثر من ساعتين من آخر نشاط؟
        if (now - lastActive > SESSION_IDLE_MAX) {
          localStorage.removeItem("emrs_session");
          setLoading(false);
          return;
        }
        
        // الجلسة صالحة — حدّث آخر نشاط
        session.lastActive = now;
        localStorage.setItem("emrs_session", JSON.stringify(session));
        setUser(session);
      }
    } catch {}
    setLoading(false);
  }, []);

  // تتبّع نشاط المستخدم وتحديث lastActive كل دقيقة
  useEffect(() => {
    if (!user) return;
    
    function updateActivity() {
      try {
        const saved = localStorage.getItem("emrs_session");
        if (saved) {
          const session = JSON.parse(saved);
          session.lastActive = Date.now();
          localStorage.setItem("emrs_session", JSON.stringify(session));
        }
      } catch {}
    }
    
    // حدّث عند أي تفاعل
    const events = ["mousedown", "keydown", "scroll", "click"];
    events.forEach(e => window.addEventListener(e, updateActivity));
    
    // فحص دوري كل دقيقة: إذا انتهت الجلسة، اطرد المستخدم
    const interval = setInterval(() => {
      try {
        const saved = localStorage.getItem("emrs_session");
        if (saved) {
          const session = JSON.parse(saved);
          const now = Date.now();
          if (now - session.loginTime > SESSION_MAX_AGE) {
            alert("انتهت جلستك. الرجاء تسجيل الدخول مرة أخرى.\nYour session has expired. Please sign in again.");
            logout();
          }
        }
      } catch {}
    }, 60 * 1000);
    
    return () => {
      events.forEach(e => window.removeEventListener(e, updateActivity));
      clearInterval(interval);
    };
  }, [user]);

  async function login(username, password) {
    const u = await getUserByUsername(username.trim());
    if (!u) throw new Error("Username not found.");
    if (u.password !== password) throw new Error("Incorrect password.");
    if (u.active === false) throw new Error("This account is disabled.");
    const now = Date.now();
    const session = { 
      ...u, 
      activeView: u.role,
      loginTime: now,
      lastActive: now
    };
    localStorage.setItem("emrs_session", JSON.stringify(session));
    setUser(session);
    return session;
  }

  function switchView(view) {
    const updated = { ...user, activeView: view, lastActive: Date.now() };
    localStorage.setItem("emrs_session", JSON.stringify(updated));
    setUser(updated);
  }

  async function changePassword(newPw) {
    await updateUser(user.id, { password: newPw });
    const updated = { ...user, password: newPw, lastActive: Date.now() };
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