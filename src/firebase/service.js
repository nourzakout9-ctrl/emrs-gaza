// src/firebase/service.js
import {
  collection, addDoc, updateDoc, deleteDoc, doc,
  getDocs, query, where, orderBy, serverTimestamp
} from "firebase/firestore";
import { db } from "./config";

const ZONES = {
  north:    ["jabalia","jabalia camp","beit lahia","beit hanoun","north gaza","northern","جباليا","بيت لاهيا","بيت حانون","شمال"],
  gaza:     ["rimal","sheikh zayed","tuffah","zeitoun","shejaia","daraj","sabra","tel al hawa","remal","beach camp","shati","nasser street","sheikh radwan","zaytoun","karama","downtown gaza","gaza city","غزة","الرمال","الزيتون","الشجاعية","تل الهوا","النصر"],
  central:  ["nuseirat","bureij","maghazi","deir al balah","deir al-balah","deir albalah","central","al-bureij","النصيرات","البريج","المغازي","دير البلح","الوسطى"],
  south:    ["khan younis","khan yunis","abasan","bani suheila","al-qarara","south","خان يونس","عبسان","بني سهيلا","القرارة","الجنوب"],
  farsouth: ["rafah","tal al sultan","rafah crossing","brazil","al-shaboura","رفح","تل السلطان","الشابورة"],
};

const HOSPITAL_ZONES = {
  "Al-Shifa Medical Complex":"gaza","Al-Quds Hospital":"gaza","Al-Ahli Arab Hospital":"gaza","Al-Durra Pediatric Hospital":"gaza",
  "Shuhada Al-Aqsa Hospital":"central","Al-Awda Hospital - Nuseirat":"central",
  "Nasser Medical Complex":"south","European Gaza Hospital":"south",
  "Abu Yousef Al-Najjar Hospital":"farsouth",
  "Kamal Adwan Hospital":"north","Al-Awda Hospital - Jabalia":"north","Indonesian Hospital":"north",
};

// إحداثيات GPS الفعلية لكل مستشفى
const HOSPITAL_GPS = {
  "Al-Shifa Medical Complex":      { lat: 31.5240, lng: 34.4434 },
  "Al-Quds Hospital":              { lat: 31.5071, lng: 34.4419 },
  "Al-Ahli Arab Hospital":         { lat: 31.5034, lng: 34.4640 },
  "Al-Durra Pediatric Hospital":   { lat: 31.5099, lng: 34.4498 },
  "Shuhada Al-Aqsa Hospital":      { lat: 31.4180, lng: 34.3520 },
  "Al-Awda Hospital - Nuseirat":   { lat: 31.4504, lng: 34.3920 },
  "Nasser Medical Complex":        { lat: 31.3470, lng: 34.3060 },
  "European Gaza Hospital":        { lat: 31.3010, lng: 34.2870 },
  "Abu Yousef Al-Najjar Hospital": { lat: 31.2876, lng: 34.2510 },
  "Kamal Adwan Hospital":          { lat: 31.5535, lng: 34.4960 },
  "Al-Awda Hospital - Jabalia":    { lat: 31.5340, lng: 34.4830 },
  "Indonesian Hospital":           { lat: 31.5510, lng: 34.5005 },
};

// إحداثيات GPS لكل منطقة سكنية
const ZONE_TO_GPS_AREAS = {
  "Rimal, Gaza City":          { lat: 31.5240, lng: 34.4434 },
  "Tel Al Hawa, Gaza City":    { lat: 31.5071, lng: 34.4419 },
  "Zeitoun, Gaza City":        { lat: 31.5034, lng: 34.4640 },
  "Sabra, Gaza City":          { lat: 31.5099, lng: 34.4498 },
  "Shejaia, Gaza City":        { lat: 31.5060, lng: 34.4730 },
  "Sheikh Radwan, Gaza City":  { lat: 31.5295, lng: 34.4475 },
  "Tuffah, Gaza City":         { lat: 31.5150, lng: 34.4670 },
  "Daraj, Gaza City":          { lat: 31.5090, lng: 34.4585 },
  "Beach Camp, Gaza City":     { lat: 31.5295, lng: 34.4360 },
  "Jabalia, North Gaza":       { lat: 31.5340, lng: 34.4830 },
  "Beit Lahia, North Gaza":    { lat: 31.5510, lng: 34.4960 },
  "Beit Hanoun, North Gaza":   { lat: 31.5380, lng: 34.5350 },
  "Nuseirat, Central Gaza":    { lat: 31.4504, lng: 34.3920 },
  "Bureij, Central Gaza":      { lat: 31.4395, lng: 34.3700 },
  "Maghazi, Central Gaza":     { lat: 31.4290, lng: 34.3760 },
  "Deir Al-Balah, Central Gaza":{ lat: 31.4180, lng: 34.3520 },
  "Khan Younis":               { lat: 31.3470, lng: 34.3060 },
  "Abasan, Khan Younis":       { lat: 31.3320, lng: 34.3380 },
  "Bani Suheila, Khan Younis": { lat: 31.3460, lng: 34.3270 },
  "Al-Qarara, Khan Younis":    { lat: 31.3700, lng: 34.3200 },
  "Rafah":                     { lat: 31.2876, lng: 34.2510 },
  "Tal Al-Sultan, Rafah":      { lat: 31.2960, lng: 34.2300 },
  "Al-Shaboura, Rafah":        { lat: 31.2840, lng: 34.2620 },
};

const ZONE_GPS = {
  north:    { lat: 31.532, lng: 34.493 },
  gaza:     { lat: 31.500, lng: 34.466 },
  central:  { lat: 31.413, lng: 34.350 },
  south:    { lat: 31.346, lng: 34.306 },
  farsouth: { lat: 31.286, lng: 34.247 },
};

function gpsDistance(lat1, lng1, lat2, lng2) {
  const dLat = lat1 - lat2;
  const dLng = lng1 - lng2;
  return Math.sqrt(dLat*dLat + dLng*dLng);
}

export function detectZone(address) {
  if (!address) return null;
  if (address.startsWith("GPS:")) {
    const match = address.match(/GPS:\s*([\-\d.]+),\s*([\-\d.]+)/);
    if (match) {
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[2]);
      let closest = null;
      let minDist = Infinity;
      for (const [zone, coords] of Object.entries(ZONE_GPS)) {
        const d = gpsDistance(lat, lng, coords.lat, coords.lng);
        if (d < minDist) { minDist = d; closest = zone; }
      }
      return closest;
    }
  }
  const lower = address.toLowerCase();
  for (const [zone, kws] of Object.entries(ZONES)) {
    if (kws.some(k => lower.includes(k))) return zone;
  }
  return null;
}

function zd(z1, z2) {
  const o = ["north","gaza","central","south","farsouth"];
  const i1 = o.indexOf(z1), i2 = o.indexOf(z2);
  if (i1 === -1 || i2 === -1) return 2;
  return Math.abs(i1 - i2);
}

function scoreOne(h, type, addr) {
  // درجة التوفّر (30%)
  const a = Math.min((h.availableBeds / (h.emergencyCapacity || 100)), 1);
  
  // درجة القرب الفعلي (50%) - باستخدام GPS
  let p = 0.5;
  const hospGPS = HOSPITAL_GPS[h.name];
  
  if (hospGPS && addr) {
    let userGPS = null;
    
    if (addr.startsWith("GPS:")) {
      const match = addr.match(/GPS:\s*([\-\d.]+),\s*([\-\d.]+)/);
      if (match) {
        userGPS = { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
      }
    } else if (ZONE_TO_GPS_AREAS[addr]) {
      userGPS = ZONE_TO_GPS_AREAS[addr];
    }
    
    if (userGPS) {
      const dLat = (userGPS.lat - hospGPS.lat) * 111;
      const dLng = (userGPS.lng - hospGPS.lng) * 111 * Math.cos(userGPS.lat * Math.PI / 180);
      const distKm = Math.sqrt(dLat*dLat + dLng*dLng);
      p = Math.max(0, 1 - (distKm / 25));
    } else {
      const cz = detectZone(addr);
      if (cz) {
        const hz = HOSPITAL_ZONES[h.name] || h.zone;
        if (hz === cz) p = 0.9;
        else p = Math.max(0, 1 - zd(cz, hz) * 0.35);
      }
    }
  }
  
  // درجة التخصص (15%)
  const sp = (h.specialties || "").toLowerCase();
  const tk = (type || "").toLowerCase().split(/[\s/]/)[0];
  const t = tk && sp.includes(tk) ? 1 : sp.includes("general") ? 0.5 : 0.3;
  
  // درجة الاستجابة (5%)
  const r = h.responseRate || 0.8;
  
  // الأوزان: قرب 50% + توفّر 30% + تخصص 15% + استجابة 5%
  return 0.50*p + 0.30*a + 0.15*t + 0.05*r;
}

export function recommendHospital(hospitals, type, addr) {
  const av = hospitals.filter(h => h.status !== "Overloaded" && h.availableBeds > 0);
  const pool = av.length ? av : hospitals.filter(h => h.availableBeds > 0);
  if (!pool.length) return hospitals[0];
  return pool.map(h => ({...h, score: scoreOne(h, type, addr)})).sort((a,b)=>b.score-a.score)[0];
}

export function getTopHospitals(hospitals, type, addr) {
  const av = hospitals.filter(h => h.status !== "Overloaded" && h.availableBeds > 0);
  const pool = av.length ? av : hospitals.filter(h => h.availableBeds > 0);
  if (!pool.length) return hospitals.slice(0,3);
  return pool.map(h => ({...h, score: scoreOne(h, type, addr)})).sort((a,b)=>b.score-a.score).slice(0,3);
}

export async function seedAll() {
  const hSnap = await getDocs(collection(db, "hospitals"));
  const existingHospitalNames = hSnap.docs.map(d => d.data().name);

  const hospitals = [
    { name:"Al-Shifa Medical Complex",      nameAr:"مجمع الشفاء الطبي",            zone:"gaza",     location:"Rimal, Gaza City",         locationAr:"الرمال، مدينة غزة",         status:"Overloaded", availableBeds:8,  emergencyCapacity:500, staff:60, specialties:"Cardiac, Trauma, Neurology, Surgery, Pediatric, Orthopedics", specialtiesAr:"قلب، إصابات، أعصاب، جراحة، أطفال، عظام", contact:"+970-8-282-8282", responseRate:0.88 },
    { name:"Al-Quds Hospital",              nameAr:"مستشفى القدس",                 zone:"gaza",     location:"Tel Al Hawa, Gaza City",   locationAr:"تل الهوا، مدينة غزة",        status:"Moderate",   availableBeds:22, emergencyCapacity:150, staff:20, specialties:"General, Surgery, Trauma, Orthopedics",                        specialtiesAr:"عام، جراحة، إصابات، عظام",                  contact:"+970-8-282-0820", responseRate:0.82 },
    { name:"Al-Ahli Arab Hospital",         nameAr:"المستشفى الأهلي العربي",        zone:"gaza",     location:"Zeitoun, Gaza City",       locationAr:"الزيتون، مدينة غزة",         status:"Open",       availableBeds:35, emergencyCapacity:120, staff:18, specialties:"Internal Medicine, Cardiac, Respiratory",                      specialtiesAr:"باطنة، قلب، تنفسي",                          contact:"+970-8-282-8510", responseRate:0.85 },
    { name:"Al-Durra Pediatric Hospital",   nameAr:"مستشفى الدرة للأطفال",          zone:"gaza",     location:"Sabra, Gaza City",         locationAr:"الصبرة، مدينة غزة",          status:"Open",       availableBeds:28, emergencyCapacity:100, staff:15, specialties:"Pediatric, Neonatal, Pediatric Surgery",                       specialtiesAr:"أطفال، حديثي الولادة، جراحة أطفال",         contact:"+970-8-282-8820", responseRate:0.87 },
    { name:"Shuhada Al-Aqsa Hospital",      nameAr:"مستشفى شهداء الأقصى",          zone:"central",  location:"Deir Al-Balah, Central Gaza", locationAr:"دير البلح، المنطقة الوسطى", status:"Open",       availableBeds:40, emergencyCapacity:130, staff:22, specialties:"Trauma, Surgery, Cardiac, Internal Medicine",                  specialtiesAr:"إصابات، جراحة، قلب، باطنة",                  contact:"+970-8-253-3950", responseRate:0.84 },
    { name:"Al-Awda Hospital - Nuseirat",   nameAr:"مستشفى العودة - النصيرات",      zone:"central",  location:"Nuseirat, Central Gaza",   locationAr:"النصيرات، المنطقة الوسطى",  status:"Moderate",   availableBeds:18, emergencyCapacity:80,  staff:12, specialties:"Trauma, Fracture, Orthopedics, Surgery",                       specialtiesAr:"إصابات، كسور، عظام، جراحة",                  contact:"+970-8-253-5333", responseRate:0.79 },
    { name:"Nasser Medical Complex",        nameAr:"مجمع ناصر الطبي",              zone:"south",    location:"Khan Younis",              locationAr:"خان يونس",                   status:"Open",       availableBeds:45, emergencyCapacity:200, staff:30, specialties:"Trauma, Surgery, Cardiac, Pediatric, Respiratory",             specialtiesAr:"إصابات، جراحة، قلب، أطفال، تنفسي",          contact:"+970-8-205-0006", responseRate:0.88 },
    { name:"European Gaza Hospital",        nameAr:"المستشفى الأوروبي بغزة",        zone:"south",    location:"Al-Fukhari, Khan Younis",  locationAr:"الفخاري، خان يونس",          status:"Moderate",   availableBeds:20, emergencyCapacity:150, staff:18, specialties:"Burns, Surgery, Orthopedics, Trauma",                          specialtiesAr:"حروق، جراحة، عظام، إصابات",                  contact:"+970-8-205-2555", responseRate:0.85 },
    { name:"Abu Yousef Al-Najjar Hospital", nameAr:"مستشفى أبو يوسف النجار",       zone:"farsouth", location:"Rafah",                    locationAr:"رفح",                        status:"Open",       availableBeds:30, emergencyCapacity:100, staff:14, specialties:"General, Trauma, Surgery, Internal Medicine",                  specialtiesAr:"عام، إصابات، جراحة، باطنة",                  contact:"+970-8-213-2366", responseRate:0.80 },
    { name:"Kamal Adwan Hospital",          nameAr:"مستشفى كمال عدوان",            zone:"north",    location:"Beit Lahia, North Gaza",   locationAr:"بيت لاهيا، شمال غزة",        status:"Moderate",   availableBeds:15, emergencyCapacity:120, staff:16, specialties:"General, Surgery, Trauma, Pediatric",                          specialtiesAr:"عام، جراحة، إصابات، أطفال",                  contact:"+970-8-282-5555", responseRate:0.75 },
    { name:"Al-Awda Hospital - Jabalia",    nameAr:"مستشفى العودة - جباليا",        zone:"north",    location:"Jabalia, North Gaza",      locationAr:"جباليا، شمال غزة",          status:"Open",       availableBeds:25, emergencyCapacity:90,  staff:12, specialties:"Cardiology, Neurology, Stroke, Internal Medicine",             specialtiesAr:"قلب، أعصاب، جلطات، باطنة",                   contact:"+970-8-282-9999", responseRate:0.82 },
    { name:"Indonesian Hospital",           nameAr:"المستشفى الإندونيسي",           zone:"north",    location:"Beit Lahia, North Gaza",   locationAr:"بيت لاهيا، شمال غزة",       status:"Open",       availableBeds:20, emergencyCapacity:80,  staff:10, specialties:"General, Surgery, Pediatric, Respiratory",                     specialtiesAr:"عام، جراحة، أطفال، تنفسي",                   contact:"+970-8-282-7700", responseRate:0.78 },
  ];

  for (const h of hospitals) {
    if (!existingHospitalNames.includes(h.name)) {
      await addDoc(collection(db, "hospitals"), h);
    }
  }

  const uSnap = await getDocs(collection(db, "users"));
  const existing = uSnap.docs.map(d => d.data().username);
  const users = [
    { username:"Dr.Naser", password:"1234", fullName:"Dr. Naser Al-Masri", fullNameAr:"د. ناصر المصري",   role:"admin",    phone:"+970592520996", active:true },
    { username:"Dr.Samy",  password:"1234", fullName:"Dr. Samy Abu Naser", fullNameAr:"د. سامي أبو ناصر", role:"admin",    phone:"+970599783837", active:true },
    { username:"karim",    password:"1234", fullName:"Karim Abu Zarifa",   fullNameAr:"كريم أبو ظريفة",   role:"hospital", phone:"+970592184574", active:true },
    { username:"israa",    password:"1234", fullName:"Israa Mesleh",       fullNameAr:"إسراء مصلح",       role:"hospital", phone:"+972599939231", active:true },
    { username:"nour",     password:"1234", fullName:"Nour Zakout",        fullNameAr:"نور زقوت",         role:"hospital", phone:"+970592283728", active:true },
    { username:"nada",     password:"1234", fullName:"Nada Shatila",       fullNameAr:"ندى شاتيلا",        role:"hospital", phone:"+972593251589", active:true },
  ];
  for (const u of users) {
    if (!existing.includes(u.username)) {
      await addDoc(collection(db, "users"), u);
    } else {
      const ex = uSnap.docs.find(d => d.data().username === u.username);
      if (ex) await updateDoc(doc(db,"users",ex.id), { phone: u.phone, fullName: u.fullName, fullNameAr: u.fullNameAr });
    }
  }
}

export async function getUserByUsername(u) {
  const s = await getDocs(query(collection(db,"users"), where("username","==",u)));
  if (s.empty) return null;
  return { id: s.docs[0].id, ...s.docs[0].data() };
}
export async function getUsers() { return (await getDocs(collection(db,"users"))).docs.map(d=>({id:d.id,...d.data()})); }
export async function addUser(d)    { return addDoc(collection(db,"users"),{...d,createdAt:serverTimestamp()}); }
export async function updateUser(i,d){ await updateDoc(doc(db,"users",i),d); }
export async function deleteUser(i) { await deleteDoc(doc(db,"users",i)); }

export async function getHospitals() { return (await getDocs(collection(db,"hospitals"))).docs.map(d=>({id:d.id,...d.data()})); }
export async function updateHospital(i,d){ await updateDoc(doc(db,"hospitals",i),d); }
export async function addHospital(d)    { return addDoc(collection(db,"hospitals"),{...d,createdAt:serverTimestamp()}); }
export async function deleteHospital(i) { await deleteDoc(doc(db,"hospitals",i)); }

export async function submitRequest(data, hospitals) {
  const best = recommendHospital(hospitals, data.emergencyType, data.location);
  return addDoc(collection(db,"requests"), {
    ...data,
    hospitalId:        best?.id        || null,
    hospitalName:      best?.name      || "Pending Assignment",
    hospitalNameAr:    best?.nameAr    || "بانتظار التعيين",
    hospitalContact:   best?.contact   || "",
    locationAr:        data.locationAr || "",
    status: data.status || "Pending",
    createdAt: serverTimestamp(),
    responseTime: null,
  });
}

export async function getAllRequests() {
  const q = query(collection(db,"requests"), orderBy("createdAt","desc"));
  return (await getDocs(q)).docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function updateRequestStatus(id, status, extra={}) {
  await updateDoc(doc(db,"requests",id), { status, responseTime: serverTimestamp(), ...extra });
}

export async function deleteRequest(id) { await deleteDoc(doc(db,"requests",id)); }

