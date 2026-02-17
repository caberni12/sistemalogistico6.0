/* =====================================================
   CONFIGURACIÓN
===================================================== */
const URL_GS =
  'https://script.google.com/macros/s/AKfycbwP-NHZUqboSXDPq8HcWEl1qseurNEym8D0jv__DgZG1N0xkEmAQOSrKmLvXrxRZACv1g/exec';

let DATA = [];
let ORIGEN = /android|iphone|ipad|mobile/i.test(navigator.userAgent)
  ? 'MOBILE'
  : 'WEB';

/* =====================================================
   UTILIDADES
===================================================== */
function normalizarCodigo(v){
  return String(v ?? '').trim();
}

function formatFecha(f){
  if(!f) return '';
  const d = new Date(f);
  if(isNaN(d)) return f;
  return d.toLocaleString('es-CL',{
    day:'2-digit', month:'short', year:'numeric',
    hour:'2-digit', minute:'2-digit'
  });
}

/* =====================================================
   MODAL
===================================================== */
function abrirModal(){
  limpiarFormulario();
  document.getElementById('origen').value = ORIGEN;
  document.getElementById('modal').classList.add('active');
}

function cerrarModal(){
  cerrarScanner();
  document.getElementById('modal').classList.remove('active');
}

/* =====================================================
   AUTOCOMPLETE CÓDIGO
===================================================== */
let timerBuscar = null;

function buscarCodigo(){
  clearTimeout(timerBuscar);

  const cod = normalizarCodigo(document.getElementById('codigo').value);
  const desc = document.getElementById('descripcion');
  const sug  = document.getElementById('suggest');

  if(!cod){
    desc.value='';
    sug.style.display='none';
    return;
  }

  timerBuscar = setTimeout(()=>{
    fetch(`${URL_GS}?codigo=${encodeURIComponent(cod)}`)
      .then(r=>r.json())
      .then(d=>{
        if(d && d.descripcion){
          desc.value = d.descripcion;
          sug.innerHTML = `
            <div onclick="selectProducto('${cod}','${d.descripcion}')">
              ${cod} – ${d.descripcion}
            </div>`;
          sug.style.display='block';
        }else{
          desc.value='';
          sug.style.display='none';
        }
      })
      .catch(()=>{
        desc.value='';
        sug.style.display='none';
      });
  },300);
}

function selectProducto(c,d){
  document.getElementById('codigo').value = c;
  document.getElementById('descripcion').value = d;
  document.getElementById('suggest').style.display = 'none';
}

/* =====================================================
   CARGAR DATOS  (🔥 FIX DEFINITIVO)
===================================================== */
function cargar(){
  fetch(URL_GS)
    .then(r=>r.json())
    .then(d=>{
      // ✔ soporta array directo o { data: [] }
      DATA = Array.isArray(d) ? d : (d.data || []);
      renderTabla(DATA);
    })
    .catch(()=>{
      DATA = [];
      renderTabla([]);
    });
}

/* =====================================================
   RENDER TABLA
===================================================== */
function renderTabla(arr){
  const t = document.getElementById('tabla');
  t.innerHTML = '';

  arr.forEach(r=>{
    t.innerHTML += `
      <tr>
        <td>${r[5]}</td>
        <td>${r[6]}</td>
        <td>${r[4]}</td>
        <td>${r[7]}</td>
        <td>${formatFecha(r[1])}</td>
        <td>${formatFecha(r[2])}</td>
        <td>${formatFecha(r[3])}</td>
        <td>${r[8]}</td>
        <td>${r[9]}</td>
        <td>${r[10]}</td>
        <td class="actions-td">
          <button class="edit" onclick='editar(${JSON.stringify(r)})'>✏️</button>
          <button class="del" onclick='eliminar("${r[0]}")'>🗑️</button>
        </td>
      </tr>`;
  });
}

/* =====================================================
   EDITAR (STOCK REAL)
===================================================== */
let CANTIDAD_BASE = 0;

function editar(r){
  abrirModal();

  CANTIDAD_BASE = Number(r[7]) || 0;

  document.getElementById('id').value = r[0];
  document.getElementById('fecha_entrada').value = r[2] ? r[2].slice(0,10) : '';
  document.getElementById('fecha_salida').value  = r[3] ? r[3].slice(0,10) : '';
  document.getElementById('ubicacion').value   = r[4];
  document.getElementById('codigo').value      = r[5];
  document.getElementById('descripcion').value = r[6];

  document.getElementById('cantidad').value = CANTIDAD_BASE;

  document.getElementById('responsable').value = r[8];
  document.getElementById('status').value      = r[9];
  document.getElementById('origen').value      = r[10];

  document.getElementById('tipo_movimiento').value = '';
  document.getElementById('cantidad_mov').value = '';
  document.getElementById('cantidad_mov').style.display='none';
  document.getElementById('lblMovimiento').style.display='none';
  document.getElementById('btnEntrada').classList.remove('active');
  document.getElementById('btnSalida').classList.remove('active');
}

/* =====================================================
   MOVIMIENTO
===================================================== */
function setMovimiento(tipo){
  document.getElementById('tipo_movimiento').value = tipo;
  document.getElementById('btnEntrada').classList.toggle('active', tipo==='ENTRADA');
  document.getElementById('btnSalida').classList.toggle('active', tipo==='SALIDA');
  document.getElementById('lblMovimiento').style.display='block';
  document.getElementById('cantidad_mov').style.display='block';
  document.getElementById('cantidad_mov').focus();
}

/* =====================================================
   GUARDAR
===================================================== */
function guardar(){

  const tipo = document.getElementById('tipo_movimiento').value;
  const mov  = Number(document.getElementById('cantidad_mov').value || 0);

  if(!tipo) return alert('Seleccione ENTRADA o SALIDA');
  if(mov<=0) return alert('Cantidad inválida');

  let cantidadFinal = CANTIDAD_BASE;
  if(tipo==='ENTRADA') cantidadFinal += mov;
  if(tipo==='SALIDA')  cantidadFinal -= mov;
  if(cantidadFinal<0)  return alert('Stock insuficiente');

  fetch(URL_GS,{
    method:'POST',
    body:JSON.stringify({
      id:document.getElementById('id').value,
      cantidad:cantidadFinal
    })
  })
  .then(()=>{ cerrarModal(); cargar(); })
  .catch(()=>alert('Error al guardar'));
}

/* =====================================================
   ELIMINAR
===================================================== */
function eliminar(id){
  if(!confirm('¿Eliminar registro?')) return;
  fetch(URL_GS,{
    method:'POST',
    body:JSON.stringify({ eliminar:id })
  }).then(cargar);
}

/* =====================================================
   FILTRO
===================================================== */
function filtrar(txt){
  txt = txt.toLowerCase();
  renderTabla(DATA.filter(r=>r.join(' ').toLowerCase().includes(txt)));
}

/* =====================================================
   LIMPIAR
===================================================== */
function limpiarFormulario(){
  document.querySelectorAll('#modal input, #modal select')
    .forEach(i=>i.value='');
}

/* =====================================================
   SCANNER
===================================================== */
let scanner=null;

function abrirScanner(){
  if(!/android|iphone|ipad|mobile/i.test(navigator.userAgent))
    return alert('Scanner solo móvil');

  document.getElementById('scannerBox').style.display='block';
  scanner = new Html5Qrcode('scannerBox');
  scanner.start(
    { facingMode:{exact:'environment'} },
    { fps:10, qrbox:220 },
    txt=>{
      document.getElementById('codigo').value = txt.trim();
      cerrarScanner();
      buscarCodigo();
    }
  );
}

function cerrarScanner(){
  if(scanner){
    scanner.stop().then(()=>scanner.clear()).catch(()=>{});
    scanner=null;
  }
  document.getElementById('scannerBox').style.display='none';
}

/* =====================================================
   INIT
===================================================== */
document.addEventListener('DOMContentLoaded', cargar);
