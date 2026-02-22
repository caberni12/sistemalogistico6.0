/* =====================================================
   CONFIG
===================================================== */
const API =
"https://script.google.com/macros/s/AKfycbwb_QOTIe9u1-LDSP1psBGeGkJ8gtC-n-e9H7E-rhf0gd2jU29sw-xHhXXp65OwQB_U/exec";

let USER_IP = "cargando...";
let MODULO_ACTIVO = null;

/* =====================================================
   LOADER GLOBAL (INFRA ÚNICA)
===================================================== */
function iniciarProgreso(modo = "init"){
  const bar = document.getElementById("progressBar");
  const overlay = document.getElementById("loadingOverlay");
  const txt = document.getElementById("loadingText");
  if(!bar || !overlay || !txt) return;

  txt.textContent =
    modo === "reload"
      ? "Actualizando sistema…"
      : modo === "init"
      ? "Iniciando sistema…"
      : "Procesando…";

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

  // DOM global (JS externo)
  window.panel        = document.getElementById("panel");
  window.viewer       = document.getElementById("viewer");
  window.frame        = document.getElementById("frame");
  window.viewerTitle  = document.getElementById("viewerTitle");
  window.conexionInfo = document.getElementById("conexionInfo");

  // Recuperar módulo activo si existe
  const saved = sessionStorage.getItem("MODULO_ACTIVO");
  if(saved) MODULO_ACTIVO = JSON.parse(saved);

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

  // Restaurar módulo activo al iniciar
  if(MODULO_ACTIVO){
    abrirModulo(MODULO_ACTIVO.url, MODULO_ACTIVO.titulo, true);
  }

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

    const activa =
      MODULO_ACTIVO && MODULO_ACTIVO.url === archivo ? "active" : "";

    panel.insertAdjacentHTML("beforeend",`
      <div class="card ${activa}"
           data-url="${archivo}"
           data-titulo="${nombre}"
           onclick="abrirModulo('${archivo}','${nombre}')">
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
function abrirModulo(url, titulo, restaurando = false){
  MODULO_ACTIVO = { url, titulo };
  sessionStorage.setItem("MODULO_ACTIVO", JSON.stringify(MODULO_ACTIVO));

  // Marcar tarjeta activa
  document.querySelectorAll(".card").forEach(c=>{
    c.classList.toggle("active", c.dataset.url === url);
  });

  panel.style.display = "none";
  viewer.style.display = "flex";

  if(!restaurando) frame.src = url;
  viewerTitle.textContent = titulo;
}

function volver(){
  MODULO_ACTIVO = null;
  sessionStorage.removeItem("MODULO_ACTIVO");

  document.querySelectorAll(".card").forEach(c=>{
    c.classList.remove("active");
  });

  viewer.style.display = "none";
  panel.style.display = "grid";
  frame.src = "";
}

/* =====================================================
   RECARGAR PANEL (MANTIENE MÓDULO ACTIVO)
===================================================== */
async function recargarPanel(){
  iniciarProgreso("reload");

  const user = await validarSesionGlobal();
  if(!user){
    finalizarProgreso();
    return;
  }

  await cargarModulos(user);

  if(MODULO_ACTIVO){
    panel.style.display = "none";
    viewer.style.display = "flex";
    frame.src = MODULO_ACTIVO.url;
    viewerTitle.textContent = MODULO_ACTIVO.titulo;
  }else{
    viewer.style.display = "none";
    panel.style.display = "grid";
  }

  finalizarProgreso();
}

/* =====================================================
   LOGOUT
===================================================== */
function cerrarSesion(){
  sessionStorage.removeItem("MODULO_ACTIVO");
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