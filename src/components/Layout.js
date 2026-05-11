// src/components/Layout.js
import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../context/LangContext";
import LangToggle from "./LangToggle";

const CrossIcon = () => <svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 100 20A10 10 0 0012 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/></svg>;
const ICONS = {
  dashboard:<svg viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5V4H5v16h5z"/></svg>,
  requests: <svg viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2"/></svg>,
  hospitals:<svg viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5V4H5v16h5zm-2-9H6v-2h2V7h2v2h2v2h-2v2H8v-2z"/></svg>,
  staff:    <svg viewBox="0 0 24 24"><path d="M16 11c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 3-1.34 3-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>,
  reports:  <svg viewBox="0 0 24 24"><path d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>,
};

export default function Layout({ children, title, pendingCount }) {
  const [open, setOpen] = useState(false);
  const { user, effectiveRole, logout, switchView } = useAuth();
  const { t, lang } = useLang();
  const navigate  = useNavigate();
  const location  = useLocation();

  const NAV = {
    hospital: [
      { path:"/dashboard",  icon:"dashboard", label:t("dashboard") },
      { path:"/requests",   icon:"requests",  label:t("emergencyRequests"), badge:true },
      { path:"/hospitals",  icon:"hospitals", label:t("hospitalStatus") },
    ],
    admin: [
      { path:"/dashboard",  icon:"dashboard", label:t("dashboard") },
      { path:"/requests",   icon:"requests",  label:t("monitorRequests"), badge:true },
      { path:"/hospitals",  icon:"hospitals", label:t("manageHospitals") },
      { path:"/staff",      icon:"staff",     label:t("manageStaff") },
      { path:"/reports",    icon:"reports",   label:t("systemReports") },
    ],
  };

  const nav       = NAV[effectiveRole] || NAV.hospital;
  const initials  = (user?.fullName || "U").split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase();
  const isAdmin   = user?.role === "admin";
  const avColor   = effectiveRole === "admin" ? "var(--blue)" : "var(--red)";

  function go(path) { navigate(path); setOpen(false); }

  return (
    <div className="layout">
      {open && <div className="overlay" onClick={() => setOpen(false)}/>}
      <nav className={`sidebar${open?" open":""}`}>
        <div className="sb-header">
          <div className="sb-logo-mark"><CrossIcon /></div>
          <div>
            <div className="sb-logo-name">{t("appName")}</div>
            <div className="sb-logo-sub">{t("appFull")}</div>
          </div>
        </div>
        <div className="sb-user">
          <div className="sb-avatar" style={{background:avColor}}>{initials}</div>
          <div style={{flex:1,minWidth:0}}>
            <div className="sb-uname">{lang==="ar" && user?.fullNameAr ? user.fullNameAr : user?.fullName}</div>
            <div className="sb-urole">{effectiveRole==="admin"?t("administrator"):t("hospitalStaff")}</div>
          </div>
        </div>

        {isAdmin && (
          <div className="sb-view-switch">
            <div className="sb-sec" style={{padding:"10px 0 5px"}}>{t("viewMode")}</div>
            <button className={`sb-view-btn${effectiveRole==="admin"?" on":""}`}
              onClick={() => { switchView("admin"); go("/dashboard"); }}>
              🛡 {t("administrator")}
            </button>
            <button className={`sb-view-btn${effectiveRole==="hospital"?" on":""}`}
              onClick={() => { switchView("hospital"); go("/dashboard"); }}>
              🏥 {t("hospitalStaff")}
            </button>
          </div>
        )}

        <div className="sb-sec">{t("navigation")}</div>
        {nav.map(item => (
          <div key={item.path}
            className={`sb-item${location.pathname===item.path?" active":""}`}
            onClick={() => go(item.path)}>
            <div className="sb-icon-wrap">{ICONS[item.icon]}</div>
            {item.label}
            {item.badge && pendingCount > 0 && <span className="sb-badge">{pendingCount}</span>}
          </div>
        ))}

        <div className="sb-footer">
          <LangToggle />
          <button className="sb-logout" onClick={() => { logout(); navigate("/"); }}>
            🚪 {t("signOut")}
          </button>
        </div>
      </nav>

      <div className="main">
        <div className="topbar">
          <div className="tb-left">
            <button className="burger" onClick={() => setOpen(true)}>
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/></svg>
            </button>
            <div className="tb-title">{title}</div>
          </div>
          <div className="tb-right">
            <span className="tb-user">{lang==="ar" && user?.fullNameAr ? user.fullNameAr : user?.fullName}</span>
          </div>
        </div>
        <div className="page-wrap">{children}</div>
      </div>
    </div>
  );
}
