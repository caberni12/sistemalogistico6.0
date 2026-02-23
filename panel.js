/* ======================================================
   USUARIOS.JS – FUNCIONAL REAL (Apps Script clásico)
====================================================== */

const API =
  "https://script.google.com/macros/s/AKfycbwb_QOTIe9u1-LDSP1psBGeGkJ8gtC-n-e9H7E-rhf0gd2jU29sw-xHhXXp65OwQB_U/exec";

/* ================= DOM ================= */
const btnLoad       = document.getElementById("btnLoad");
const tablaUsuarios = document.getElementById("tablaUsuarios");
const mobileList    = document.getElementById("mobileList");
const busqueda      = document.getElementById("busqueda");

const modalUsuario  = document.getElementById("modalUsuario");
const tituloUsuario = document.getElementById("tituloUsuario");

const u_user   = document.getElementById("u_user");
const u_pass   = document.getElementById("u_pass");
const u_nombre = document.getElementById("u_nombre");
const u_rol    = document.getElementById("u_rol");
const u_activo = document.getElementById("u_activo");
const btnGuardar = document.getElementById("btnGuardar");

/* ================= ESTADO ================= */
let USUARIOS = [];
let MODO = "crear";

/* ======================================================
   AUTO LOAD
====================================================== */
document.addEventListener("DOMContentLoaded", cargarUsuarios);

/* ======================================================
   CARGAR USUARIOS (GET REAL)
====================================================== */
async function cargarUsuarios(){

  tablaUsuarios.innerHTML =
    `<tr><td colspan="6">Cargando…</td></tr>`;
  mobileList.innerHTML = "";

  try{
    const r = await fetch(API + "?action=listarUsuarios");
    const d = await r.json();

    USUARIOS = d.data || [];
    renderUsuarios(USUARIOS);

  }catch(e){
    console.error(e);
    tablaUsuarios.innerHTML =
      `<tr><td colspan="6">Error al cargar usuarios</td></tr>`;
  }
}

/* ======================================================
   RENDER
====================================================== */
function renderUsuarios(data){

  tablaUsuarios.innerHTML = "";
  mobileList.innerHTML = "";

  if(!data.length){
    tablaUsuarios.innerHTML =
      `<tr><td colspan="6">Sin usuarios</td></tr>`;
    return;
  }

  data.forEach(u => {

    const user     = u[1];
    const pass     = u[2];
    const nombre   = u[3];
    const rol      = u[4];
    const activo   = u[5];
    const permisos = u[6] || "";

    /* ===== TABLA ===== */
    tablaUsuarios.innerHTML += `
      <tr>
        <td>${user}</td>
        <td>${pass}</td>
        <td>${nombre}</td>
        <td>${rol}</td>
        <td>${activo}</td>
        <td>
          <button class="btn-edit"
            onclick="editarUsuario(
              '${escapeJS(user)}',
              '${escapeJS(pass)}',
              '${escapeJS(nombre)}',
              '${escapeJS(rol)}',
              '${activo}',
              '${escapeJS(permisos)}'
            )">Editar</button>
          <button class="btn-danger"
            onclick="eliminarUsuario('${escapeJS(user)}')">
            Eliminar
          </button>
        </td>
      </tr>`;

    /* ===== MÓVIL ===== */
    mobileList.innerHTML += `
      <div class="mobile-card">
        <h4>${nombre}</h4>
        <p><b>Usuario:</b> ${user}</p>
        <p><b>Rol:</b> ${rol}</p>
        <p><b>Activo:</b> ${activo}</p>
        <div class="mobile-actions">
          <button class="btn-edit"
            onclick="editarUsuario(
              '${escapeJS(user)}',
              '${escapeJS(pass)}',
              '${escapeJS(nombre)}',
              '${escapeJS(rol)}',
              '${activo}',
              '${escapeJS(permisos)}'
            )">Editar</button>
          <button class="btn-danger"
            onclick="eliminarUsuario('${escapeJS(user)}')">
            Eliminar
          </button>
        </div>
      </div>`;
  });
}

/* ======================================================
   FILTRO
====================================================== */
function filtrar(){
  const q = busqueda.value.toLowerCase();
  renderUsuarios(
    USUARIOS.filter(u =>
      (u[1]||"").toLowerCase().includes(q) ||
      (u[3]||"").toLowerCase().includes(q) ||
      (u[4]||"").toLowerCase().includes(q)
    )
  );
}

/* ======================================================
   MODAL
====================================================== */
function abrirCrear(){
  MODO = "crear";
  tituloUsuario.innerText = "Crear Usuario";
  u_user.disabled = false;
  limpiarUsuario();
  modalUsuario.style.display = "flex";
}

function editarUsuario(u,p,n,r,a,per){

  MODO = "editar";
  tituloUsuario.innerText = "Editar Usuario";

  u_user.value = u;
  u_pass.value = p;
  u_nombre.value = n;
  u_rol.value = r;
  u_activo.value = a;
  u_user.disabled = true;

  document.querySelectorAll(".permissions input")
    .forEach(c => c.checked = per.split(",").includes(c.value));

  modalUsuario.style.display = "flex";
}

function cerrarUsuario(){
  modalUsuario.style.display = "none";
}

function limpiarUsuario(){
  u_user.value = "";
  u_pass.value = "";
  u_nombre.value = "";
  u_rol.value = "ADMIN";
  u_activo.value = "SI";
  document.querySelectorAll(".permissions input")
    .forEach(c => c.checked = false);
}

/* ======================================================
   GUARDAR (FormData)
====================================================== */
async function guardarUsuario(){

  if(!u_user.value || !u_pass.value || !u_nombre.value){
    alert("Complete todos los campos");
    return;
  }

  const permisos = [...document.querySelectorAll(".permissions input:checked")]
    .map(c => c.value)
    .join(",");

  const fd = new FormData();
  fd.append("action", MODO === "crear" ? "crearUsuario" : "editarUsuario");
  fd.append("username", u_user.value);
  fd.append("password", u_pass.value);
  fd.append("nombre", u_nombre.value);
  fd.append("rol", u_rol.value);
  fd.append("activo", u_activo.value);
  fd.append("permisos", permisos);

  await fetch(API,{ method:"POST", body:fd });

  cerrarUsuario();
  cargarUsuarios();
}

/* ======================================================
   ELIMINAR
====================================================== */
async function eliminarUsuario(user){

  if(!confirm("Eliminar usuario " + user + "?")) return;

  const fd = new FormData();
  fd.append("action","eliminarUsuario");
  fd.append("username",user);

  await fetch(API,{ method:"POST", body:fd });
  cargarUsuarios();
}

/* ======================================================
   UTIL
====================================================== */
function escapeJS(t){
  return String(t||"")
    .replace(/\\/g,"\\\\")
    .replace(/'/g,"\\'")
    .replace(/"/g,'\\"')
    .replace(/\n/g," ");
}