// src/pages/Landing.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../context/LangContext";
import { getHospitals, submitRequest, recommendHospital, seedAll } from "../firebase/service";
import LangToggle from "../components/LangToggle";

const CrossIcon  = () => <svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 100 20A10 10 0 0012 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/></svg>;
const PersonIcon = () => <svg viewBox="0 0 24 24"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>;
const ShieldIcon = () => <svg viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.5 3.8 10.7 9 12 5.2-1.3 9-6.5 9-12V5L12 1zm-1 14l-3-3 1.4-1.4L11 12.2l4.6-4.6L17 9l-6 6z"/></svg>;
const HospIcon   = () => <svg viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5V4H5v16h5zm-2-9H6v-2h2V7h2v2h2v2h-2v2H8v-2z"/></svg>;
const AlertIcon  = () => <svg viewBox="0 0 24 24"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>;

export default function Landing() {
  const { login } = useAuth();
  const { t, lang } = useLang();
  const navigate  = useNavigate();

  const [view,        setView]        = useState("landing");
  const [loginModal,  setLoginModal]  = useState(null);
  const [reqModal,    setReqModal]    = useState(false);
  const [hospitals,   setHospitals]   = useState([]);
  const [form,        setForm]        = useState({ username:"", password:"" });
  const [reqForm,     setReqForm]     = useState({ patientName:"", phone:"", location:"", emergencyType:"", priority:"High", description:"" });
  const [error,       setError]       = useState("");
  const [loading,     setLoading]     = useState(false);
  const [recommended, setRecommended] = useState(null);
  const [submitted,   setSubmitted]   = useState(null);
  const [sosLoading,  setSosLoading]  = useState(false);
  const [seeding,     setSeeding]     = useState(true);

  useEffect(() => {
    async function init() {
      await seedAll();
      setHospitals(await getHospitals());
      setSeeding(false);
    }
    init();
  }, []);

  function openLogin(role) {
    setForm({ username:"", password:"" });
    setError("");
    setLoginModal(role);
  }

  async function handleLogin(e) {
    e.preventDefault();
    if (!form.username || !form.password) { setError(t("fillBoth")); return; }
    setError(""); setLoading(true);
    try {
      await login(form.username, form.password);
      setLoginModal(null);
      navigate("/dashboard");
    } catch (err) {
      setError(t("invalidCreds"));
    }
    setLoading(false);
  }

  function openCitizen() {
    setView("citizen");
    setSubmitted(null);
    setReqModal(false);
    setReqForm({ patientName:"", phone:"", location:"", emergencyType:"", priority:"High", description:"" });
  }

  function chReq(e) {
    const updated = { ...reqForm, [e.target.name]: e.target.value };
    setReqForm(updated);
    if (updated.emergencyType && updated.location && hospitals.length) {
      setRecommended(recommendHospital(hospitals, updated.emergencyType, updated.location));
    }
  }

  async function handleSubmitReq(e) {
    e.preventDefault();
    if (!reqForm.patientName || !reqForm.phone || !reqForm.location || !reqForm.emergencyType) {
      setError(t("fillRequired")); return;
    }
    setError(""); setLoading(true);
    try {
      const sel = document.querySelector('select[name="location"]');
      const selOpt = sel ? sel.options[sel.selectedIndex] : null;
      const locationAr = selOpt ? selOpt.text : reqForm.location;

      const typeSel = document.querySelector('select[name="emergencyType"]');
      const typeOpt = typeSel ? typeSel.options[typeSel.selectedIndex] : null;
      const emergencyTypeAr = typeOpt ? typeOpt.text : reqForm.emergencyType;

      const ref = await submitRequest({ ...reqForm, locationAr, emergencyTypeAr, submittedBy:"citizen" }, hospitals);
      const best = recommendHospital(hospitals, reqForm.emergencyType, reqForm.location);
      setSubmitted({ id: ref.id, hospital: best });
      setReqModal(false);
    } catch {
      setError(t("submitFailed"));
    }
    setLoading(false);
  }

  // ── SOS EMERGENCY ──────────────────────
  async function handleSOS() {
    if (!navigator.geolocation) {
      alert(lang==="ar" ? "متصفحك لا يدعم تحديد الموقع" : "Your browser doesn't support geolocation");
      return;
    }
    setSosLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const locationStr = `GPS: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
        try {
          const sosData = {
            patientName: lang==="ar" ? "⚠️ حالة SOS — مجهولة الحالة" : "⚠️ SOS — Unknown Condition",
            phone: "SOS - No phone provided",
            location: locationStr,
            locationAr: locationStr,
            emergencyType: "Critical / Unknown",
            emergencyTypeAr: "حالة حرجة / غير معروفة",
            priority: "High",
            description: lang==="ar" 
              ? "🚨 طلب SOS عاجل! المريض ضغط زر الطوارئ ولم يستطع تقديم تفاصيل. الحالة غير معروفة وقد تكون حرجة. يجب إرسال سيارة إسعاف فوراً إلى الموقع المحدد عبر GPS."
              : "🚨 URGENT SOS! Patient pressed emergency button but couldn't provide details. Condition unknown, potentially critical. AMBULANCE MUST BE DISPATCHED IMMEDIATELY to the GPS location.",
            submittedBy: "citizen-sos",
            isSOS: true,
            status: "Ambulance Dispatched"
          };
          const ref = await submitRequest(sosData, hospitals);
          const best = recommendHospital(hospitals, "Other", locationStr);
          setView("citizen");
          setSubmitted({ id: ref.id, hospital: best });
        } catch {
          alert(lang==="ar" ? "فشل الإرسال" : "Failed to submit");
        }
        setSosLoading(false);
      },
      (err) => {
        setSosLoading(false);
        alert(lang==="ar" 
          ? "يجب السماح بالوصول للموقع لاستخدام هذه الميزة"
          : "Location access required for this feature");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  const TEAM = [
    { name:"Karim Amar Abu Zarifa", sup:false },
    { name:"Israa Anwar Mesleh",    sup:false },
    { name:"Nour Waleed Zakout",    sup:false },
    { name:"Nada Mamdouh Shatila",  sup:false },
    { name:"Dr. Naser Al-Masri",    sup:true  },
    { name:"Dr. Samy Abu Naser",    sup:true  },
  ];

  // ── CITIZEN PORTAL ───────────────────────
  if (view === "citizen") {
    const stBadge = s => s==="Open"?"b-green":s==="Moderate"?"b-amber":"b-red";
    const pct = h => Math.round(((h.emergencyCapacity - h.availableBeds) / h.emergencyCapacity) * 100);
    const stLabel = s => s==="Open"?t("open"):s==="Moderate"?t("moderate"):t("overloaded");

    const REGION_OPTGROUPS = [
      { label:"🔴 "+(lang==="ar"?"شمال غزة":"North Gaza"), opts:[
        {v:"Jabalia, North Gaza",   l:lang==="ar"?"جباليا":"Jabalia"},
        {v:"Beit Lahia, North Gaza",l:lang==="ar"?"بيت لاهيا":"Beit Lahia"},
        {v:"Beit Hanoun, North Gaza",l:lang==="ar"?"بيت حانون":"Beit Hanoun"},
      ]},
      { label:"🟠 "+(lang==="ar"?"مدينة غزة":"Gaza City"), opts:[
        {v:"Rimal, Gaza City",       l:lang==="ar"?"الرمال":"Rimal"},
        {v:"Sheikh Radwan, Gaza City",l:lang==="ar"?"الشيخ رضوان":"Sheikh Radwan"},
        {v:"Tuffah, Gaza City",      l:lang==="ar"?"التفاح":"Tuffah"},
        {v:"Shejaia, Gaza City",     l:lang==="ar"?"الشجاعية":"Shejaia"},
        {v:"Sabra, Gaza City",       l:lang==="ar"?"الصبرة":"Sabra"},
        {v:"Tel Al Hawa, Gaza City", l:lang==="ar"?"تل الهوا":"Tel Al Hawa"},
        {v:"Beach Camp, Gaza City",  l:lang==="ar"?"مخيم الشاطئ":"Beach Camp (Shati)"},
        {v:"Zeitoun, Gaza City",     l:lang==="ar"?"الزيتون":"Zeitoun"},
        {v:"Daraj, Gaza City",       l:lang==="ar"?"الدرج":"Daraj"},
      ]},
      { label:"🟡 "+(lang==="ar"?"المنطقة الوسطى":"Central Gaza"), opts:[
        {v:"Nuseirat, Central Gaza", l:lang==="ar"?"النصيرات":"Nuseirat"},
        {v:"Bureij, Central Gaza",   l:lang==="ar"?"البريج":"Bureij"},
        {v:"Maghazi, Central Gaza",  l:lang==="ar"?"المغازي":"Maghazi"},
        {v:"Deir Al-Balah, Central Gaza", l:lang==="ar"?"دير البلح":"Deir Al-Balah"},
      ]},
      { label:"🟢 "+(lang==="ar"?"خان يونس":"Khan Younis"), opts:[
        {v:"Khan Younis",                l:lang==="ar"?"مدينة خان يونس":"Khan Younis City"},
        {v:"Abasan, Khan Younis",        l:lang==="ar"?"عبسان":"Abasan"},
        {v:"Bani Suheila, Khan Younis",  l:lang==="ar"?"بني سهيلا":"Bani Suheila"},
        {v:"Al-Qarara, Khan Younis",     l:lang==="ar"?"القرارة":"Al-Qarara"},
      ]},
      { label:"🔵 "+(lang==="ar"?"رفح":"Rafah"), opts:[
        {v:"Rafah",                  l:lang==="ar"?"مدينة رفح":"Rafah City"},
        {v:"Tal Al-Sultan, Rafah",   l:lang==="ar"?"تل السلطان":"Tal Al-Sultan"},
        {v:"Al-Shaboura, Rafah",     l:lang==="ar"?"الشابورة":"Al-Shaboura"},
      ]},
    ];

    return (
      <div className="citizen-portal">
        <div className="cp-header">
          <div className="cp-logo">
            <CrossIcon />
            <div>
              <div className="cp-logo-name">{t("appFull")}</div>
              <div style={{fontSize:10,opacity:.7}}>{t("university")}</div>
            </div>
          </div>
          <div className="cp-right">
            <LangToggle light />
            <button className="cp-back" onClick={() => setView("landing")}>
              {lang==="ar"?"رجوع ←":"← Back"}
            </button>
          </div>
        </div>

        <div className="cp-body">
          {submitted && (
            <div style={{marginBottom:28,background:"var(--green-l)",border:"1px solid var(--green-b)",borderRadius:14,padding:24,textAlign:"center"}}>
              <div style={{fontSize:44,marginBottom:10}}>✅</div>
              <div style={{fontSize:18,fontWeight:800,color:"var(--green)",marginBottom:8}}>{t("requestSubmitted")}</div>
              <div style={{fontSize:13.5,color:"var(--green)",marginBottom:16}}>{t("requestReceived")}</div>
              <div style={{background:"white",borderRadius:10,padding:16,display:"inline-block",textAlign:"left",minWidth:280}}>
                <div style={{fontSize:11,color:"var(--g400)",textTransform:"uppercase",letterSpacing:".06em",fontWeight:600,marginBottom:4}}>{t("requestId")}</div>
                <div style={{fontFamily:"monospace",fontSize:13,fontWeight:700,color:"var(--blue)",marginBottom:12,wordBreak:"break-all"}}>{submitted.id}</div>
                {submitted.hospital && <>
                  <div style={{fontSize:11,color:"var(--g400)",textTransform:"uppercase",letterSpacing:".06em",fontWeight:600,marginBottom:4}}>{t("assignedHospital")}</div>
                  <div style={{fontWeight:700,fontSize:14,marginBottom:2}}>{lang==="ar" && submitted.hospital.nameAr ? submitted.hospital.nameAr : submitted.hospital.name}</div>
                  <div style={{fontSize:12.5,color:"var(--g400)"}}>📍 {lang==="ar" && submitted.hospital.locationAr ? submitted.hospital.locationAr : submitted.hospital.location}</div>
                  <div style={{fontSize:12.5,color:"var(--g400)"}}>📞 <span className="phone-num">{submitted.hospital.contact}</span></div>
                </>}
              </div>
              <div style={{marginTop:16}}>
                <button className="btn btn-green" onClick={() => setSubmitted(null)}>{t("submitAnother")}</button>
              </div>
            </div>
          )}

          <div className="cp-hero">
            <h1 className="cp-hero-title">{t("welcomeCitizen")}</h1>
            <p className="cp-hero-sub">{t("welcomeCitizenSub")}</p>
          </div>

          <div className="cp-actions">
            <div className="cp-action-card" style={{background:"var(--red-l)",borderColor:"var(--red-b)"}} onClick={() => { setReqModal(true); setError(""); }}>
              <div className="cp-action-icon" style={{background:"var(--red)"}}><AlertIcon /></div>
              <div className="cp-action-title" style={{color:"var(--red-d)"}}>{t("emergencyRequest")}</div>
              <div className="cp-action-desc" style={{color:"var(--g600)"}}>{t("emergencyRequestDesc")}</div>
              <button className="cp-action-btn" style={{background:"var(--red)",color:"white"}} onClick={e => { e.stopPropagation(); setReqModal(true); setError(""); }}>
                {t("submitRequestNow")}
              </button>
            </div>

            <div className="cp-action-card" style={{background:"var(--blue-l)",borderColor:"var(--blue-b)"}}>
              <div className="cp-action-icon" style={{background:"var(--blue)"}}><HospIcon /></div>
              <div className="cp-action-title" style={{color:"var(--blue-d)"}}>{t("viewHospitals")}</div>
              <div className="cp-action-desc" style={{color:"var(--g600)"}}>{t("viewHospitalsDesc")}</div>
              <button className="cp-action-btn" style={{background:"var(--blue)",color:"white"}}
                onClick={() => document.getElementById("hospSection").scrollIntoView({behavior:"smooth"})}>
                {t("viewHospitalsBtn")}
              </button>
            </div>
          </div>

          <div className="cp-hospitals-section" id="hospSection">
            <div className="cp-sec-title">
              <span style={{background:"var(--blue-l)",padding:"4px 10px",borderRadius:7,fontSize:14}}>🏥</span>
              {t("availableHospitals")}
            </div>
            {seeding ? <div className="loading"><div className="spin"/><span>{t("loading")}</span></div>
            : <div className="hosp-grid">
                {hospitals.map(h => {
                  const p = pct(h);
                  const cc = p<50?"c-lo":p<80?"c-md":"c-hi";
                  return (
                    <div className="hosp-card" key={h.id}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}>
                        <div style={{flex:1,minWidth:0}}>
                          <div className="hosp-name">{lang==="ar" && h.nameAr ? h.nameAr : h.name}</div>
                          <div className="hosp-loc">📍 {lang==="ar" && h.locationAr ? h.locationAr : h.location}</div>
                        </div>
                        <span className={`badge ${stBadge(h.status)}`} style={{marginLeft:8,flexShrink:0}}>
                          <span className="bd"/>{stLabel(h.status)}
                        </span>
                      </div>
                      <div className="hosp-stats">
                        <div className="hs"><div className="hs-v" style={{color:"var(--green)"}}>{h.availableBeds}</div><div className="hs-l">{t("avBeds")}</div></div>
                        <div className="hs"><div className="hs-v" style={{color:"var(--blue)"}}>{h.staff}</div><div className="hs-l">{t("staffShort")}</div></div>
                      </div>
                      <div className="cap-bar"><div className={`cap-fill ${cc}`} style={{width:`${p}%`}}/></div>
                      <div style={{display:"flex",justifyContent:"space-between",fontSize:11.5,color:"var(--g400)",marginBottom:8}}>
                        <span>{p}% {t("used")}</span>
                        <span>{h.emergencyCapacity-h.availableBeds}/{h.emergencyCapacity}</span>
                      </div>
                      <div style={{fontSize:12,color:"var(--g600)",marginBottom:12}}><strong>{t("specialties")}: </strong>{lang==="ar" && h.specialtiesAr ? h.specialtiesAr : h.specialties}</div>
                      {h.contact && <div style={{fontSize:12,color:"var(--g400)",marginBottom:12}}>📞 <span className="phone-num">{h.contact}</span></div>}
                      <button className="btn btn-red btn-sm btn-w" onClick={() => { setReqModal(true); setError(""); }}>
                        {t("requestEmergency")}
                      </button>
                    </div>
                  );
                })}
              </div>
            }
          </div>
        </div>

        {/* EMERGENCY REQUEST MODAL */}
        {reqModal && (
          <div className="modal-ov" onClick={() => setReqModal(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-head">
                <div className="modal-title" style={{color:"var(--red)",display:"flex",alignItems:"center",gap:8}}>
                  🚨 {t("submitEmergencyRequest")}
                </div>
                <button className="modal-x" onClick={() => setReqModal(false)}>✕</button>
              </div>
              <form onSubmit={handleSubmitReq}>
                <div className="modal-body">
                  {error && <div className="auth-err">{error}</div>}
                  <div style={{background:"var(--red-l)",border:"1px solid var(--red-b)",borderRadius:8,padding:"10px 13px",marginBottom:16,fontSize:13,color:"var(--red-d)",fontWeight:500}}>
                    {t("fillDetails")}
                  </div>
                  <div className="fgrid">
                    <div className="fg full">
                      <label>{t("patientName")} *</label>
                      <input name="patientName" value={reqForm.patientName} onChange={chReq} autoFocus/>
                    </div>
                    <div className="fg">
                      <label>{t("phoneNumber")} *</label>
                      <input name="phone" placeholder="+970 xx xxxx xxxx" value={reqForm.phone} onChange={chReq} dir="ltr" style={{textAlign:"left"}}/>
                    </div>
                    <div className="fg">
                      <label>{t("emergencyType")} *</label>
                      <select name="emergencyType" value={reqForm.emergencyType} onChange={chReq}>
                        <option value="">{t("selectType")}</option>
                        <option value="Cardiac Arrest">{t("cardiacArrest")}</option>
                        <option value="Trauma / Injury">{t("traumaInjury")}</option>
                        <option value="Pediatric Emergency">{t("pediatricEmergency")}</option>
                        <option value="Respiratory Distress">{t("respiratoryDistress")}</option>
                        <option value="Stroke">{t("stroke")}</option>
                        <option value="Burns">{t("burns")}</option>
                        <option value="Fracture">{t("fracture")}</option>
                        <option value="Other">{t("other")}</option>
                      </select>
                    </div>
                    <div className="fg">
                      <label>{t("priority")} *</label>
                      <select name="priority" value={reqForm.priority} onChange={chReq}>
                        <option value="High">🔴 {t("high")}</option>
                        <option value="Medium">🟡 {t("medium")}</option>
                        <option value="Low">🟢 {t("low")}</option>
                      </select>
                    </div>
                    <div className="fg full">
                      <label>{t("location")} *</label>
                      <select name="location" value={reqForm.location} onChange={chReq}>
                        <option value="">{lang==="ar"?"اختر منطقتك...":"Select your region..."}</option>
                        {REGION_OPTGROUPS.map(g => (
                          <optgroup key={g.label} label={g.label}>
                            {g.opts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                          </optgroup>
                        ))}
                      </select>
                    </div>
                    <div className="fg full">
                      <label>{t("description")}</label>
                      <textarea name="description" placeholder={t("descPlaceholder")} value={reqForm.description} onChange={chReq}/>
                    </div>
                  </div>
                  {recommended && (
                    <div className="info-box">
                      <strong>🏥 {t("recommendedHospital")}: </strong>
                      {lang==="ar" && recommended.nameAr ? recommended.nameAr : recommended.name} — {recommended.availableBeds} {t("bedsAvailable")}
                    </div>
                  )}
                </div>
                <div className="modal-foot">
                  <button type="button" className="btn btn-gray" onClick={() => setReqModal(false)}>{t("cancel")}</button>
                  <button type="submit" className="btn btn-red" disabled={loading}>
                    {loading ? t("submitting") : t("submitEmergency")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── MAIN LANDING ───────────────────────
  return (
    <div className="landing">
      <div className="land-top">
        <div className="land-logo">
          <div className="land-logo-icon"><CrossIcon /></div>
          <div>
            <div className="land-logo-name">{t("appName")}</div>
            <div className="land-logo-sub">{t("appFull")}</div>
          </div>
        </div>
        <div className="land-right">
          <LangToggle />
          <div className="land-uni">{t("university")}</div>
        </div>
      </div>

      <div className="land-hero">
        <div className="land-tag">
          <div className="land-tag-dot"/>
          {t("systemActive")}
        </div>
        <h1 className="land-title">
          <span className="blue">{t("titleLine1")}</span><br/>
          <span className="red">{t("titleLine2")}</span>
        </h1>
        <p className="land-sub">{t("landingSub")}</p>

        {/* SOS BUTTON */}
        <div style={{textAlign:"center", marginBottom:36}}>
          <button onClick={handleSOS} disabled={sosLoading || seeding}
            style={{
              background:"linear-gradient(135deg, #DC2626, #991B1B)",
              color:"white", border:"none", padding:"20px 44px",
              fontSize:17, fontWeight:800, borderRadius:14, cursor:"pointer",
              boxShadow:"0 8px 32px rgba(220,38,38,0.4)",
              fontFamily:"'Inter','Cairo',sans-serif",
              animation:"sosPulse 1.4s infinite",
              display:"inline-flex", alignItems:"center", gap:11,
              letterSpacing:".02em"
            }}>
            <span style={{fontSize:22}}>🚨</span>
            {sosLoading 
              ? (lang==="ar" ? "جاري إرسال موقعك..." : "Sending your location...") 
              : (lang==="ar" ? "اتصال طوارئ فوري" : "Call Emergency Immediately")}
          </button>
          <div style={{fontSize:12.5, color:"var(--g500)", marginTop:10, maxWidth:420, margin:"10px auto 0"}}>
            {lang==="ar" 
              ? "اضغط هنا فوراً إذا كنت في حالة حرجة ولا تستطيع تقديم تفاصيل"
              : "Press here immediately if you're in a critical condition and can't provide details"}
          </div>
        </div>

        <div className="actor-grid">
          <div className="ac ac-citizen" onClick={openCitizen}>
            <div className="ac-icon" style={{background:"#0D9488"}}><PersonIcon /></div>
            <div className="ac-label">{t("citizen")}</div>
            <div className="ac-desc">{t("citizenDesc")}</div>
            <button className="ac-btn" style={{background:"#0D9488",color:"white"}} onClick={e=>{e.stopPropagation();openCitizen();}}>
              {t("enterCitizen")}
            </button>
          </div>

          <div className="ac ac-staff" onClick={() => openLogin("hospital")}>
            <div className="ac-icon" style={{background:"var(--red)"}}><CrossIcon /></div>
            <div className="ac-label">{t("hospitalStaff")}</div>
            <div className="ac-desc">{t("staffDesc")}</div>
            <button className="ac-btn" style={{background:"var(--red)",color:"white"}} onClick={e=>{e.stopPropagation();openLogin("hospital");}}>
              {t("staffSignIn")}
            </button>
          </div>

          <div className="ac ac-admin" onClick={() => openLogin("admin")}>
            <div className="ac-icon" style={{background:"var(--blue)"}}><ShieldIcon /></div>
            <div className="ac-label">{t("administrator")}</div>
            <div className="ac-desc">{t("adminDesc")}</div>
            <button className="ac-btn" style={{background:"var(--blue)",color:"white"}} onClick={e=>{e.stopPropagation();openLogin("admin");}}>
              {t("adminSignIn")}
            </button>
          </div>
        </div>
      </div>

      <div className="land-footer">
        <div className="lf-lbl">{t("projectTeam")}</div>
        <div className="lf-chips">
          {TEAM.map(m => <span key={m.name} className={`lf-chip${m.sup?" sup":""}`}>{m.name}</span>)}
        </div>
      </div>

      {loginModal && (
        <div className="auth-ov" onClick={() => setLoginModal(null)}>
          <div className="auth-box" onClick={e => e.stopPropagation()}>
            <div className="auth-head">
              <div className="auth-title" style={{color: loginModal==="admin" ? "var(--blue)" : "var(--red)"}}>
                {loginModal === "admin" ? "🛡 "+t("adminSignIn") : "🏥 "+t("staffSignIn")}
              </div>
              <button className="auth-close" onClick={() => setLoginModal(null)}>✕</button>
            </div>
            <div className="auth-body">
              {error && <div className="auth-err">{error}</div>}
              <form onSubmit={handleLogin}>
                <div className="fg">
                  <label>{t("username")}</label>
                  <input
                    placeholder={loginModal==="admin" ?"e.g. Dr.Naser" : "e.g. nour"}
                    value={form.username}
                    onChange={e => setForm(f=>({...f,username:e.target.value}))}
                    autoFocus
                  />
                </div>
                <div className="fg" style={{marginBottom:18}}>
                  <label>{t("password")}</label>
                  <input
                    type="password"
                    placeholder={t("enterPassword")}
                    value={form.password}
                    onChange={e => setForm(f=>({...f,password:e.target.value}))}
                  />
                </div>
                <button type="submit" className={`btn ${loginModal==="admin"?"btn-blue":"btn-red"} btn-w`} disabled={loading}>
                  {loading ? t("signingIn") : t("signIn")}
                </button>
              </form>
            </div>
            {loginModal !== "admin" && <div className="auth-foot">{t("contactAdmin")}</div>}
          </div>
        </div>
      )}
    </div>
  );
}