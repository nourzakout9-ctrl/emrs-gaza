// src/pages/Reports.js
import React, { useEffect, useState } from "react";
import { getAllRequests, getHospitals } from "../firebase/service";
import { useLang } from "../context/LangContext";
import Layout from "../components/Layout";

export default function Reports() {
  const { t, lang } = useLang();
  const [requests,  setRequests]  = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    async function load() {
      const [r,h] = await Promise.all([getAllRequests(),getHospitals()]);
      setRequests(r); setHospitals(h); setLoading(false);
    }
    load();
  }, []);

  const total = requests.length || 1;
  const comp  = requests.filter(r=>r.status==="Completed").length;
  const acc   = requests.filter(r=>["Accepted","In Progress","Completed"].includes(r.status)).length;
  const openH = hospitals.filter(h=>h.status==="Open").length;

  const STATUSES = ["Pending","Accepted","In Progress","Completed","Rejected","Cancelled"];
  const S_COLORS = {Pending:"#D97706",Accepted:"#16A34A","In Progress":"#2563EB",Completed:"#16A34A",Rejected:"#DC2626",Cancelled:"#6B7280"};
  const stLabel = s => ({Pending:t("pending"),Accepted:t("accepted"),"In Progress":t("inProgress"),Completed:t("completed"),Rejected:t("rejected"),Cancelled:t("cancelled")}[s]||s);
  const TYPES = [...new Set(requests.map(r=>r.emergencyType).filter(Boolean))];
  const stB = s => s==="Open"?"b-green":s==="Moderate"?"b-amber":"b-red";
  const stHospLabel = s => s==="Open"?t("open"):s==="Moderate"?t("moderate"):t("overloaded");

  const SVG = {
    alert:<svg viewBox="0 0 24 24"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>,
    check:<svg viewBox="0 0 24 24"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-2 14.5l-4-4 1.4-1.4 2.6 2.6 5.6-5.6L17 9.5l-7 7z"/></svg>,
    flag:<svg viewBox="0 0 24 24"><path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6h-5.6z"/></svg>,
    hosp:<svg viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5V4H5v16h5zm-2-9H6v-2h2V7h2v2h2v2h-2v2H8v-2z"/></svg>,
  };

  return (
    <Layout title={t("systemReports")}>
      <div className="page-head">
        <div className="page-title">{t("systemReports")}</div>
        <div className="page-sub">{t("reportsSub")}</div>
      </div>
      {loading?<div className="loading"><div className="spin"/><span>{t("loading")}</span></div>:<>
        <div className="stats-row">
          <div className="stat s-red"><div className="st-ico">{SVG.alert}</div><div className="st-lbl">{t("totalRequests")}</div><div className="st-val">{requests.length}</div><div className="st-sub">{t("allTime")}</div></div>
          <div className="stat s-green"><div className="st-ico">{SVG.check}</div><div className="st-lbl">{t("acceptanceRate")}</div><div className="st-val">{Math.round(acc/total*100)}%</div><div className="st-sub">{acc} {t("accepted").toLowerCase()}</div></div>
          <div className="stat s-blue"><div className="st-ico">{SVG.flag}</div><div className="st-lbl">{t("completionRate")}</div><div className="st-val">{Math.round(comp/total*100)}%</div><div className="st-sub">{comp} {t("completed").toLowerCase()}</div></div>
          <div className="stat s-amber"><div className="st-ico">{SVG.hosp}</div><div className="st-lbl">{t("openHospitals")}</div><div className="st-val">{openH}</div><div className="st-sub">{t("ofTotal")} {hospitals.length}</div></div>
        </div>

        <div className="report-grid" style={{marginBottom:20}}>
          <div className="card">
            <div className="card-head"><div className="card-title">{t("requestsByStatus")}</div></div>
            <div className="card-body"><div className="barchart">
              {STATUSES.map(s=>{
                const cnt=requests.filter(r=>r.status===s).length;
                const pct=Math.round(cnt/total*100);
                return(<div key={s}>
                  <div className="bl"><span>{stLabel(s)}</span><span>{cnt} ({pct}%)</span></div>
                  <div className="bt"><div className="bf" style={{width:`${Math.min(pct*3,100)}%`,background:S_COLORS[s]}}/></div>
                </div>);
              })}
            </div></div>
          </div>

          <div className="card">
            <div className="card-head"><div className="card-title">{t("requestsByType")}</div></div>
            <div className="card-body">
              {TYPES.length===0?<div style={{color:"var(--g400)",fontSize:13,textAlign:"center",padding:"20px 0"}}>{t("noDataYet")}</div>
              :<div className="barchart">{TYPES.map(ty=>{
                const cnt=requests.filter(r=>r.emergencyType===ty).length;
                const pct=Math.round(cnt/total*100);
                return(<div key={ty}>
                  <div className="bl"><span>{lang==="ar" ? ({"Cardiac Arrest":"سكتة قلبية","Trauma / Injury":"إصابة / صدمة","Pediatric Emergency":"طوارئ أطفال","Respiratory Distress":"ضيق تنفسي","Stroke":"جلطة دماغية","Burns":"حروق","Fracture":"كسر","Other":"أخرى"}[ty] || ty) : ty}</span><span>{cnt}</span></div>
                  <div className="bt"><div className="bf" style={{width:`${Math.min(pct*5,100)}%`,background:"var(--red)"}}/></div>
                </div>);
              })}</div>}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-head"><div className="card-title">{t("hospitalPerformance")}</div></div>
          <div className="tbl-wrap"><table>
            <thead><tr><th>{t("hospital")}</th><th>{t("zone")}</th><th>{t("status")}</th><th>{t("availableBeds")}</th><th>{t("capacityUsed")}</th><th>{t("specialties")}</th></tr></thead>
            <tbody>{hospitals.map(h=>{
              const pct=Math.round(((h.emergencyCapacity-h.availableBeds)/h.emergencyCapacity)*100);
              const cc=pct<50?"c-lo":pct<80?"c-md":"c-hi";
              return(<tr key={h.id}>
                <td><div style={{fontWeight:700}}>{lang==="ar" && h.nameAr ? h.nameAr : h.name}</div><div style={{fontSize:12,color:"var(--g400)"}}>📍 {lang==="ar" && h.locationAr ? h.locationAr : h.location}</div></td>
                <td><span style={{background:"var(--g100)",padding:"2px 9px",borderRadius:20,fontSize:11.5,fontWeight:600,color:"var(--g600)",textTransform:"capitalize"}}>{
  lang==="ar" ? ({north:"الشمال",gaza:"غزة",central:"الوسطى",south:"الجنوب",farsouth:"رفح"}[h.zone] || "—") : (h.zone || "—")
}</span></td>
                <td><span className={`badge ${stB(h.status)}`}><span className="bd"/>{stHospLabel(h.status)}</span></td>
                <td style={{fontWeight:700,color:"var(--green)"}}>{h.availableBeds}</td>
                <td><div style={{display:"flex",alignItems:"center",gap:8}}><div className="cap-bar" style={{width:90,margin:0}}><div className={`cap-fill ${cc}`} style={{width:`${pct}%`}}/></div><span style={{fontSize:12.5,fontWeight:600}}>{pct}%</span></div></td>
                <td style={{fontSize:12.5,color:"var(--g600)"}}>{lang==="ar" && h.specialtiesAr ? h.specialtiesAr : h.specialties}</td>
              </tr>);
            })}</tbody>
          </table></div>
        </div>
      </>}
    </Layout>
  );
}
