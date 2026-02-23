/* ======================================================
   MODULOS.JS – FUNCIONAL REAL (Apps Script clásico)
====================================================== */

const API_MODULOS =
  "https://script.google.com/macros/s/AKfycbwb_QOTIe9u1-LDSP1psBGeGkJ8gtC-n-e9H7E-rhf0gd2jU29sw-xHhXXp65OwQB_U/exec";

let MODULOS = [];
let MODO_MODULO = "crear";
let MODULO_ID = null;

/* ================= DOM ================= */
const modalModulo       = document.getElementById("modalModulo");
const modalListaModulos = document.getElementById("modalListaModulos");
const tablaModulos      = document.getElementById("tablaModulos");
const modulosCards      = document.getElementById("modulosCards");

const m_nombre  = document.getElementById("m_nombre");
const m_archivo = document.getElementById("m_archivo");
const m_icono   = document.getElementById("m_icono");
const m_permiso = document.getElementById("m_permiso");
const m_activo  = document.getElementById("m_activo");

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
   CARGAR MODULOS (GET REAL)
====================================================== */
async function cargarModulos(){

  tablaModulos.innerHTML =
    `<tr><td colspan="5">Cargando…</td></tr>`;
  modulosCards.innerHTML = "";

  try{
    const r = await fetch(API_MODULOS + "?action=listarModulos");
    const d = await r.json();

    MODULOS = d.data || [];
    renderModulos();

  }catch(e){
    console.error(e);
    tablaModulos.innerHTML =
      `<tr><td colspan="5">Error al cargar módulos</td></tr>`;
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
    return;
  }

  MODULOS.forEach(m => {

    const id      = m[0];
    const nombre  = m[1];
    const archivo = m[2];
    const icono   = m[3] || "📦";
    const permiso = m[4];
    const activo  = m[5];

    tablaModulos.innerHTML += `
      <tr>
        <td>${nombre}</td>
        <td>${archivo}</td>
        <td>${permiso}</td>
        <td>${activo}</td>
        <td>
          <button class="btn-edit"
            onclick="editarModulo(${id},
              '${escapeJS(nombre)}',
              '${escapeJS(archivo)}',
              '${escapeJS(icono)}',
              '${escapeJS(permiso)}',
              '${activo}')">
            Editar
          </button>
          <button class="btn-danger"
            onclick="eliminarModulo(${id})">
            Eliminar
          </button>
        </td>
      </tr>`;

    modulosCards.innerHTML += `
      <div class="modulo-card">
        <span class="modulo-badge ${activo==='SI'?'activo':'inactivo'}">${activo}</span>
        <h4>${icono} ${nombre}</h4>
        <p><b>Archivo:</b> ${archivo}</p>
        <p><b>Permiso:</b> ${permiso}</p>
        <div class="modulo-actions">
          <button class="btn-edit"
            onclick="editarModulo(${id},
              '${escapeJS(nombre)}',
              '${escapeJS(archivo)}',
              '${escapeJS(icono)}',
              '${escapeJS(permiso)}',
              '${activo}')">
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
   GUARDAR (FormData REAL)
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

  await fetch(API_MODULOS,{ method:"POST", body:fd });

  cerrarModulo();
  cargarModulos();
}

/* ======================================================
   ELIMINAR
====================================================== */
async function eliminarModulo(id){

  if(!confirm("¿Eliminar módulo?")) return;

  const fd = new FormData();
  fd.append("action","eliminarModulo");
  fd.append("id",id);

  await fetch(API_MODULOS,{ method:"POST", body:fd });
  cargarModulos();
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