// src/pages/Staff.js
import React, { useEffect, useState } from "react";
import { getUsers, addUser, updateUser, deleteUser } from "../firebase/service";
import { useLang } from "../context/LangContext";
import Layout from "../components/Layout";

export default function Staff() {
  const { t, lang } = useLang();
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(null);
  const [form,    setForm]    = useState({ username:"", password:"1234", fullName:"", role:"hospital", phone:"", active:true });
  const [pwModal, setPwModal] = useState(null);
  const [newPw,   setNewPw]   = useState("");
  const [toast,   setToast]   = useState(null);

  useEffect(() => { load(); }, []);
  async function load() { setLoading(true); setUsers(await getUsers()); setLoading(false); }
  function t_(msg,ok=true){setToast({msg,ok});setTimeout(()=>setToast(null),3000);}

  function openAdd(){ setForm({username:"",password:"1234",fullName:"",role:"hospital",phone:"",active:true}); setModal("add"); }
  function openEdit(u){ setForm({...u}); setModal(u); }

  async function saveAdd() {
    if(!form.username||!form.fullName){t_(t("usernameRequired"),false);return;}
    if(users.find(u=>u.username===form.username.toLowerCase().trim())){t_(t("usernameExists"),false);return;}
    await addUser({...form,username:form.username.toLowerCase().trim()});
    setModal(null); t_(t("staffAdded")); load();
  }
  async function saveEdit() {
    await updateUser(modal.id,{fullName:form.fullName,phone:form.phone,role:form.role,active:form.active});
    setModal(null); t_(t("staffUpdated")); load();
  }
  async function doDelete(id,name,role) {
    if(role==="admin"){t_(t("cannotRemoveAdmin"),false);return;}
    if(!window.confirm(t("removeConfirm")))return;
    await deleteUser(id); t_(t("staffRemoved")); load();
  }
  async function savePw() {
    if(!newPw||newPw.length<3){t_(t("pwTooShort"),false);return;}
    await updateUser(pwModal.id,{password:newPw});
    setPwModal(null); setNewPw(""); t_(t("pwUpdated"));
  }
  async function toggleActive(u) {
    await updateUser(u.id,{active:!u.active});
    t_(`${u.fullName} ${u.active?t("accountDisabledMsg"):t("accountEnabledMsg")}`);
    load();
  }

  return (
    <Layout title={t("manageStaff")}>
      <div className="page-head">
        <div className="page-title">{t("manageStaff")}</div>
        <div className="page-sub">{t("addEditRemoveStaff")}</div>
      </div>
      <div style={{marginBottom:18}}><button className="btn btn-blue" onClick={openAdd}>{t("addStaffMember")}</button></div>
      <div className="card">
        {loading?<div className="loading"><div className="spin"/></div>
        :<div className="tbl-wrap"><table>
          <thead><tr><th>{t("name")}</th><th>{t("username")}</th><th>{t("role")}</th><th>{t("phone")}</th><th>{t("status")}</th><th>{t("actions")}</th></tr></thead>
          <tbody>{users.map(u=>(
            <tr key={u.id} style={{opacity:u.active===false?.55:1}}>
              <td>
                <div style={{fontWeight:700,fontSize:13.5}}>{lang==="ar" && u.fullNameAr ? u.fullNameAr : u.fullName}</div>
                {u.role==="admin"&&<div style={{fontSize:11,color:"var(--blue)",fontWeight:600}}>{t("supervisor")}</div>}
              </td>
              <td><code style={{background:"var(--g100)",padding:"2px 8px",borderRadius:5,fontSize:12.5,fontWeight:700,color:"var(--g800)"}}>{u.username}</code></td>
              <td><span className={`badge ${u.role==="admin"?"b-blue":"b-red"}`}><span className="bd"/>{u.role==="admin"?t("administratorRole"):t("hospitalStaffRole")}</span></td>
              <td style={{fontSize:13,color:"var(--g500)"}}><span className="phone-num">{u.phone||"—"}</span></td>
              <td><span className={`badge ${u.active!==false?"b-green":"b-red"}`}>{u.active!==false?t("active"):t("disabled")}</span></td>
              <td><div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                <button className="btn btn-outline btn-sm" onClick={()=>openEdit(u)}>{t("edit")}</button>
                <button className="btn btn-outline btn-sm" onClick={()=>{setPwModal(u);setNewPw("");}}>{t("changePassword")}</button>
                {u.role!=="admin"&&<button className="btn btn-danger btn-sm" onClick={()=>toggleActive(u)}>{u.active!==false?t("disable"):t("enable")}</button>}
                {u.role!=="admin"&&<button className="btn btn-danger btn-sm" style={{background:"var(--red)",color:"white"}} onClick={()=>doDelete(u.id,u.fullName,u.role)}>{t("remove")}</button>}
              </div></td>
            </tr>
          ))}</tbody>
        </table></div>}
      </div>

      {modal&&<div className="modal-ov" onClick={()=>setModal(null)}><div className="modal" style={{maxWidth:420}} onClick={e=>e.stopPropagation()}>
        <div className="modal-head"><div className="modal-title">{modal==="add"?t("addStaffMemberTitle"):t("editStaffMember")}</div><button className="modal-x" onClick={()=>setModal(null)}>✕</button></div>
        <div className="modal-body"><div className="fgrid">
          <div className="fg full"><label>{t("name")} *</label><input value={form.fullName} onChange={e=>setForm(f=>({...f,fullName:e.target.value}))}/></div>
          {modal==="add"&&<div className="fg"><label>{t("username")} *</label><input value={form.username} onChange={e=>setForm(f=>({...f,username:e.target.value.toLowerCase().trim()}))}/></div>}
          {modal==="add"&&<div className="fg"><label>{t("initialPassword")}</label><input value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))}/></div>}
          <div className="fg"><label>{t("role")}</label><select value={form.role} onChange={e=>setForm(f=>({...f,role:e.target.value}))}><option value="hospital">{t("hospitalStaffRole")}</option><option value="admin">{t("administratorRole")}</option></select></div>
          <div className="fg"><label>{t("phone")}</label><input dir="ltr" style={{direction:"ltr",textAlign:"left",unicodeBidi:"bidi-override"}} placeholder="+970xxxxxxxxx" value={form.phone||""} onChange={e=>setForm(f=>({...f,phone:e.target.value}))}/></div>
        </div></div>
        <div className="modal-foot">
          <button className="btn btn-gray" onClick={()=>setModal(null)}>{t("cancel")}</button>
          <button className="btn btn-blue" onClick={modal==="add"?saveAdd:saveEdit}>{modal==="add"?t("addMember"):t("saveChanges")}</button>
        </div>
      </div></div>}

      {pwModal&&<div className="modal-ov" onClick={()=>setPwModal(null)}><div className="modal" style={{maxWidth:380}} onClick={e=>e.stopPropagation()}>
        <div className="modal-head"><div className="modal-title">{t("changePasswordTitle")}</div><button className="modal-x" onClick={()=>setPwModal(null)}>✕</button></div>
        <div className="modal-body">
          <div style={{fontSize:13.5,color:"var(--g500)",marginBottom:16}}>{t("settingPasswordFor")} <strong style={{color:"var(--g900)"}}>{pwModal.fullName}</strong></div>
          <div className="fg"><label>{t("newPassword")}</label><input type="text" value={newPw} onChange={e=>setNewPw(e.target.value)} placeholder={t("enterNewPassword")} autoFocus/></div>
        </div>
        <div className="modal-foot"><button className="btn btn-gray" onClick={()=>setPwModal(null)}>{t("cancel")}</button><button className="btn btn-blue" onClick={savePw}>{t("updatePassword")}</button></div>
      </div></div>}

      {toast&&<div className={`toast ${toast.ok?"toast-ok":"toast-err"}`}>{toast.msg}</div>}
    </Layout>
  );
}