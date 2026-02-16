/* =====================================================
   AUTO.JS — CONTROL DE SESIÓN (ESTABLE)
   - Evita doble validación post-login
   - Usa POST para verify
   - No ejecuta en index.html
===================================================== */

const API_AUTH =
  "https://script.google.com/macros/s/AKfycbzMad3A7vIO3nn-BXaNysrOcoFQtsWEdYe4kdALM52IY0nKoVaZ5zClEpqOk74ewW2b/exec";

const LOGIN_PAGE = "index.html";
let AUTH_USER = null;

/* =====================================================
   VALIDAR SESIÓN
===================================================== */
async function validarSesionGlobal(requiredPerm = null){

  // ⛔ Nunca validar en login
  if (location.pathname.endsWith(LOGIN_PAGE)) return null;

  const token = localStorage.getItem("token");
  if (!token) {
    redirigirLogin();
    return null;
  }

  // 🛡️ Evitar doble validación inmediata tras login
  if (localStorage.getItem("login_ok") === "1") {
    localStorage.removeItem("login_ok");
    return {
      usuario: localStorage.getItem("usuario"),
      nombre: localStorage.getItem("nombre"),
      rol: localStorage.getItem("rol"),
      permisos: JSON.parse(localStorage.getItem("permisos") || "[]")
    };
  }

  // 🔒 Validación normal (recargas / navegación)
  try {
    const response = await fetch(API_AUTH, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "verify",
        token
      })
    });

    const res = await response.json();

    if (!res.valid) {
      limpiarSesion();
      redirigirLogin();
      return null;
    }

    AUTH_USER = res.data;

    // Validación de permisos si aplica
    if (requiredPerm && AUTH_USER.rol !== "ADMIN") {
      if (!AUTH_USER.permisos || !AUTH_USER.permisos.includes(requiredPerm)) {
        alert("Acceso denegado");
        redirigirLogin();
        return null;
      }
    }

    return AUTH_USER;

  } catch (err) {
    console.error("AUTO AUTH ERROR:", err);
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
   LOGOUT
===================================================== */
function cerrarSesionGlobal(){
  limpiarSesion();
  redirigirLogin();
}
