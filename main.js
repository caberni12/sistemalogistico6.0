/* =====================================================
   CONFIG
===================================================== */
const API =
"https://script.google.com/macros/s/AKfycbwb_QOTIe9u1-LDSP1psBGeGkJ8gtC-n-e9H7E-rhf0gd2jU29sw-xHhXXp65OwQB_U/exec";

let USER_IP = "cargando...";

/* =====================================================
   LOADER GLOBAL (INFRA ÚNICA)
===================================================== */
function iniciarProgreso(modo = "init"){
  const bar = document.getElementById("progressBar");
  const overlay = document.getElementById("loadingOverlay");
  const txt = document.getElementById("loadingText");

  if(!bar || !overlay || !txt) return;

  if(modo === "init"){
    txt.textContent = "Iniciando sistema…";
  }else if(modo === "reload"){
    txt.textContent = "Actualizando sistema…";
  }else{
    txt.textContent = "Procesando…";
  }

  overlay.style.display = "flex";
  bar.style.display = "block";
  bar.style.width = "0%";

  let progreso = 0;
  bar._interval = setInterval(()=>{
    progreso += Math.random() * 12;
    if(progreso >= 90) progreso = 90;
    bar.style.width = progreso + "%";
  }, 180);
}

function finalizarProgreso(){
  const bar = document.getElementById("progressBar");
  const overlay = document.getElementById("loadingOverlay");
  if(!bar || !overlay) return;

  clearInterval(bar._interval);
  bar.style.width = "100%";

  setTimeout(()=>{
    bar.style.display = "none";
    bar.style.width = "0%";
    overlay.style.display = "none";
  }, 400);
}

/* =====================================================
   INIT – INICIO DE SESIÓN
===================================================== */
document.addEventListener("DOMContentLoaded", async () => {

  // Exponer DOM global (necesario en JS externo)
  window.panel        = document.getElementById("panel");
  window.viewer       = document.getElementById("viewer");
  window.frame        = document.getElementById("frame");
  window.viewerTitle  = document.getElementById("viewerTitle");
  window.conexionInfo = document.getElementById("conexionInfo");

  iniciarProgreso("init");

  const user = await validarSesionGlobal();
  if(!user){
    finalizarProgreso();
    return;
  }

  document.getElementById("usuario").innerHTML =
    `👤 ${user.nombre} · ${user.rol}`;

  await cargarModulos(user);
  obtenerIP();
  iniciarReloj();

  finalizarProgreso();
});

/* =====================================================
   CARGA DE MÓDULOS / TARJETAS
===================================================== */
async function cargarModulos(user){

  const r = await fetch(`${API}?action=listarModulos`);
  const res = await r.json();

  panel.innerHTML = "";

  if(!res.data || !Array.isArray(res.data)) return;

  res.data.forEach(m=>{
    const [id,nombre,archivo,icono,permiso,activo] = m;

    if(activo !== "SI") return;
    if(user.rol !== "ADMIN" && !user.permisos.includes(permiso)) return;

    panel.insertAdjacentHTML("beforeend",`
      <div class="card" onclick="abrirModulo('${archivo}','${nombre}')">
        <div class="card-icon">${icono || "📦"}</div>
        <h3>${nombre}</h3>
        <p>Módulo del sistema</p>
      </div>
    `);
  });
}

/* =====================================================
   VISOR DE MÓDULOS
===================================================== */
function abrirModulo(url,titulo){
  panel.style.display = "none";
  viewer.style.display = "flex";
  frame.src = url;
  viewerTitle.textContent = titulo;
}

function volver(){
  viewer.style.display = "none";
  panel.style.display = "grid";
  frame.src = "";
}

/* =====================================================
   RECARGAR PANEL
===================================================== */
async function recargarPanel(){
  iniciarProgreso("reload");

  const user = await validarSesionGlobal();
  if(!user){
    finalizarProgreso();
    return;
  }

  volver();
  await cargarModulos(user);

  finalizarProgreso();
}

/* =====================================================
   LOGOUT
===================================================== */
function cerrarSesion(){
  cerrarSesionGlobal();
}

/* =====================================================
   FECHA / HORA / IP
===================================================== */
function iniciarReloj(){
  actualizarConexion();
  setInterval(actualizarConexion,1000);
}

function actualizarConexion(){
  const now = new Date();
  conexionInfo.innerHTML = `
    📅 ${now.toLocaleDateString("es-CL")}<br>
    ⏰ ${now.toLocaleTimeString("es-CL")}<br>
    🌐 IP: ${USER_IP}
  `;
}

async function obtenerIP(){
  try{
    const r = await fetch("https://api.ipify.org?format=json");
    const d = await r.json();
    USER_IP = d.ip;
  }catch{
    USER_IP = "no disponible";
  }
}