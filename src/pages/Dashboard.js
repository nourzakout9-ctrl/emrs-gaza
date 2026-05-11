// src/pages/Dashboard.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../context/LangContext";
import { getAllRequests, getHospitals } from "../firebase/service";
import Layout from "../components/Layout";

const SB = s => ({Pending:"b-amber",Accepted:"b-green","In Progress":"b-blue",Completed:"b-green",Rejected:"b-red",Cancelled:"b-gray"}[s]||"b-gray");
const SVG = {
  alert:<svg viewBox="0 0 24 24"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>,
  clock:<svg viewBox="0 0 24 24"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm.5 5v5.2l4.3 2.5-.7 1.3L11 13V7h1.5z"/></svg>,
  check:<svg viewBox="0 0 24 24"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-2 14.5l-4-4 1.4-1.4 2.6 2.6 5.6-5.6L17 9.5l-7 7z"/></svg>,
  bed:<svg viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5V4H5v16h5zm-2-9H6v-2h2V7h2v2h2v2h-2v2H8v-2z"/></svg>,
};

export default function Dashboard() {
  const { effectiveRole } = useAuth();
  const { t, lang } = useLang();
  const navigate = useNavigate();
  const [requests,  setRequests]  = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => { load(); }, [effectiveRole]);

  async function load() {
    setLoading(true);
    const [r, h] = await Promise.all([getAllRequests(), getHospitals()]);
    setRequests(r); setHospitals(h); setLoading(false);
  }

  const pending = requests.filter(r => r.status === "Pending").length;
  const active  = requests.filter(r => ["Accepted","In Progress"].includes(r.status)).length;
  const beds    = hospitals.reduce((s,h) => s + (h.availableBeds||0), 0);
  const openH   = hospitals.filter(h => h.status === "Open").length;

  const stLabel = s => ({
    Pending:t("pending"), Accepted:t("accepted"), "In Progress":t("inProgress"),
    Completed:t("completed"), Rejected:t("rejected"), Cancelled:t("cancelled")
  }[s] || s);

  const heroes = {
    hospital: { title:t("hospitalDashboard"), sub:t("hospitalDashboardSub"), btns:[{l:t("viewRequests"),a:()=>navigate("/requests")},{l:t("hospitalStatus")+" →",a:()=>navigate("/hospitals"),o:true}] },
    admin:    { title:t("adminPanel"), sub:t("adminPanelSub"), btns:[{l:t("monitorRequestsBtn"),a:()=>navigate("/requests")},{l:t("systemReports")+" →",a:()=>navigate("/reports"),o:true}] },
  };
  const hero = heroes[effectiveRole] || heroes.hospital;

  return (
    <Layout title={t("dashboard")} pendingCount={pending}>
      {loading ? <div className="loading"><div className="spin"/><span>{t("loading")}</span></div> : <>
        <div className="hero-banner">
          <div className="hb-title">{hero.title}</div>
          <div className="hb-sub">{hero.sub}</div>
          <div className="hb-btns">
            {hero.btns.map((b,i) => <button key={i} className={b.o?"hb-btn-o":"hb-btn"} onClick={b.a}>{b.l}</button>)}
          </div>
        </div>
        <div className="stats-row">
          <div className="stat s-red"><div className="st-ico">{SVG.alert}</div><div className="st-lbl">{t("totalRequests")}</div><div className="st-val">{requests.length}</div><div className="st-sub">{t("allTime")}</div></div>
          <div className="stat s-amber"><div className="st-ico">{SVG.clock}</div><div className="st-lbl">{t("pending")}</div><div className="st-val">{pending}</div><div className="st-sub">{t("awaitingResponse")}</div></div>
          <div className="stat s-green"><div className="st-ico">{SVG.check}</div><div className="st-lbl">{t("activeCases")}</div><div className="st-val">{active}</div><div className="st-sub">{t("beingHandled")}</div></div>
          <div className="stat s-blue"><div className="st-ico">{SVG.bed}</div><div className="st-lbl">{t("availableBeds")}</div><div className="st-val">{beds}</div><div className="st-sub">{openH} {t("hospitalsOpen")}</div></div>
        </div>
        <div className="card">
          <div className="card-head">
            <div className="card-title">{t("recentRequests")}</div>
            <button className="btn btn-outline btn-sm" onClick={() => navigate("/requests")}>{t("viewAll")}</button>
          </div>
          {requests.length === 0
            ? <div className="empty"><svg viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/></svg><h3>{t("noRequestsYet")}</h3><p>{t("requestsWillAppear")}</p></div>
            : <div className="tbl-wrap"><table>
                <thead><tr><th>{t("type")}</th><th>{t("patient")}</th><th>{t("phone")}</th><th>{t("hospital")}</th><th>{t("status")}</th><th>{t("priorityLabel")}</th></tr></thead>
                <tbody>{requests.slice(0,5).map(r => (
                  <tr key={r.id}>
                    <td style={{fontWeight:600}}>{lang==="ar" && r.emergencyTypeAr ? r.emergencyTypeAr : r.emergencyType}</td>
                    <td>{r.patientName}</td>
                    <td style={{fontSize:12.5,color:"var(--g400)"}}><span className="phone-num">{r.phone}</span></td>
                    <td style={{fontSize:12.5,maxWidth:150}}>{lang==="ar" && r.hospitalNameAr ? r.hospitalNameAr : r.hospitalName}</td>
                    <td><span className={`badge ${SB(r.status)}`}><span className="bd"/>{stLabel(r.status)}</span></td>
                    <td><span className={`p-${r.priority}`}>{r.priority==="High"?t("high").split("—")[0].trim():r.priority==="Medium"?t("medium").split("—")[0].trim():t("low").split("—")[0].trim()}</span></td>
                  </tr>
                ))}</tbody>
              </table></div>}
        </div>
      </>}
    </Layout>
  );
}
