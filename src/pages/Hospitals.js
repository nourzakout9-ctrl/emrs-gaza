// src/pages/Hospitals.js
import React, { useEffect, useState } from "react";
import { getHospitals, updateHospital, addHospital, deleteHospital } from "../firebase/service";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../context/LangContext";
import Layout from "../components/Layout";

const SB = s => s==="Open"?"b-green":s==="Moderate"?"b-amber":"b-red";

export default function Hospitals() {
  const { effectiveRole } = useAuth();
  const { t, lang } = useLang();
  const [hospitals, setHospitals] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [edit,      setEdit]      = useState(null);
  const [addM,      setAddM]      = useState(false);
  const [nH, setNH] = useState({name:"",nameAr:"",location:"",locationDetails:"",status:"Open",availableBeds:20,emergencyCapacity:100,staff:5,specialties:"",specialtiesAr:"",contact:""});  const [toast,     setToast]     = useState(null);

  useEffect(() => { load(); }, []);
  async function load() { setLoading(true); setHospitals(await getHospitals()); setLoading(false); }
  function t_(msg,ok=true){setToast({msg,ok});setTimeout(()=>setToast(null),3000);}

  async function saveEdit() {
    await updateHospital(edit.id, { status:edit.status, availableBeds:+edit.availableBeds, staff:+edit.staff, emergencyCapacity:+edit.emergencyCapacity, specialties:edit.specialties||"", contact:edit.contact||"" });
    setEdit(null); t_(t("hospitalUpdated")); load();
  }
  async function saveNew() {
    if(!nH.name||!nH.location){t_(t("nameAndLocReq"),false);return;}
    await addHospital({...nH,availableBeds:+nH.availableBeds,emergencyCapacity:+nH.emergencyCapacity,staff:+nH.staff,responseRate:0.8});
    setAddM(false); setNH({name:"",location:"",status:"Open",availableBeds:20,emergencyCapacity:100,staff:5,specialties:"",contact:""}); t_(t("hospitalAdded")); load();
  }
  async function doDelete(id,name){if(!window.confirm(t("deleteHospConfirm")))return;await deleteHospital(id);t_(t("hospitalDeleted"));load();}

  const isAdmin = effectiveRole === "admin";
  const stLabel = s => s==="Open"?t("open"):s==="Moderate"?t("moderate"):t("overloaded");
  const phoneStyle = { direction:"ltr", textAlign:"left", unicodeBidi:"bidi-override" };

  return (
    <Layout title={isAdmin?t("manageHospitals"):t("hospitalStatus")}>
      <div className="page-head">
        <div className="page-title">{isAdmin?t("manageHospitals"):t("hospitalStatus")}</div>
        <div className="page-sub">{isAdmin?t("addEditRemove"):t("viewUpdateAvailability")}</div>
      </div>
      {isAdmin && <div style={{marginBottom:18}}><button className="btn btn-blue" onClick={()=>setAddM(true)}>{t("addHospital")}</button></div>}
      {loading?<div className="loading"><div className="spin"/></div>
      :<div className="hosp-grid">{hospitals.map(h=>{
        const p=Math.round(((h.emergencyCapacity-h.availableBeds)/h.emergencyCapacity)*100);
        const cc=p<50?"c-lo":p<80?"c-md":"c-hi";
        return(<div className="hosp-card" key={h.id}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}>
            <div style={{flex:1,minWidth:0}}><div className="hosp-name">{lang==="ar" && h.nameAr ? h.nameAr : h.name}</div><div className="hosp-loc">📍 {lang==="ar" && h.locationAr ? h.locationAr : h.location}</div></div>
            <span className={`badge ${SB(h.status)}`} style={{marginLeft:8,flexShrink:0}}><span className="bd"/>{stLabel(h.status)}</span>
          </div>
          <div className="hosp-stats">
            <div className="hs"><div className="hs-v" style={{color:"var(--green)"}}>{h.availableBeds}</div><div className="hs-l">{t("avBeds")}</div></div>
            <div className="hs"><div className="hs-v" style={{color:"var(--blue)"}}>{h.staff}</div><div className="hs-l">{t("staffShort")}</div></div>
          </div>
          <div className="cap-bar"><div className={`cap-fill ${cc}`} style={{width:`${p}%`}}/></div>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:11.5,color:"var(--g400)",marginBottom:8}}><span>{p}% {t("used")}</span><span>{h.emergencyCapacity-h.availableBeds}/{h.emergencyCapacity}</span></div>
          <div style={{fontSize:12.5,color:"var(--g600)",marginBottom:h.contact?8:12}}><strong>{t("specialties")}: </strong>{lang==="ar" && h.specialtiesAr ? h.specialtiesAr : h.specialties}</div>
          {h.contact&&<div style={{fontSize:12,color:"var(--g400)",marginBottom:12}}>📞 <span className="phone-num" style={phoneStyle}>{h.contact}</span></div>}
          <div style={{display:"flex",gap:7}}>
            <button className="btn btn-outline btn-sm" style={{flex:1,justifyContent:"center"}} onClick={()=>setEdit({...h})}>{t("editStatus")}</button>
            {isAdmin&&<button className="btn btn-danger btn-sm" onClick={()=>doDelete(h.id,h.name)}>{t("delete")}</button>}
          </div>
        </div>);
      })}</div>}

      {edit&&<div className="modal-ov" onClick={()=>setEdit(null)}><div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-head"><div className="modal-title">{t("editHospital")} — {edit.name}</div><button className="modal-x" onClick={()=>setEdit(null)}>✕</button></div>
        <div className="modal-body"><div className="fgrid">
          <div className="fg"><label>{t("status")}</label><select value={edit.status} onChange={e=>setEdit(x=>({...x,status:e.target.value}))}><option value="Open">{t("open")}</option><option value="Moderate">{t("moderate")}</option><option value="Overloaded">{t("overloaded")}</option></select></div>
          <div className="fg"><label>{t("availableBeds")}</label><input type="number" min="0" value={edit.availableBeds} onChange={e=>setEdit(x=>({...x,availableBeds:e.target.value}))}/></div>
          <div className="fg"><label>{t("totalCapacity")}</label><input type="number" min="1" value={edit.emergencyCapacity} onChange={e=>setEdit(x=>({...x,emergencyCapacity:e.target.value}))}/></div>
          <div className="fg"><label>{t("onDutyStaff")}</label><input type="number" min="0" value={edit.staff} onChange={e=>setEdit(x=>({...x,staff:e.target.value}))}/></div>
          <div className="fg full"><label>{t("specialties")} ({lang==="ar"?"إنجليزي":"English"})</label><input value={edit.specialties||""} onChange={e=>setEdit(x=>({...x,specialties:e.target.value}))} dir="ltr"/></div>
          <div className="fg full"><label>{t("specialties")} ({lang==="ar"?"عربي":"Arabic"})</label><input value={edit.specialtiesAr||""} onChange={e=>setEdit(x=>({...x,specialtiesAr:e.target.value}))} dir="rtl"/></div>
          <div className="fg full"><label>{t("contact")}</label><input dir="ltr" style={phoneStyle} placeholder="+970-xx-xxx-xxxx" value={edit.contact||""} onChange={e=>setEdit(x=>({...x,contact:e.target.value}))}/></div>
        </div></div>
        <div className="modal-foot"><button className="btn btn-gray" onClick={()=>setEdit(null)}>{t("cancel")}</button><button className="btn btn-blue" onClick={saveEdit}>{t("saveChanges")}</button></div>
      </div></div>}

      {addM&&<div className="modal-ov" onClick={()=>setAddM(false)}><div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-head"><div className="modal-title">{t("addNewHospital")}</div><button className="modal-x" onClick={()=>setAddM(false)}>✕</button></div>
        <div className="modal-body"><div className="fgrid">
          <div className="fg full"><label>{t("hospitalName")} *</label><input value={nH.name} onChange={e=>setNH(x=>({...x,name:e.target.value}))}/></div>
          <div className="fg full"><label>{t("locationLabel")} *</label>
  <select value={nH.location} onChange={e=>setNH(x=>({...x,location:e.target.value}))}>
    <option value="">{lang==="ar"?"اختر المنطقة...":"Select region..."}</option>
    <optgroup label={lang==="ar"?"شمال غزة":"North Gaza"}>
      <option value="Jabalia, North Gaza">{lang==="ar"?"جباليا":"Jabalia"}</option>
      <option value="Beit Lahia, North Gaza">{lang==="ar"?"بيت لاهيا":"Beit Lahia"}</option>
      <option value="Beit Hanoun, North Gaza">{lang==="ar"?"بيت حانون":"Beit Hanoun"}</option>
    </optgroup>
    <optgroup label={lang==="ar"?"مدينة غزة":"Gaza City"}>
      <option value="Rimal, Gaza City">{lang==="ar"?"الرمال":"Rimal"}</option>
      <option value="Sheikh Radwan, Gaza City">{lang==="ar"?"الشيخ رضوان":"Sheikh Radwan"}</option>
      <option value="Tuffah, Gaza City">{lang==="ar"?"التفاح":"Tuffah"}</option>
      <option value="Shejaia, Gaza City">{lang==="ar"?"الشجاعية":"Shejaia"}</option>
      <option value="Sabra, Gaza City">{lang==="ar"?"الصبرة":"Sabra"}</option>
      <option value="Tel Al Hawa, Gaza City">{lang==="ar"?"تل الهوا":"Tel Al Hawa"}</option>
      <option value="Beach Camp, Gaza City">{lang==="ar"?"مخيم الشاطئ":"Beach Camp"}</option>
      <option value="Zeitoun, Gaza City">{lang==="ar"?"الزيتون":"Zeitoun"}</option>
      <option value="Daraj, Gaza City">{lang==="ar"?"الدرج":"Daraj"}</option>
    </optgroup>
    <optgroup label={lang==="ar"?"المنطقة الوسطى":"Central Gaza"}>
      <option value="Nuseirat, Central Gaza">{lang==="ar"?"النصيرات":"Nuseirat"}</option>
      <option value="Bureij, Central Gaza">{lang==="ar"?"البريج":"Bureij"}</option>
      <option value="Maghazi, Central Gaza">{lang==="ar"?"المغازي":"Maghazi"}</option>
      <option value="Deir Al-Balah, Central Gaza">{lang==="ar"?"دير البلح":"Deir Al-Balah"}</option>
    </optgroup>
    <optgroup label={lang==="ar"?"خان يونس":"Khan Younis"}>
      <option value="Khan Younis">{lang==="ar"?"مدينة خان يونس":"Khan Younis City"}</option>
      <option value="Abasan, Khan Younis">{lang==="ar"?"عبسان":"Abasan"}</option>
      <option value="Bani Suheila, Khan Younis">{lang==="ar"?"بني سهيلا":"Bani Suheila"}</option>
      <option value="Al-Qarara, Khan Younis">{lang==="ar"?"القرارة":"Al-Qarara"}</option>
    </optgroup>
    <optgroup label={lang==="ar"?"رفح":"Rafah"}>
      <option value="Rafah">{lang==="ar"?"مدينة رفح":"Rafah City"}</option>
      <option value="Tal Al-Sultan, Rafah">{lang==="ar"?"تل السلطان":"Tal Al-Sultan"}</option>
      <option value="Al-Shaboura, Rafah">{lang==="ar"?"الشابورة":"Al-Shaboura"}</option>
    </optgroup>
  </select>
           </div>
<div className="fg full"><label>{lang==="ar"?"تفاصيل إضافية (اختياري)":"Additional details (optional)"}</label>
  <input placeholder={lang==="ar"?"مثل: شارع الجلاء، بجانب الجامعة":"e.g. Al-Jalaa Street, near university"}
    value={nH.locationDetails||""} 
    onChange={e=>setNH(x=>({...x,locationDetails:e.target.value}))}/>
</div>
          <div className="fg"><label>{t("availableBeds")}</label><input type="number" value={nH.availableBeds} onChange={e=>setNH(x=>({...x,availableBeds:e.target.value}))}/></div>
          <div className="fg"><label>{t("totalCapacity")}</label><input type="number" value={nH.emergencyCapacity} onChange={e=>setNH(x=>({...x,emergencyCapacity:e.target.value}))}/></div>
          <div className="fg"><label>{t("onDutyStaff")}</label><input type="number" value={nH.staff} onChange={e=>setNH(x=>({...x,staff:e.target.value}))}/></div>
          <div className="fg"><label>{t("status")}</label><select value={nH.status} onChange={e=>setNH(x=>({...x,status:e.target.value}))}><option value="Open">{t("open")}</option><option value="Moderate">{t("moderate")}</option><option value="Overloaded">{t("overloaded")}</option></select></div>
          <div className="fg full"><label>{t("specialties")} ({lang==="ar"?"إنجليزي":"English"})</label><input value={nH.specialties} onChange={e=>setNH(x=>({...x,specialties:e.target.value}))} dir="ltr"/></div>
          <div className="fg full"><label>{t("specialties")} ({lang==="ar"?"عربي":"Arabic"})</label><input value={nH.specialtiesAr||""} onChange={e=>setNH(x=>({...x,specialtiesAr:e.target.value}))} dir="rtl"/></div>
          <div className="fg full"><label>{t("contact")}</label><input dir="ltr" style={phoneStyle} placeholder="+970-xx-xxx-xxxx" value={nH.contact} onChange={e=>setNH(x=>({...x,contact:e.target.value}))}/></div>
        </div></div>
        <div className="modal-foot"><button className="btn btn-gray" onClick={()=>setAddM(false)}>{t("cancel")}</button><button className="btn btn-blue" onClick={saveNew}>{t("addHospital").replace("+ ","")}</button></div>
      </div></div>}

      {toast&&<div className={`toast ${toast.ok?"toast-ok":"toast-err"}`}>{toast.msg}</div>}
    </Layout>
  );
}