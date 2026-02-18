const URL_GS =
  'https://script.google.com/macros/s/AKfycbwP-NHZUqboSXDPq8HcWEl1qseurNEym8D0jv__DgZG1N0xkEmAQOSrKmLvXrxRZACv1g/exec';

let DATA = [];
let ORIGEN = /android|iphone|ipad|mobile/i.test(navigator.userAgent)
  ? 'MOBILE'
  : 'WEB';

let timerBuscar = null;

/* ================= PROGRESS ================= */
function startProgress(){
  const b=document.getElementById('progress-bar');
  if(b){ b.classList.add('active'); b.style.width='30%'; }
}
function endProgress(){
  const b=document.getElementById('progress-bar');
  if(b){
    b.style.width='100%';
    setTimeout(()=>{ b.classList.remove('active'); b.style.width='0%'; },300);
  }
}

/* ================= UTIL ================= */
function normalizarCodigo(v){ return String(v ?? '').trim(); }
function formatFecha(f){
  if(!f) return '';
  const d=new Date(f);
  return isNaN(d)?f:d.toLocaleString('es-CL');
}

/* ================= MODAL ================= */
function abrirModal(){
  limpiarFormulario();
  document.getElementById('origen').value=ORIGEN;
  document.getElementById('modal').classList.add('active');
}
function cerrarModal(){
  cerrarScanner();
  document.getElementById('modal').classList.remove('active');
}

/* ================= AUTOCOMPLETE ================= */
function buscarCodigo(){
  clearTimeout(timerBuscar);
  const cod=normalizarCodigo(codigo.value);
  if(!cod){ descripcion.value=''; return; }

  timerBuscar=setTimeout(()=>{
    fetch(`${URL_GS}?accion=buscar&codigo=${encodeURIComponent(cod)}`)
      .then(r=>r.json())
      .then(d=>{
        if(d.ok){
          descripcion.value=d.descripcion;
        }else descripcion.value='';
      });
  },300);
}

/* ================= CRUD ================= */
function guardar(){
  startProgress();
  fetch(URL_GS,{
    method:'POST',
    body:JSON.stringify({
      accion: id.value?'editar':'agregar',
      id:id.value,
      fecha_entrada:fecha_entrada.value,
      fecha_salida:fecha_salida.value,
      ubicacion:ubicacion.value,
      codigo:codigo.value,
      descripcion:descripcion.value,
      cantidad:Number(cantidad.value||0),
      responsable:responsable.value,
      status:status.value,
      origen:ORIGEN
    })
  }).then(()=>{
    endProgress();
    cerrarModal();
    cargar();
  });
}

function cargar(){
  startProgress();
  fetch(`${URL_GS}?accion=listar`)
    .then(r=>r.json())
    .then(d=>{
      DATA=d.data||[];
      renderTabla(DATA);
      endProgress();
    });
}

function renderTabla(arr){
  tabla.innerHTML='';
  arr.forEach(r=>{
    tabla.innerHTML+=`
      <tr>
        <td>${r[5]}</td><td>${r[6]}</td><td>${r[4]}</td><td>${r[7]}</td>
        <td>${formatFecha(r[1])}</td><td>${formatFecha(r[2])}</td>
        <td>${formatFecha(r[3])}</td><td>${r[8]}</td>
        <td>${r[9]}</td><td>${r[10]}</td>
        <td class="actions-td">
          <button class="edit" onclick='editar(${JSON.stringify(r)})'>✏️</button>
          <button class="del" onclick='eliminar("${r[0]}")'>🗑️</button>
        </td>
      </tr>`;
  });
}

function editar(r){
  abrirModal();
  id.value=r[0];
  fecha_entrada.value=r[2]?.slice(0,10)||'';
  fecha_salida.value=r[3]?.slice(0,10)||'';
  ubicacion.value=r[4];
  codigo.value=r[5];
  descripcion.value=r[6];
  cantidad.value=r[7];
  responsable.value=r[8];
  status.value=r[9];
  origen.value=r[10];
}

function eliminar(id){
  if(!confirm('¿Eliminar?'))return;
  fetch(URL_GS,{
    method:'POST',
    body:JSON.stringify({accion:'eliminar',id})
  }).then(cargar);
}

/* ================= INIT ================= */
document.addEventListener('DOMContentLoaded',cargar);
