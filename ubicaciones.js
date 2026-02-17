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
    day:'2-digit',month:'short',year:'numeric',
    hour:'2-digit',minute:'2-digit'
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
    desc.value = '';
    sug.style.display = 'none';
    return;
  }

  timerBuscar = setTimeout(()=>{
    fetch(`${URL_GS}?accion=buscar&codigo=${encodeURIComponent(cod)}`)
      .then(r=>r.json())
      .then(d=>{
        if(d.ok){
          desc.value = d.descripcion;
          sug.innerHTML = `
            <div onclick="selectProducto('${d.codigo}','${d.descripcion}')">
              ${d.codigo} – ${d.descripcion}
            </div>`;
          sug.style.display = 'block';
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
   LISTADO
===================================================== */
function cargar(){
  fetch(`${URL_GS}?accion=listar`)
    .then(r=>r.json())
    .then(d=>{
      DATA = d.data || [];
      renderTabla(DATA);
    })
    .catch(()=>renderTabla([]));
}

function renderTabla(arr){
  const t = document.getElementById('tabla');
  const c = document.getElementById('cards');

  t.innerHTML = '';
  c.innerHTML = '';

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

    c.innerHTML += `
      <div class="card-item">
        <div><b>Código:</b> ${r[5]}</div>
        <div><b>Descripción:</b> ${r[6]}</div>
        <div><b>Ubicación:</b> ${r[4]}</div>
        <div><b>Cantidad:</b> ${r[7]}</div>
        <div class="card-actions">
          <button class="edit" onclick='editar(${JSON.stringify(r)})'>Editar</button>
          <button class="del" onclick='eliminar("${r[0]}")'>Eliminar</button>
        </div>
      </div>`;
  });
}

/* =====================================================
   EDITAR / STOCK BASE
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
  document.getElementById('cantidad').value    = '';
  document.getElementById('responsable').value = r[8];
  document.getElementById('status').value      = r[9];
  document.getElementById('origen').value      = r[10];

  document.getElementById('tipo_movimiento').value = '';
  document.getElementById('btnEntrada').classList.remove('active');
  document.getElementById('btnSalida').classList.remove('active');
}

/* =====================================================
   TIPO DE MOVIMIENTO
===================================================== */
function setMovimiento(tipo){
  document.getElementById('tipo_movimiento').value = tipo;
  document.getElementById('btnEntrada').classList.toggle('active', tipo==='ENTRADA');
  document.getElementById('btnSalida').classList.toggle('active', tipo==='SALIDA');
}

/* =====================================================
   GUARDAR (CÁLCULO FRONTEND)
===================================================== */
function guardar(){

  const tipo  = document.getElementById('tipo_movimiento').value;
  const delta = Number(document.getElementById('cantidad').value || 0);

  if(!tipo) return alert('Seleccione ENTRADA o SALIDA');
  if(delta<=0) return alert('Cantidad inválida');

  let cantidadFinal = CANTIDAD_BASE;
  if(tipo==='ENTRADA') cantidadFinal += delta;
  if(tipo==='SALIDA')  cantidadFinal -= delta;
  if(cantidadFinal<0)  return alert('Stock insuficiente');

  const payload = {
    accion:'editar',
    id:document.getElementById('id').value,
    codigo:normalizarCodigo(document.getElementById('codigo').value),
    cantidad:cantidadFinal,
    responsable:document.getElementById('responsable').value,
    status:document.getElementById('status').value,
    origen:ORIGEN
  };

  fetch(URL_GS,{
    method:'POST',
    body:JSON.stringify(payload)
  })
  .then(()=>{ cerrarModal(); cargar(); })
  .catch(()=>alert('Error al guardar'));
}

/* =====================================================
   ELIMINAR
===================================================== */
function eliminar(id){
  if(!confirm('¿Eliminar este registro?')) return;
  fetch(URL_GS,{
    method:'POST',
    body:JSON.stringify({accion:'eliminar',id})
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
   LIMPIAR FORMULARIO
===================================================== */
function limpiarFormulario(){
  document.querySelectorAll('#modal input, #modal select')
    .forEach(i=>i.value='');
  const s = document.getElementById('suggest');
  if(s) s.style.display='none';
}

/* =====================================================
   SCANNER + LINTERNA
===================================================== */
let scanner=null, torchOn=false;

function abrirScanner(){
  if(!/android|iphone|ipad|mobile/i.test(navigator.userAgent))
    return alert('Scanner solo en móvil');

  document.getElementById('scannerBox').style.display='block';
  document.getElementById('torchBtn').style.display='block';

  scanner = new Html5Qrcode('scannerBox');
  scanner.start(
    {facingMode:{exact:'environment'}},
    {fps:10,qrbox:220},
    txt=>{
      document.getElementById('codigo').value = txt.trim();
      cerrarScanner();
      buscarCodigo();
    }
  );
}

function toggleTorch(){
  if(!scanner) return;
  torchOn=!torchOn;
  scanner.applyVideoConstraints({advanced:[{torch:torchOn}]});
  document.getElementById('torchBtn').classList.toggle('active',torchOn);
}

function cerrarScanner(){
  if(scanner){
    scanner.stop().then(()=>scanner.clear()).catch(()=>{});
    scanner=null;
  }
  document.getElementById('scannerBox').style.display='none';
  document.getElementById('torchBtn').style.display='none';
  torchOn=false;
}

/* =====================================================
   INIT
===================================================== */
document.addEventListener('DOMContentLoaded', cargar);
