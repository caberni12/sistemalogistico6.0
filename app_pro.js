
/* =====================================================
   APP PRO UNIFICADO – COMPLETO Y FUNCIONAL
   Combina app.js + app2.js SIN perder funciones
   ===================================================== */

const API = "https://script.google.com/macros/s/AKfycbzC_qrSyXeTw9NcO40ap4x2cfs3FZIBKqMZLV9kKhYYh7n2XTPAuj1Vb2ckpFBWi8Ys/exec";

/* ===================== ESTADO GLOBAL ===================== */
let productos = [];
let capturas = JSON.parse(localStorage.getItem("capturas") || "[]");

let scannerActivo = null;
let scannerTarget = null;
let torch = false;
let editIndex = -1;

/* ===== IMPORTACIÓN PERSISTENTE ===== */
let bufferImportacion = JSON.parse(localStorage.getItem("bufferImportacion") || "null");
let estadoImportacion = JSON.parse(localStorage.getItem("estadoImportacion") || "null");

/* ===================== CARGA INICIAL ===================== */
document.addEventListener("DOMContentLoaded", () => {

  operador.value = localStorage.getItem("operador") || "";
  ubicacion.value = localStorage.getItem("ubicacion") || "";

  fetch(API)
    .then(r => r.json())
    .then(d => {
      productos = d;
      localStorage.setItem("productos", JSON.stringify(d));
    })
    .catch(() => {
      const c = localStorage.getItem("productos");
      if (c) productos = JSON.parse(c);
    });

  render();

  if (estadoImportacion && estadoImportacion.enProceso) {
    openTab("importar");
    barra.style.width = estadoImportacion.progreso + "%";
    mensaje.innerText = estadoImportacion.mensaje;
  }
});

/* ===================== TABS ===================== */
function openTab(id) {
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* ===================== CAPTURADOR ===================== */
function limpiarUbicacion() {
  ubicacion.value = "";
  localStorage.removeItem("ubicacion");
  previewIngreso();
}

function buscarDescripcion() {
  const c = codigo.value.trim().toLowerCase();
  if (!c) return;
  const p = productos.find(x => String(x.CODIGO).toLowerCase() === c);
  if (p) {
    descripcion.value = p.DESCRIPCION || "";
    cantidad.value = 1;
  }
}

function previewIngreso() {
  if (!codigo.value && !descripcion.value) {
    preview.innerHTML = "";
    return;
  }
  preview.innerHTML = `
  <div class="row preview">
    <b>🕒 PREVISUALIZANDO</b><br><br>
    <b>${codigo.value || "-"}</b> – ${descripcion.value || "-"}<br>
    <span class="small">
      ${ubicacion.value || "SIN UBICACIÓN"} |
      ${operador.value || "-"} |
      Cant: ${cantidad.value}
    </span>
  </div>`;
}

/* ===================== SCANNER PRO ===================== */
function activarScan(tipo) {
  cerrarScanner();
  scannerTarget = tipo;

  const cont = document.getElementById("scanner-" + tipo);
  if (!cont) return;

  // crear contenedor limpio
  cont.innerHTML = `<div id="scannerBox"></div>`;

  // iniciar scanner
  scannerActivo = new Html5Qrcode("scannerBox");

  scannerActivo.start(
    { facingMode: { exact: "environment" } },
    {
      fps: 10,
      qrbox: 260
    },
    txt => {
      if (!txt) return;

      // sonido + vibración
      document.getElementById("beep")?.play();
      navigator.vibrate?.(150);

      if (scannerTarget === "codigo") {
        codigo.value = txt;
        buscarDescripcion();
      }

      if (scannerTarget === "ubicacion") {
        ubicacion.value = txt;
        localStorage.setItem("ubicacion", txt);
      }

      previewIngreso();
      cerrarScanner();
    }
  );

  // overlay UI (después del video)
  setTimeout(() => {
    const box = document.getElementById("scannerBox");
    if (!box) return;

    box.insertAdjacentHTML("afterbegin", `
      <div class="scanner-overlay">
        <button class="scanner-btn close" onclick="cerrarScanner()">✖</button>
        <button class="scanner-btn torch" onclick="toggleTorch()">🔦</button>
      </div>
      <div class="scan-frame"></div>
      <div class="scan-line"></div>
    `);
  }, 300);
}


function cerrarScanner() {
  if (!scannerActivo) return;

  scannerActivo.stop().then(() => {
    scannerActivo.clear();
    scannerActivo = null;
    scannerTarget = null;
    torch = false;
    document.querySelectorAll(".scanner-slot").forEach(d => d.innerHTML = "");
  }).catch(()=>{});
}


function toggleTorch() {
  if (!scannerActivo) return;

  torch = !torch;

  scannerActivo.applyVideoConstraints({
    advanced: [{ torch }]
  }).then(() => {
    document
      .querySelector(".scanner-btn.torch")
      ?.classList.toggle("on", torch);
  }).catch(() => {
    torch = false;
  });
}



/* ===================== GUARDAR / EDITAR ===================== */
function ingresar() {
  if (!codigo.value.trim()) {
    alert("❌ Digite un código válido");
    return;
  }

  localStorage.setItem("operador", operador.value);
  ubicacion.value
    ? localStorage.setItem("ubicacion", ubicacion.value)
    : localStorage.removeItem("ubicacion");

  const d = {
    Fecha: new Date().toLocaleString(),
    Operador: operador.value || "",
    Ubicación: ubicacion.value || "SIN UBICACIÓN",
    Código: codigo.value,
    Descripción: descripcion.value,
    Cantidad: Number(cantidad.value)
  };

  editIndex >= 0 ? capturas[editIndex] = d : capturas.push(d);
  editIndex = -1;

  localStorage.setItem("capturas", JSON.stringify(capturas));
  limpiar();
  render();
}

function cancelarEdicion() {
  editIndex = -1;
  limpiar();
}

function limpiar() {
  codigo.value = "";
  descripcion.value = "";
  cantidad.value = 1;
  preview.innerHTML = "";
}

/* ===================== RENDER ===================== */
function render() {
  tabla.innerHTML = "";
  let total = 0;

  capturas.forEach((c, i) => {
    total += Number(c.Cantidad) || 0;
    tabla.innerHTML += `
    <div class="row ${editIndex === i ? "editing" : ""}">
      <button class="delbtn" onclick="event.stopPropagation();eliminarItem(${i})">×</button>
      <div onclick="cargarParaEditar(${i})">
        <b>${c.Código}</b> – ${c.Descripción}<br>
        <span class="small">
          ${c.Ubicación} | ${c.Operador} | ${c.Fecha} | Cant: ${c.Cantidad}
        </span>
      </div>
    </div>`;
  });

  totalizador.innerText = "Total unidades: " + total;
}

function cargarParaEditar(i) {
  const c = capturas[i];
  operador.value = c.Operador;
  ubicacion.value = c.Ubicación === "SIN UBICACIÓN" ? "" : c.Ubicación;
  codigo.value = c.Código;
  descripcion.value = c.Descripción;
  cantidad.value = c.Cantidad;
  editIndex = i;
  previewIngreso();
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function eliminarItem(i) {
  if (!confirm("¿Eliminar este registro?")) return;
  capturas.splice(i, 1);
  localStorage.setItem("capturas", JSON.stringify(capturas));
  render();
}

/* ===================== EXPORTAR ===================== */
function exportarPDF() {
  if (!capturas.length) return alert("Sin datos");
  const w = window.open("");
  let h = "<h3>Reporte de Captura</h3><table border='1'><tr>";
  Object.keys(capturas[0]).forEach(k => h += "<th>" + k + "</th>");
  h += "</tr>";
  capturas.forEach(r => {
    h += "<tr>";
    Object.values(r).forEach(v => h += "<td>" + v + "</td>");
    h += "</tr>";
  });
  h += "</table>";
  w.document.write(h);
  w.print();
}

async function finalizar() {
  if (!capturas.length) return;
  const data = capturas.map(r => ({ ...r, Código: "" + r.Código }));
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Captura");

  const blob = new Blob(
    [XLSX.write(wb, { bookType: "xlsx", type: "array" })],
    { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }
  );

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "captura.xlsx";
  a.click();

  localStorage.removeItem("capturas");
  capturas = [];
  limpiar();
  render();
}

/* ===================== IMPORTADOR ===================== */
function importarMaestra() {
  const file = fileExcel.files[0];
  if (!file && bufferImportacion) {
    enviarMaestra(bufferImportacion);
    return;
  }
  if (!file) return alert("Selecciona Excel");

  const reader = new FileReader();
  reader.onload = e => {
    const wb = XLSX.read(e.target.result, { type: "binary" });
    const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
    bufferImportacion = data;
    localStorage.setItem("bufferImportacion", JSON.stringify(data));
    enviarMaestra(data);
  };
  reader.readAsBinaryString(file);
}

async function enviarMaestra(data) {
  estadoImportacion = { enProceso: true, progreso: 0, mensaje: "⏳ Importando..." };
  localStorage.setItem("estadoImportacion", JSON.stringify(estadoImportacion));

  barra.style.width = "0%";
  mensaje.innerText = estadoImportacion.mensaje;

  let p = 0;
  const t = setInterval(() => {
    p += 10;
    barra.style.width = p + "%";
    estadoImportacion.progreso = p;
    localStorage.setItem("estadoImportacion", JSON.stringify(estadoImportacion));
    if (p >= 90) clearInterval(t);
  }, 200);

  try {
    await fetch(API, { method: "POST", body: JSON.stringify({ accion: "importar", data }) });
    clearInterval(t);
    barra.style.width = "100%";
    mensaje.innerText = "✅ Importación exitosa";
    localStorage.removeItem("estadoImportacion");
    localStorage.removeItem("bufferImportacion");
  } catch (e) {
    mensaje.innerText = "❌ Error al importar";
  }
}

/* ===================== CONSULTA ===================== */
let timerConsulta = null, filasConsulta = [], indexConsulta = -1;

function abrirModalConsulta() {
  modalConsulta.classList.add("show");
  buscarConsulta.value = "";
  resultadoConsulta.innerHTML = "";
  scrollConsulta.style.display = "none";
  msgConsulta.innerText = "Escriba para consultar";
  filasConsulta = [];
  indexConsulta = -1;
  buscarConsulta.focus();
}

function cerrarModalConsulta() {
  modalConsulta.classList.remove("show");
}

function filtrarConsulta() {
  clearTimeout(timerConsulta);
  timerConsulta = setTimeout(filtrarConsultaReal, 250);
}

function filtrarConsultaReal() {
  const q = buscarConsulta.value.trim().toLowerCase();
  resultadoConsulta.innerHTML = "";
  filasConsulta = [];
  indexConsulta = -1;

  if (q.length < 2) {
    msgConsulta.innerText = "Escriba al menos 2 caracteres";
    return;
  }

  for (const p of productos) {
    if (
      String(p.CODIGO).toLowerCase().includes(q) ||
      String(p.DESCRIPCION).toLowerCase().includes(q)
    ) {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${p.CODIGO}</td><td>${p.DESCRIPCION}</td>`;
      tr.onclick = () => activarFilaConsulta(filasConsulta.indexOf(tr));
      resultadoConsulta.appendChild(tr);
      filasConsulta.push(tr);
      if (filasConsulta.length >= 50) break;
    }
  }

  if (!filasConsulta.length) {
    msgConsulta.innerText = "❌ Sin coincidencias";
    return;
  }

  scrollConsulta.style.display = "block";
  activarFilaConsulta(0);
}

function activarFilaConsulta(i){
  if(i < 0 || i >= filasConsulta.length) return;

  // quitar selección anterior
  filasConsulta.forEach(r => r.classList.remove("selected"));

  // marcar nueva fila
  const fila = filasConsulta[i];
  fila.classList.add("selected");
  indexConsulta = i;

  // =============================
  // AUTO SCROLL (LA CLAVE)
  // =============================
  const cont = scrollConsulta;

  const filaTop = fila.offsetTop;
  const filaBottom = filaTop + fila.offsetHeight;

  const contTop = cont.scrollTop;
  const contBottom = contTop + cont.clientHeight;

  // si baja y se sale por abajo
  if (filaBottom > contBottom) {
    cont.scrollTop = filaBottom - cont.clientHeight + 8;
  }

  // si sube y se sale por arriba
  if (filaTop < contTop) {
    cont.scrollTop = filaTop - 8;
  }
}


document.addEventListener("keydown", e => {

  // solo cuando el modal está abierto
  if (!modalConsulta.classList.contains("show")) return;

  // si no hay filas, no hace nada
  if (!filasConsulta.length) return;

  // PREVIENE que el input use las flechas
  if (["ArrowDown","ArrowUp"].includes(e.key)) {
    e.preventDefault();
  }

  if (e.key === "ArrowDown") {
    activarFilaConsulta(
      Math.min(indexConsulta + 1, filasConsulta.length - 1)
    );
  }

  if (e.key === "ArrowUp") {
    activarFilaConsulta(
      Math.max(indexConsulta - 1, 0)
    );
  }

  if (e.key === "Enter") {
    filasConsulta[indexConsulta]?.click();
  }

  if (e.key === "Escape") {
    cerrarModalConsulta();
  }
});

/* ===== EXPORTAR MAESTRA DE PRODUCTOS ===== */
function exportarMaestraProductos(){

  if(!productos || !productos.length){
    alert("❌ No hay productos para exportar");
    return;
  }
  
  // Fuerza CODIGO como texto (muy importante)
  const data = productos.map(p => ({
    CODIGO: "" + String(p.CODIGO),
    DESCRIPCION: p.DESCRIPCION
  }));
  
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Maestra_Productos");
  
  const excel = XLSX.write(wb, {
    bookType: "xlsx",
    type: "array"
  });
  
  const blob = new Blob([excel], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  });
  
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "maestra_productos.xlsx";
  a.click();
  
  URL.revokeObjectURL(url);
  }
  

/* ===================== PROTEGER RECARGA ===================== */
window.addEventListener("beforeunload", e => {
  const est = JSON.parse(localStorage.getItem("estadoImportacion") || "null");
  if (est && est.enProceso) {
    e.preventDefault();
    e.returnValue = "";
  }
});
