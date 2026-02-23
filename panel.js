/* ======================================================
   CONFIG
====================================================== */
const API =
  "https://script.google.com/macros/s/AKfycbwb_QOTIe9u1-LDSP1psBGeGkJ8gtC-n-e9H7E-rhf0gd2jU29sw-xHhXXp65OwQB_U/exec";

/* ======================================================
   DOM
====================================================== */
const btnLoad        = document.getElementById("btnLoad");
const tablaUsuarios  = document.getElementById("tablaUsuarios");
const mobileList     = document.getElementById("mobileList");
const busqueda       = document.getElementById("busqueda");

const modalUsuario   = document.getElementById("modalUsuario");
const tituloUsuario  = document.getElementById("tituloUsuario");

const u_user   = document.getElementById("u_user");
const u_pass   = document.getElementById("u_pass");
const u_nombre = document.getElementById("u_nombre");
const u_rol    = document.getElementById("u_rol");
const u_activo = document.getElementById("u_activo");

const btnGuardar = document.getElementById("btnGuardar");

/* ======================================================
   ESTADO
====================================================== */
let usuarios = [];
let modo = "crear";

/* ======================================================
   AUTO LOAD
====================================================== */
document.addEventListener("DOMContentLoaded", cargarUsuarios);

/* ======================================================
   CARGAR USUARIOS
====================================================== */
async function cargarUsuarios() {
  btnLoad.classList.add("loading");
  btnLoad.innerHTML = `<div class="loader"></div> Cargando`;

  try {
    const r = await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=UTF-8" },
      body: JSON.stringify({ action: "listarUsuarios" })
    });

    const res = await r.json();
    usuarios = res.data || [];
    render(usuarios);

  } catch (err) {
    console.error(err);
    tablaUsuarios.innerHTML =
      `<tr><td colspan="6">Error al cargar usuarios</td></tr>`;
  }

  btnLoad.classList.remove("loading");
  btnLoad.innerHTML = "Recargar usuarios";
}

/* ======================================================
   RENDER WEB + MÓVIL
====================================================== */
function render(data) {
  tablaUsuarios.innerHTML = "";
  mobileList.innerHTML = "";

  if (!data.length) {
    tablaUsuarios.innerHTML =
      `<tr><td colspan="6">Sin registros</td></tr>`;
    return;
  }

  data.forEach(u => {
    const usuario   = u[1];
    const pass      = u[2];
    const nombre    = u[3];
    const rol       = u[4];
    const activo    = u[5];
    const permisos  = u[6] || "";

    /* ===== WEB ===== */
    tablaUsuarios.innerHTML += `
      <tr>
        <td>${usuario}</td>
        <td>${pass}</td>
        <td>${nombre}</td>
        <td>${rol}</td>
        <td>${activo}</td>
        <td>
          <button class="btn-edit"
            onclick="editarUsuario('${usuario}','${pass}','${nombre}','${rol}','${activo}','${permisos}')">
            Editar
          </button>
          <button class="btn-danger"
            onclick="eliminarUsuario('${usuario}')">
            Eliminar
          </button>
        </td>
      </tr>`;

    /* ===== MÓVIL ===== */
    mobileList.innerHTML += `
      <div class="mobile-card">
        <h4>${nombre}</h4>
        <p><b>Usuario:</b> ${usuario}</p>
        <p><b>Rol:</b> ${rol}</p>
        <p><b>Activo:</b> ${activo}</p>
        <div class="mobile-actions">
          <button class="btn-edit"
            onclick="editarUsuario('${usuario}','${pass}','${nombre}','${rol}','${activo}','${permisos}')">
            Editar
          </button>
          <button class="btn-danger"
            onclick="eliminarUsuario('${usuario}')">
            Eliminar
          </button>
        </div>
      </div>`;
  });
}

/* ======================================================
   FILTRO
====================================================== */
function filtrar() {
  const q = busqueda.value.toLowerCase();
  render(
    usuarios.filter(u =>
      (u[1] || "").toLowerCase().includes(q) ||
      (u[3] || "").toLowerCase().includes(q) ||
      (u[4] || "").toLowerCase().includes(q)
    )
  );
}

/* ======================================================
   MODAL USUARIO
====================================================== */
function abrirCrear() {
  modo = "crear";
  tituloUsuario.innerText = "Crear Usuario";
  u_user.disabled = false;
  limpiar();
  modalUsuario.style.display = "flex";
}

function editarUsuario(u, p, n, r, a, per) {
  modo = "editar";
  tituloUsuario.innerText = "Editar Usuario";

  u_user.value   = u;
  u_pass.value   = p;
  u_nombre.value = n;
  u_rol.value    = r;
  u_activo.value = a;
  u_user.disabled = true;

  document.querySelectorAll(".permissions input")
    .forEach(c => c.checked = (per || "").split(",").includes(c.value));

  modalUsuario.style.display = "flex";
}

function cerrarUsuario() {
  modalUsuario.style.display = "none";
}

function limpiar() {
  u_user.value = "";
  u_pass.value = "";
  u_nombre.value = "";
  u_rol.value = "ADMIN";
  u_activo.value = "SI";
  document.querySelectorAll(".permissions input")
    .forEach(c => c.checked = false);
}

/* ======================================================
   GUARDAR
====================================================== */
async function guardarUsuario() {
  if (!u_user.value || !u_pass.value || !u_nombre.value) {
    alert("Complete todos los campos");
    return;
  }

  btnGuardar.classList.add("loading");
  btnGuardar.innerHTML = `<div class="loader"></div> Guardando`;

  const permisos = [...document.querySelectorAll(".permissions input:checked")]
    .map(c => c.value)
    .join(",");

  try {
    await fetch(API, {
      method: "POST",
      headers: { "Content-Type":"text/plain;charset=UTF-8" },
      body: JSON.stringify({
        action: modo === "crear" ? "crearUsuario" : "editarUsuario",
        username: u_user.value,
        password: u_pass.value,
        nombre: u_nombre.value,
        rol: u_rol.value,
        activo: u_activo.value,
        permisos
      })
    });

    cerrarUsuario();
    cargarUsuarios();

  } catch (err) {
    console.error(err);
  }

  btnGuardar.classList.remove("loading");
  btnGuardar.innerHTML = "Guardar";
}

/* ======================================================
   ELIMINAR
====================================================== */
async function eliminarUsuario(user) {
  if (!confirm(`Eliminar usuario ${user}?`)) return;

  try {
    await fetch(API, {
      method: "POST",
      headers: { "Content-Type":"text/plain;charset=UTF-8" },
      body: JSON.stringify({
        action: "eliminarUsuario",
        username: user
      })
    });

    cargarUsuarios();

  } catch (err) {
    console.error(err);
  }
}