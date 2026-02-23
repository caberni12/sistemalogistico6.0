/* ======================================================
   MODULOS.JS – CRUD COMPLETO (TABLA + TARJETAS + MODAL)
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
    modulosCards,
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
  modulosCards      = document.getElementById("modulosCards");

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
  modulosCards.innerHTML = "";

  try{
    const r = await fetch(API_MODULOS, {
      method: "POST",
      headers: { "Content-Type":"text/plain;charset=UTF-8" },
      body: JSON.stringify({ action:"listarModulos" })
    });

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

  tablaModulos.innerHTML = "";
  modulosCards.innerHTML = "";

  if(!MODULOS.length){
    tablaModulos.innerHTML =
      `<tr><td colspan="5">Sin módulos</td></tr>`;
    modulosCards.innerHTML =
      `<p style="text-align:center">Sin módulos</p>`;
    return;
  }

  MODULOS.forEach(m => {

    const id      = m[0];
    const nombre  = m[1];
    const archivo = m[2];
    const icono   = m[3] || "📦";
    const permiso = m[4];
    const activo  = m[5];

    /* ===== TABLA ===== */
    tablaModulos.innerHTML += `
      <tr>
        <td>${nombre}</td>
        <td>${archivo}</td>
        <td>${permiso}</td>
        <td>${activo}</td>
        <td>
          <button class="btn-edit"
            onclick="editarModulo(
              ${id},
              '${escapeJS(nombre)}',
              '${escapeJS(archivo)}',
              '${escapeJS(icono)}',
              '${escapeJS(permiso)}',
              '${activo}'
            )">
            Editar
          </button>
          <button class="btn-danger"
            onclick="eliminarModulo(${id})">
            Eliminar
          </button>
        </td>
      </tr>`;

    /* ===== TARJETA MÓVIL ===== */
    modulosCards.innerHTML += `
      <div class="modulo-card">
        <span class="modulo-badge ${activo==='SI'?'activo':'inactivo'}">
          ${activo}
        </span>
        <h4>${icono} ${nombre}</h4>
        <p><b>Archivo:</b> ${archivo}</p>
        <p><b>Permiso:</b> ${permiso}</p>
        <div class="modulo-actions">
          <button class="btn-edit"
            onclick="editarModulo(
              ${id},
              '${escapeJS(nombre)}',
              '${escapeJS(archivo)}',
              '${escapeJS(icono)}',
              '${escapeJS(permiso)}',
              '${activo}'
            )">
            Editar
          </button>
          <button class="btn-danger"
            onclick="eliminarModulo(${id})">
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
   GUARDAR
====================================================== */
async function guardarModulo(){

  if(!m_nombre.value || !m_archivo.value || !m_permiso.value){
    alert("Complete los campos obligatorios");
    return;
  }

  const payload = {
    action : MODO_MODULO === "editar" ? "editarModulo" : "crearModulo",
    id     : MODULO_ID,
    nombre : m_nombre.value,
    archivo: m_archivo.value,
    icono  : m_icono.value,
    permiso: m_permiso.value,
    activo : m_activo.value
  };

  try{
    await fetch(API_MODULOS,{
      method:"POST",
      headers:{ "Content-Type":"text/plain;charset=UTF-8" },
      body: JSON.stringify(payload)
    });

    cerrarModulo();
    cargarModulos();

  }catch(e){
    console.error(e);
    alert("Error al guardar módulo");
  }
}

/* ======================================================
   ELIMINAR
====================================================== */
async function eliminarModulo(id){

  if(!confirm("¿Eliminar módulo?")) return;

  try{
    await fetch(API_MODULOS,{
      method:"POST",
      headers:{ "Content-Type":"text/plain;charset=UTF-8" },
      body: JSON.stringify({
        action:"eliminarModulo",
        id
      })
    });

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
  return String(text || "")
    .replace(/\\/g,"\\\\")
    .replace(/'/g,"\\'")
    .replace(/"/g,'\\"')
    .replace(/\n/g," ");
}