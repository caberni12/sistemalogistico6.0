/* ======================================================
   MODULOS.JS – CRUD POR ID (MODAL + TABLA + TARJETAS)
   VERSION FINAL ESTABLE PARA APPS SCRIPT
====================================================== */

/* ================= CONFIG ================= */
const API_MODULOS =
  "https://script.google.com/macros/s/AKfycbwb_QOTIe9u1-LDSP1psBGeGkJ8gtC-n-e9H7E-rhf0gd2jU29sw-xHhXXp65OwQB_U/exec";

/* ================= ESTADO ================= */
let MODULOS = [];
let MODO_MODULO = "crear";
let MODULO_ID = null;

/* ================= DOM ================= */
let modalModulo,
    modalListaModulos,
    tablaModulos,
    m_nombre,
    m_archivo,
    m_icono,
    m_permiso,
    m_activo;

/* ======================================================
   INIT
====================================================== */
document.addEventListener("DOMContentLoaded", () => {

  modalModulo       = document.getElementById("modalModulo");
  modalListaModulos = document.getElementById("modalListaModulos");
  tablaModulos      = document.getElementById("tablaModulos");

  m_nombre  = document.getElementById("m_nombre");
  m_archivo = document.getElementById("m_archivo");
  m_icono   = document.getElementById("m_icono");
  m_permiso = document.getElementById("m_permiso");
  m_activo  = document.getElementById("m_activo");

});

/* ======================================================
   MODALES
====================================================== */
function abrirCrearModulo(){
  MODO_MODULO = "crear";
  MODULO_ID = null;
  limpiarModulo();
  modalModulo.style.display = "flex";
}

function cerrarModulo(){
  modalModulo.style.display = "none";
}

function abrirListaModulos(){
  modalListaModulos.style.display = "flex";
  cargarModulos();
}

function cerrarListaModulos(){
  modalListaModulos.style.display = "none";
}

/* ======================================================
   CARGAR MODULOS
====================================================== */
async function cargarModulos(){

  tablaModulos.innerHTML =
    `<tr><td colspan="5">Cargando…</td></tr>`;

  try{
    const r = await fetch(API_MODULOS + "?action=listarModulos");
    const d = await r.json();

    MODULOS = d.data || [];
    renderModulos();

  }catch(e){
    console.error(e);
    tablaModulos.innerHTML =
      `<tr><td colspan="5">Error al cargar</td></tr>`;
  }
}

/* ======================================================
   RENDER
====================================================== */
function renderModulos(){

  const cards = document.getElementById("modulosCards");
  tablaModulos.innerHTML = "";
  cards.innerHTML = "";

  if(!MODULOS.length){
    tablaModulos.innerHTML =
      `<tr><td colspan="5">Sin módulos</td></tr>`;
    cards.innerHTML =
      `<p style="text-align:center">Sin módulos</p>`;
    return;
  }

  MODULOS.forEach(m => {

    tablaModulos.innerHTML += `
      <tr>
        <td>${m[1]}</td>
        <td>${m[2]}</td>
        <td>${m[4]}</td>
        <td>${m[5]}</td>
        <td>
          <button class="btn-edit"
            onclick="editarModulo(${m[0]},'${escapeJS(m[1])}','${escapeJS(m[2])}','${escapeJS(m[3])}','${escapeJS(m[4])}','${m[5]}')">
            Editar
          </button>
          <button class="btn-danger"
            onclick="eliminarModulo(${m[0]})">
            Eliminar
          </button>
        </td>
      </tr>`;

    cards.innerHTML += `
      <div class="modulo-card">
        <span class="modulo-badge ${m[5]==='SI'?'activo':'inactivo'}">${m[5]}</span>
        <h4>${m[3] || "📦"} ${m[1]}</h4>
        <p><b>Archivo:</b> ${m[2]}</p>
        <p><b>Permiso:</b> ${m[4]}</p>
        <div class="modulo-actions">
          <button class="btn-edit"
            onclick="editarModulo(${m[0]},'${escapeJS(m[1])}','${escapeJS(m[2])}','${escapeJS(m[3])}','${escapeJS(m[4])}','${m[5]}')">
            Editar
          </button>
          <button class="btn-danger"
            onclick="eliminarModulo(${m[0]})">
            Eliminar
          </button>
        </div>
      </div>`;
  });
}

/* ======================================================
   EDITAR
====================================================== */
function editarModulo(id,nombre,archivo,icono,permiso,activo){

  MODO_MODULO = "editar";
  MODULO_ID = id;

  cerrarListaModulos();
  modalModulo.style.display = "flex";

  m_nombre.value  = nombre;
  m_archivo.value = archivo;
  m_icono.value   = icono;
  m_permiso.value = permiso;
  m_activo.value  = activo;
}

/* ======================================================
   LIMPIAR
====================================================== */
function limpiarModulo(){
  m_nombre.value  = "";
  m_archivo.value = "";
  m_icono.value   = "";
  m_permiso.value = "";
  m_activo.value  = "SI";
}

/* ======================================================
   GUARDAR – APPS SCRIPT COMPATIBLE
====================================================== */
async function guardarModulo(){

  if(!m_nombre.value || !m_archivo.value || !m_permiso.value){
    alert("Complete los campos obligatorios");
    return;
  }

  const fd = new FormData();
  fd.append("action", MODO_MODULO === "editar" ? "editarModulo" : "crearModulo");
  fd.append("id", MODULO_ID || "");
  fd.append("nombre", m_nombre.value);
  fd.append("archivo", m_archivo.value);
  fd.append("icono", m_icono.value);
  fd.append("permiso", m_permiso.value);
  fd.append("activo", m_activo.value);

  try{
    await fetch(API_MODULOS, { method:"POST", body:fd });
    cerrarModulo();
    cargarModulos();
  }catch(e){
    console.error(e);
    alert("Error al guardar módulo");
  }
}

/* ======================================================
   ELIMINAR – APPS SCRIPT COMPATIBLE
====================================================== */
async function eliminarModulo(id){

  if(!confirm("¿Eliminar módulo?")) return;

  const fd = new FormData();
  fd.append("action","eliminarModulo");
  fd.append("id",id);

  try{
    await fetch(API_MODULOS,{ method:"POST", body:fd });
    cargarModulos();
  }catch(e){
    console.error(e);
    alert("Error al eliminar módulo");
  }
}

/* ======================================================
   UTIL
====================================================== */
function escapeJS(text){
  return String(text)
    .replace(/\\/g,"\\\\")
    .replace(/'/g,"\\'")
    .replace(/"/g,'\\"')
    .replace(/\n/g," ");
}
