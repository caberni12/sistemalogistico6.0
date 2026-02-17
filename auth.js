/* =====================================================
   AUTH.JS — CONTROL TOTAL DE SESIÓN (FINAL)
   Compatible con Google Apps Script
===================================================== */

if (location.pathname.endsWith("index.html")) {
  console.warn("auth.js bloqueado en login");
  throw new Error("auth.js no debe ejecutarse en index.html");
}

/* ========= CONFIG ========= */
const API_AUTH =
  "https://script.google.com/macros/s/AKfycbzMad3A7vIO3nn-BXaNysrOcoFQtsWEdYe4kdALM52IY0nKoVaZ5zClEpqOk74ewW2b/exec";

const LOGIN_PAGE = "index.html";

/* ========= ESTADO ========= */
let AUTH_USER = null;

/* =====================================================
   VALIDAR SESIÓN GLOBAL
   - Se ejecuta SOLO en páginas internas
   - Una sola validación
===================================================== */
async function validarSesionGlobal(){

  // ⛔ Nunca validar en login
  if (location.pathname.endsWith(LOGIN_PAGE)) return null;

  const token = localStorage.getItem("token");
  if (!token) {
    redirigirLogin();
    return null;
  }

  try{
    // 🔒 VERIFY (GET, como lo requiere tu GAS)
    const r = await fetch(`${API_AUTH}?action=verify&token=${token}`);
    const res = await r.json();

    if(!res.valid){
      limpiarSesion();
      redirigirLogin();
      return null;
    }

    AUTH_USER = res.data || {};

    // 🛡️ Asegurar permisos como array
    if(typeof AUTH_USER.permisos === "string"){
      try{
        AUTH_USER.permisos = JSON.parse(AUTH_USER.permisos);
      }catch{
        AUTH_USER.permisos = [];
      }
    }

    if(!Array.isArray(AUTH_USER.permisos)){
      AUTH_USER.permisos = [];
    }

    return AUTH_USER;

  }catch(err){
    console.error("AUTH ERROR:", err);
    redirigirLogin();
    return null;
  }
}

/* =====================================================
   UTILIDADES
===================================================== */
function limpiarSesion(){
  localStorage.removeItem("token");
  localStorage.removeItem("usuario");
  localStorage.removeItem("nombre");
  localStorage.removeItem("rol");
  localStorage.removeItem("permisos");
  localStorage.removeItem("login_ok");
}

function redirigirLogin(){
  if (!location.pathname.endsWith(LOGIN_PAGE)) {
    location.href = LOGIN_PAGE;
  }
}

/* =====================================================
   LOGOUT GLOBAL
===================================================== */
function cerrarSesionGlobal(){
  limpiarSesion();
  redirigirLogin();
}

/* =====================================================
   ACCESO RÁPIDO AL USUARIO (OPCIONAL)
===================================================== */
function getUsuarioActual(){
  return AUTH_USER;
}

