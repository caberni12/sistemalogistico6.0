/* ======================================================
   MODULOS.JS – CRUD POR ID (MODAL + TARJETAS MÓVIL)
====================================================== */

/* ================= CONFIG ================= */
const"https://script.google.com/macros/s/AKfycbwb_QOTIe9u1-LDSP1psBGeGkJ8gtC-n-e9H7E-rhf0gd2jU29sw-xHhXXp65OwQB_U/exec";

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
   ABRIR MODALES
====================================================== */
function abrirCrearModulo(){
  MODO_MODULO = "crear";
  MODULO_ID = null;
  limpiarModulo();
  modalModulo.style.display = "flex";
}

function abrirListaModulos(){
  modalListaModulos.style.display = "flex";
  cargarModulos();
}

function cerrarListaModulos(){
  modalListaModulos.style.display = "none";
}

/* ======================================================
   CARGAR
====================================================== */
async function cargarModulos(){
  tablaModulos.innerHTML = `<tr><td colspan="5">Cargando…</td></tr>`;

  const r = await fetch(API_MODULOS + "?action=listarModulos");
  const d = await r.json();

  MODULOS = d.data || [];
  renderModulos();
}

/* ======================================================
   RENDER TABLA (WEB) + TARJETAS (MÓVIL)
====================================================== */
function renderModulos(){

  tablaModulos.innerHTML = "";
  const cards = document.getElementById("modulosCards");
  cards.innerHTML = "";

  if(!MODULOS.length){
    tablaModulos.innerHTML = `<tr><td colspan="5">Sin módulos</td></tr>`;
    cards.innerHTML = `<p style="text-align:center">Sin módulos</p>`;
    return;
  }

  MODULOS.forEach(m => {

    /* ===== TABLA WEB ===== */
    tablaModulos.innerHTML += `
      <tr>
        <td>${m[1]}</td>
        <td>${m[2]}</td>
        <td>${m[4]}</td>
        <td>${m[5]}</td>
        <td>
          <button class="btn-edit"
            onclick="editarModulo(${m[0]},
              '${m[1]}','${m[2]}','${m[3]}','${m[4]}','${m[5]}')">
            Editar
          </button>
          <button class="btn-danger"
            onclick="eliminarModulo(${m[0]})">
            Eliminar
          </button>
        </td>
      </tr>
    `;

    /* ===== TARJETA MÓVIL ===== */
    cards.innerHTML += `
      <div class="modulo-card">
        <span class="modulo-badge ${m[5]==='SI'?'activo':'inactivo'}">
          ${m[5]}
        </span>

        <h4>${m[3] || "📦"} ${m[1]}</h4>

        <p><b>Archivo:</b> ${m[2]}</p>
        <p><b>Permiso:</b> ${m[4]}</p>

        <div class="modulo-actions">
          <button class="btn-edit"
            onclick="editarModulo(${m[0]},
              '${m[1]}','${m[2]}','${m[3]}','${m[4]}','${m[5]}')">
            Editar
          </button>
          <button class="btn-danger"
            onclick="eliminarModulo(${m[0]})">
            Eliminar
          </button>
        </div>
      </div>
    `;
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
  const payload = {
    action: MODO_MODULO === "editar" ? "editarModulo" : "crearModulo",
    id: MODULO_ID,
    nombre: m_nombre.value.trim(),
    archivo: m_archivo.value.trim(),
    icono: m_icono.value.trim(),
    permiso: m_permiso.value.trim(),
    activo: m_activo.value
  };

  if(!payload.nombre || !payload.archivo || !payload.permiso){
    alert("Complete los campos obligatorios");
    return;
  }

  await fetch(API_MODULOS,{
    method:"POST",
    headers:{ "Content-Type":"text/plain" },
    body: JSON.stringify(payload)
  });

  cerrarModulo();
  cargarModulos();
}

/* ======================================================
   ELIMINAR
====================================================== */
async function eliminarModulo(id){
  if(!confirm("¿Eliminar módulo?")) return;

  await fetch(API_MODULOS,{
    method:"POST",
    headers:{ "Content-Type":"text/plain" },
    body: JSON.stringify({ action:"eliminarModulo", id })
  });

  cargarModulos();
}

/* ======================================================
   CERRAR MODAL
====================================================== */
function cerrarModulo(){
  modalModulo.style.display = "none";
}

