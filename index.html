/* =====================================================
   AUTO.JS — VALIDACIÓN DE SESIÓN (FINAL)
===================================================== */

const API_AUTH =
"https://script.google.com/macros/s/AKfycbxhJp4ZFqq4TwBKO29WXCEtS8dRVCs1gyDiK2CfgRKbWN5pjqd4PRdE9FJaXAF5fnXM/exec";

const LOGIN_PAGE = "index.html";
let AUTH_USER = null;

async function validarSesionGlobal(requiredPerm = null){

  if (location.pathname.endsWith(LOGIN_PAGE)) return null;

  const token = localStorage.getItem("token");
  if (!token) {
    redirigirLogin();
    return null;
  }

  // 🛡️ Evitar doble validación post-login
  if (localStorage.getItem("login_ok") === "1") {
    localStorage.removeItem("login_ok");
    return {
      usuario: localStorage.getItem("usuario"),
      nombre: localStorage.getItem("nombre"),
      rol: localStorage.getItem("rol"),
      permisos: JSON.parse(localStorage.getItem("permisos") || "[]")
    };
  }

  try{
    const r = await fetch(API_AUTH,{
      method:"POST",
      headers:{ "Content-Type":"text/plain;charset=UTF-8" },
      body: JSON.stringify({
        action:"verify",
        token
      })
    });

    const res = await r.json();

    if(!res.valid){
      limpiarSesion();
      redirigirLogin();
      return null;
    }

    AUTH_USER = res.data;

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

function limpiarSesion(){
  localStorage.clear();
}

function redirigirLogin(){
  if (!location.pathname.endsWith(LOGIN_PAGE)) {
    location.href = LOGIN_PAGE;
  }
}

function cerrarSesionGlobal(){
  limpiarSesion();
  redirigirLogin();
}
