/* =====================================================
   AUTH.JS — VALIDACIÓN UNIVERSAL DE SESIÓN (FIX)
===================================================== */

/* ========= CONFIG ========= */
const API_AUTH = "https://script.google.com/macros/s/AKfycbxhJp4ZFqq4TwBKO29WXCEtS8dRVCs1gyDiK2CfgRKbWN5pjqd4PRdE9FJaXAF5fnXM/exec";
const LOGIN_PAGE = "index.html";

/* ========= ESTADO ========= */
let AUTH_USER = null;

/* =====================================================
   VALIDAR SESIÓN GLOBAL
===================================================== */
async function validarSesionGlobal(requiredPerm = null){

  const token = localStorage.getItem("token");
  if(!token){
    redirigirLogin();
    return null;
  }

  /* 🛡️ TOLERANCIA POST-LOGIN (CRÍTICO) */
  const loginTime = localStorage.getItem("login_time");
  if(loginTime && Date.now() - loginTime < 2000){
    return {
      usuario: localStorage.getItem("usuario"),
      nombre: localStorage.getItem("nombre"),
      rol: localStorage.getItem("rol"),
      permisos: JSON.parse(localStorage.getItem("permisos") || "[]")
    };
  }

  try{
    const r = await fetch(`${API_AUTH}?action=verify&token=${token}`);
    const res = await r.json();

    if(!res.valid){
      limpiarSesion();
      redirigirLogin();
      return null;
    }

    AUTH_USER = res.data;
    localStorage.removeItem("login_time");

    if(requiredPerm && AUTH_USER.rol !== "ADMIN"){
      if(!AUTH_USER.permisos.includes(requiredPerm)){
        alert("Acceso denegado");
        redirigirLogin();
        return null;
      }
    }

    return AUTH_USER;

  }catch(err){
    console.error("AUTH ERROR", err);
    redirigirLogin();
    return null;
  }
}

/* =====================================================
   UTILIDADES
===================================================== */
function limpiarSesion(){
  localStorage.removeItem("token");
  localStorage.removeItem("login_time");
}

function redirigirLogin(){
  if(!location.pathname.endsWith(LOGIN_PAGE)){
    location.href = LOGIN_PAGE;
  }
}

/* =====================================================
   CIERRE DE SESIÓN
===================================================== */
function cerrarSesionGlobal(){
  limpiarSesion();
  redirigirLogin();
}
