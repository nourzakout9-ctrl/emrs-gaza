// src/pages/Requests.js
import React, { useEffect, useState } from "react";
import { getAllRequests, updateRequestStatus, deleteRequest, getHospitals, getTopHospitals } from "../firebase/service";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../context/LangContext";
import Layout from "../components/Layout";

const SB = s => ({Pending:"b-amber",Accepted:"b-green","In Progress":"b-blue",Completed:"b-green",Rejected:"b-red",Cancelled:"b-gray","Ambulance Dispatched":"b-red"}[s]||"b-gray");

export default function Requests() {
  const { effectiveRole } = useAuth();
  const { t, lang } = useLang();
  const [requests,    setRequests]    = useState([]);
  const [hospitals,   setHospitals]   = useState([]);
  const [filter,      setFilter]      = useState("All");
  const [loading,     setLoading]     = useState(true);
  const [detail,      setDetail]      = useState(null);
  const [acceptModal, setAcceptModal] = useState(null);
  const [topHosps,    setTopHosps]    = useState([]);
  const [selHosp,     setSelHosp]     = useState("");
  const [toast,       setToast]       = useState(null);
  const [accepting,   setAccepting]   = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const [r, h] = await Promise.all([getAllRequests(), getHospitals()]);
    setRequests(r); setHospitals(h); setLoading(false);
  }

  function showToast(msg, ok=true) { setToast({msg,ok}); setTimeout(()=>setToast(null),3500); }

  function openAccept(req) {
    const top = getTopHospitals(hospitals, req.emergencyType, req.location);
    setTopHosps(top);
    setSelHosp(top[0]?.id || "");
    setAcceptModal(req);
  }

  async function confirmAccept() {
    if (!selHosp) { showToast(t("selectHospitalFirst"), false); return; }
    setAccepting(true);
    const hosp = hospitals.find(h => h.id === selHosp);
    await updateRequestStatus(acceptModal.id, "Accepted", {
      hospitalId:      hosp.id,
      hospitalName:    hosp.name,
      hospitalNameAr:  hosp.nameAr || "",
      hospitalContact: hosp.contact || "",
    });
    setAcceptModal(null);
    showToast(`${t("requestAccepted")} → ${hosp.name}`);
    if (detail?.id === acceptModal.id) setDetail(prev => ({...prev, status:"Accepted", hospitalName:hosp.name, hospitalNameAr:hosp.nameAr}));
    setAccepting(false);
    load();
  }

  async function doStatus(id, status) {
    await updateRequestStatus(id, status);
    showToast(`${status}`);
    if (detail?.id === id) setDetail(prev => ({...prev, status}));
    load();
  }

  async function doCancel(id) {
    const reason = window.prompt(
      lang === "ar" 
        ? "سبب الإلغاء (اختياري):" 
        : "Reason for cancellation (optional):"
    );
    if (reason === null) return; // user clicked Cancel on prompt
    await updateRequestStatus(id, "Cancelled", { 
      cancellationReason: reason || (lang === "ar" ? "بدون سبب محدد" : "No reason given") 
    });
    showToast(lang === "ar" ? "تم إلغاء الطلب" : "Request cancelled");
    if (detail?.id === id) setDetail(prev => ({...prev, status: "Cancelled", cancellationReason: reason}));
    load();
  }

  async function doDelete(id) {
    if (!window.confirm(t("reqDelete"))) return;
    await deleteRequest(id);
    showToast(t("requestDeleted"));
    setDetail(null);
    load();
  }

  const FILTERS = ["All","Pending","Accepted","In Progress","Completed","Rejected","Cancelled"];
  const filterLabel = f => ({
    All:t("all"), Pending:t("pending"), Accepted:t("accepted"), "In Progress":t("inProgress"),
    Completed:t("completed"), Rejected:t("rejected"), Cancelled:t("cancelled"),
    "Ambulance Dispatched":t("ambulanceDispatched")
  }[f] || f);
  const stLabel = s => filterLabel(s);
  const stHospLabel = s => s==="Open"?t("open"):s==="Moderate"?t("moderate"):t("overloaded");

  const STEPS = [
    {l:t("step1Title"), d:t("step1Desc"), ok:["Pending","Accepted","In Progress","Completed","Rejected","Cancelled"]},
    {l:t("step2Title"), d:t("step2Desc"), ok:["Accepted","In Progress","Completed","Rejected"]},
    {l:t("step3Title"), d:t("step3Desc"), ok:["Accepted","In Progress","Completed","Rejected"]},
    {l:t("step4Title"), d:t("step4Desc"), ok:["Accepted","In Progress","Completed"]},
    {l:t("step5Title"), d:t("step5Desc"), ok:["In Progress","Completed"]},
    {l:t("step6Title"), d:t("step6Desc"), ok:["Completed"]},
  ];

  const shown   = filter === "All" ? requests : requests.filter(r => r.status === filter);
  const pending = requests.filter(r => r.status === "Pending").length;
  const title   = effectiveRole === "admin" ? t("monitorRequests") : t("emergencyRequests");

  return (
    <Layout title={title} pendingCount={pending}>
      <div className="page-head">
        <div className="page-title">{title}</div>
        <div className="page-sub">{shown.length} {t("requestsCount")} · {pending} {t("pendingCount")}</div>
      </div>

      <div className="filters">
        {FILTERS.map(f => <button key={f} className={`fb${filter===f?" on":""}`} onClick={()=>setFilter(f)}>{filterLabel(f)}</button>)}
      </div>

      <div className="card">
        {loading ? <div className="loading"><div className="spin"/></div>
        : shown.length === 0
          ? <div className="empty"><svg viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/></svg><h3>{t("noRequestsFound")}</h3><p>{t("nothingMatches")}</p></div>
          : <div className="tbl-wrap"><table>
              <thead><tr><th>{t("type")}</th><th>{t("patient")}</th><th>{t("locationLabel")}</th><th>{t("assignedHospital")}</th><th>{t("status")}</th><th>{t("priorityLabel")}</th><th>{t("date")}</th><th>{t("actions")}</th></tr></thead>
              <tbody>{shown.map(r => (
                <tr key={r.id}>
                  <td style={{fontWeight:600}}>{lang==="ar" && r.emergencyTypeAr ? r.emergencyTypeAr : r.emergencyType}</td>
                  <td><div style={{fontWeight:600}}>{r.patientName}</div><div style={{fontSize:12,color:"var(--g400)"}}><span className="phone-num">{r.phone}</span></div></td>
                  <td style={{fontSize:12.5,color:"var(--g500)",maxWidth:110}}>{lang==="ar" && r.locationAr ? r.locationAr : r.location}</td>
                  <td style={{fontSize:12.5,maxWidth:130}}>{lang==="ar" && r.hospitalNameAr ? r.hospitalNameAr : r.hospitalName}</td>
                  <td><span className={`badge ${SB(r.status)}`}><span className="bd"/>{stLabel(r.status)}</span></td>
                  <td><span className={`p-${r.priority}`}>{r.priority}</span></td>
                  <td style={{fontSize:12,color:"var(--g400)",whiteSpace:"nowrap"}}>{r.createdAt?.toDate?r.createdAt.toDate().toLocaleDateString():"—"}</td>
                  <td><div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                    {effectiveRole==="hospital"&&r.status==="Pending"&&<>
                      <button className="btn btn-green btn-sm" onClick={()=>openAccept(r)}>{t("accept")}</button>
                      <button className="btn btn-danger btn-sm" onClick={()=>doStatus(r.id,"Rejected")}>{t("reject")}</button>
                      <button className="btn btn-gray btn-sm" onClick={()=>doCancel(r.id)}>{lang==="ar"?"إلغاء":"Cancel"}</button>
                    </>}
                    {effectiveRole==="hospital"&&r.status==="Accepted"&&<>
                      <button className="btn btn-sm" style={{background:"var(--blue)",color:"white"}} onClick={()=>doStatus(r.id,"In Progress")}>{t("start")}</button>
                      <button className="btn btn-gray btn-sm" onClick={()=>doCancel(r.id)}>{lang==="ar"?"إلغاء":"Cancel"}</button>
                    </>}
                    {effectiveRole==="hospital"&&r.status==="In Progress"&&<button className="btn btn-green btn-sm" onClick={()=>doStatus(r.id,"Completed")}>{t("complete")}</button>}
                    <button className="btn btn-outline btn-sm" onClick={()=>setDetail(r)}>{t("view")}</button>
                    {effectiveRole==="admin"&&<button className="btn btn-danger btn-sm" onClick={()=>doDelete(r.id)}>{t("delete")}</button>}
                  </div></td>
                </tr>
              ))}</tbody>
            </table></div>
        }
      </div>

      {/* ACCEPT MODAL */}
      {acceptModal && (
        <div className="modal-ov" onClick={()=>setAcceptModal(null)}>
          <div className="modal" style={{maxWidth:560}} onClick={e=>e.stopPropagation()}>
            <div className="modal-head">
              <div className="modal-title" style={{color:"var(--green)"}}>✅ {t("acceptEmergency")}</div>
              <button className="modal-x" onClick={()=>setAcceptModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{background:"var(--g50)",borderRadius:10,padding:14,marginBottom:18,border:"1px solid var(--border)"}}>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  <div><div style={{fontSize:10.5,color:"var(--g400)",fontWeight:600,textTransform:"uppercase",letterSpacing:".05em",marginBottom:2}}>{t("patientLabel")}</div><div style={{fontWeight:600,fontSize:13.5}}>{acceptModal.patientName}</div></div>
                  <div><div style={{fontSize:10.5,color:"var(--g400)",fontWeight:600,textTransform:"uppercase",letterSpacing:".05em",marginBottom:2}}>{t("emergencyType")}</div><div style={{fontWeight:600,fontSize:13.5}}>{acceptModal.emergencyType}</div></div>
                  <div><div style={{fontSize:10.5,color:"var(--g400)",fontWeight:600,textTransform:"uppercase",letterSpacing:".05em",marginBottom:2}}>{t("locationLabel")}</div><div style={{fontSize:13}}>{lang==="ar" && acceptModal.locationAr ? acceptModal.locationAr : acceptModal.location}</div></div>
                  <div><div style={{fontSize:10.5,color:"var(--g400)",fontWeight:600,textTransform:"uppercase",letterSpacing:".05em",marginBottom:2}}>{t("priorityLabel")}</div><div className={`p-${acceptModal.priority}`}>{acceptModal.priority}</div></div>
                </div>
              </div>

              <div style={{fontWeight:700,fontSize:13,color:"var(--g800)",marginBottom:12}}>🏥 {t("selectHospitalForCase")}</div>
              <div style={{fontSize:12.5,color:"var(--g500)",marginBottom:14}}>{t("rankedBy")}</div>

              {topHosps.length > 0 && (
                <div style={{marginBottom:14}}>
                  <div style={{fontSize:11,fontWeight:700,color:"var(--blue)",textTransform:"uppercase",letterSpacing:".06em",marginBottom:8}}>{t("recommended")}</div>
                  {topHosps.map(h => {
                    const isSelected = selHosp === h.id;
                    return (
                      <div key={h.id} onClick={()=>setSelHosp(h.id)}
                        style={{border:`2px solid ${isSelected?"var(--blue)":"var(--border)"}`,background:isSelected?"var(--blue-l)":"var(--white)",borderRadius:9,padding:"11px 14px",marginBottom:8,cursor:"pointer",transition:"all .15s",display:"flex",alignItems:"center",gap:12}}>
                        <div style={{width:18,height:18,borderRadius:"50%",border:`2px solid ${isSelected?"var(--blue)":"var(--g300)"}`,background:isSelected?"var(--blue)":"white",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                          {isSelected && <div style={{width:8,height:8,borderRadius:"50%",background:"white"}}/>}
                        </div>
                        <div style={{flex:1}}>
                          <div style={{fontWeight:700,fontSize:13.5,color:"var(--g900)"}}>{lang==="ar" && h.nameAr ? h.nameAr : h.name}</div>
                          <div style={{fontSize:11.5,color:"var(--g500)",display:"flex",gap:12,flexWrap:"wrap",marginTop:2}}>
                            <span>📍 {lang==="ar" && h.locationAr ? h.locationAr : h.location}</span>
                            <span style={{color:"var(--green)",fontWeight:600}}>🛏 {h.availableBeds} {t("avBeds")}</span>
                          </div>
                        </div>
                        <span className={`badge ${h.status==="Open"?"b-green":h.status==="Moderate"?"b-amber":"b-red"}`}>{stHospLabel(h.status)}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              <div style={{fontSize:11,fontWeight:700,color:"var(--g500)",textTransform:"uppercase",letterSpacing:".06em",marginBottom:8}}>{t("allHospitals")}</div>
              <div style={{maxHeight:200,overflowY:"auto",border:"1px solid var(--border)",borderRadius:9}}>
                {hospitals.filter(h=>h.availableBeds>0&&h.status!=="Overloaded"&&!topHosps.find(tt=>tt.id===h.id)).map(h => {
                  const isSelected = selHosp === h.id;
                  return (
                    <div key={h.id} onClick={()=>setSelHosp(h.id)}
                      style={{padding:"9px 14px",cursor:"pointer",transition:"background .12s",background:isSelected?"var(--blue-l)":"white",borderBottom:"1px solid var(--g100)",display:"flex",alignItems:"center",gap:10}}>
                      <div style={{width:16,height:16,borderRadius:"50%",border:`2px solid ${isSelected?"var(--blue)":"var(--g300)"}`,background:isSelected?"var(--blue)":"white",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                        {isSelected && <div style={{width:6,height:6,borderRadius:"50%",background:"white"}}/>}
                      </div>
                      <div style={{flex:1}}>
                        <div style={{fontWeight:600,fontSize:13}}>{lang==="ar" && h.nameAr ? h.nameAr : h.name}</div>
                        <div style={{fontSize:11.5,color:"var(--g400)"}}>{lang==="ar" && h.locationAr ? h.locationAr : h.location} · {h.availableBeds} {t("avBeds")}</div>
                      </div>
                      <span className={`badge ${h.status==="Open"?"b-green":"b-amber"}`}>{stHospLabel(h.status)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="modal-foot">
              <button className="btn btn-gray" onClick={()=>setAcceptModal(null)}>{t("cancel")}</button>
              <button className="btn btn-green" onClick={confirmAccept} disabled={!selHosp||accepting}>
                {accepting ? t("accepting") : t("confirmAccept")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {detail && (
        <div className="modal-ov" onClick={()=>setDetail(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-head">
              <div className="modal-title">{t("requestDetails")}</div>
              <button className="modal-x" onClick={()=>setDetail(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,background:"var(--g50)",borderRadius:10,padding:16,marginBottom:16}}>
                {[
                  [t("emergencyType"), detail.emergencyType],
                  [t("priorityLabel"), detail.priority],
                  [t("patientLabel"),  detail.patientName],
                  [t("phone"),         <span className="phone-num">{detail.phone}</span>],
                  [t("locationLabel"), lang==="ar" && detail.locationAr ? detail.locationAr : detail.location],
                  [t("assignedHospital"), lang==="ar" && detail.hospitalNameAr ? detail.hospitalNameAr : detail.hospitalName],
                  [t("hospitalContact"),  detail.hospitalContact ? <span className="phone-num">{detail.hospitalContact}</span> : "—"],
                  [t("submitted"),     detail.createdAt?.toDate ? detail.createdAt.toDate().toLocaleString() : "—"],
                ].map(([l,v]) => (
                  <div key={l}>
                    <div style={{fontSize:10.5,color:"var(--g400)",textTransform:"uppercase",letterSpacing:".06em",fontWeight:600,marginBottom:2}}>{l}</div>
                    <div style={{fontSize:13.5,fontWeight:600}}>{l===t("priorityLabel")?<span className={`p-${v}`}>{v}</span>:v}</div>
                  </div>
                ))}
                <div style={{gridColumn:"1/-1"}}>
                  <div style={{fontSize:10.5,color:"var(--g400)",textTransform:"uppercase",letterSpacing:".06em",fontWeight:600,marginBottom:2}}>{t("statusLabel")}</div>
                  <span className={`badge ${SB(detail.status)}`}><span className="bd"/>{stLabel(detail.status)}</span>
                </div>
                {detail.cancellationReason && (
                  <div style={{gridColumn:"1/-1"}}>
                    <div style={{fontSize:10.5,color:"var(--g400)",textTransform:"uppercase",letterSpacing:".06em",fontWeight:600,marginBottom:2}}>{lang==="ar"?"سبب الإلغاء":"Cancellation Reason"}</div>
                    <div style={{fontSize:13.5,color:"var(--red)",fontWeight:600}}>{detail.cancellationReason}</div>
                  </div>
                )}
                <div style={{gridColumn:"1/-1"}}>
                  <div style={{fontSize:10.5,color:"var(--g400)",textTransform:"uppercase",letterSpacing:".06em",fontWeight:600,marginBottom:2}}>{t("descriptionLabel")}</div>
                  <div style={{fontSize:13.5}}>{detail.description || "—"}</div>
                </div>
              </div>
              <div style={{fontWeight:700,fontSize:11,color:"var(--g500)",textTransform:"uppercase",letterSpacing:".07em",marginBottom:12}}>{t("statusTimeline")}</div>
              <div className="tl-wrap">
                {STEPS.map((step,i,arr)=>{
                  const done=step.ok.includes(detail.status);
                  const now=!done&&(i===0||arr[i-1].ok.includes(detail.status));
                  return(<div className="tl-row" key={i}>
                    <div className={`tl-dot ${done?"t-done":now?"t-now":"t-wait"}`}>{done?"✓":now?"●":"○"}</div>
                    <div className="tl-text"><strong>{step.l}</strong><span>{step.d}</span></div>
                  </div>);
                })}
              </div>
            </div>
            <div className="modal-foot">
              {effectiveRole==="hospital"&&detail.status==="Pending"&&<>
                <button className="btn btn-danger btn-sm" onClick={()=>doStatus(detail.id,"Rejected")}>{t("rejectThis")}</button>
                <button className="btn btn-gray btn-sm" onClick={()=>doCancel(detail.id)}>{lang==="ar"?"إلغاء الطلب":"Cancel Request"}</button>
                <button className="btn btn-green btn-sm" onClick={()=>{setDetail(null);openAccept(detail);}}>{t("acceptSelectHospital")}</button>
              </>}
              {effectiveRole==="hospital"&&detail.status==="Accepted"&&<>
                <button className="btn btn-gray btn-sm" onClick={()=>doCancel(detail.id)}>{lang==="ar"?"إلغاء":"Cancel"}</button>
                <button className="btn btn-sm" style={{background:"var(--blue)",color:"white"}} onClick={()=>doStatus(detail.id,"In Progress")}>{t("markInProgress")}</button>
              </>}
              {effectiveRole==="hospital"&&detail.status==="In Progress"&&<button className="btn btn-green btn-sm" onClick={()=>doStatus(detail.id,"Completed")}>{t("markCompleted")}</button>}
              <button className="btn btn-gray" onClick={()=>setDetail(null)}>{t("close")}</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className={`toast ${toast.ok?"toast-ok":"toast-err"}`}>{toast.msg}</div>}
    </Layout>
  );
}