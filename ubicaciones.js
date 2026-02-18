/* =====================================================
   CONFIGURACIÓN GENERAL
===================================================== */
const URL_GS =
  'https://script.google.com/macros/s/AKfycbz-_cZbe36eaQyopjw1HURuE4Zwbvuo4Lewsn0S393ocCLiQRbdouSUwpiAFOSwVzXwyA/exec';

const ES_MOBILE = /android|iphone|ipad|mobile/i.test(navigator.userAgent);
const ORIGEN = ES_MOBILE ? 'MOBILE' : 'WEB';

let DATA = [];
let DATA_FILTRADA = [];
let TIPO_MOV = null;
let timerBuscar = null;

/* =====================================================
   HELPERS
===================================================== */
const $ = id => document.getElementById(id);
const fechaTabla = f => f ? new Date(f).toLocaleString('es-CL') : '';
const fechaInput = f => f ? new Date(f).toISOString().slice(0,10) : '';

/* =====================================================
   MODAL
===================================================== */
function abrirModal(){
  limpiarFormulario();
  $('origen').value = ORIGEN;
  $('modal').classList.add('active');

  setTimeout(()=>{
    $('codigo')?.focus();
  },300);
}

function cerrarModal(){
  cerrarScanner();
  $('modal').classList.remove('active');
}

/* =====================================================
   TIPO MOVIMIENTO
===================================================== */
function setMovimiento(tipo){
  TIPO_MOV = tipo;
  $('btnEntrada')?.classList.toggle('active', tipo==='ENTRADA');
  $('btnSalida')?.classList.toggle('active', tipo==='SALIDA');
}

/* =====================================================
   AUTOCOMPLETE POR CÓDIGO
===================================================== */
function buscarCodigo(){
  clearTimeout(timerBuscar);

  const cod = $('codigo').value.trim();
  const sug = $('suggest');

  if(!cod){
    $('descripcion').value='';
    $('cantidad').value='';
    sug && (sug.style.display='none');
    return;
  }

  timerBuscar = setTimeout(()=>{
    fetch(`${URL_GS}?accion=buscar&codigo=${encodeURIComponent(cod)}`)
      .then(r=>r.json())
      .then(d=>{
        if(d.ok){
          $('descripcion').value = d.descripcion;
          $('cantidad').value = Number(d.cantidad||0);
          if(sug){
            sug.innerHTML = `<div>${d.codigo} – ${d.descripcion}</div>`;
            sug.style.display = 'block';
          }
        }else{
          sug && (sug.style.display='none');
        }
      })
      .catch(()=> sug && (sug.style.display='none'));
  },300);
}

/* =====================================================
   CARGAR / TABLA
===================================================== */
function cargar(){
  fetch(`${URL_GS}?accion=listar`)
    .then(r=>r.json())
    .then(d=>{
      DATA = d.data || [];
      DATA_FILTRADA = DATA;
      renderTabla(DATA);
    })
    .catch(()=>{
      DATA = [];
      renderTabla([]);
    });
}

function renderTabla(arr){
  $('tabla').innerHTML = '';

  arr.forEach(r=>{
    $('tabla').innerHTML += `
      <tr>
        <td>${r[5]}</td>
        <td>${r[6]}</td>
        <td>${r[4]}</td>
        <td>${r[7]}</td>
        <td>${fechaTabla(r[1])}</td>
        <td>
          <button onclick='editar(${JSON.stringify(r)})'>✏️</button>
          <button onclick='eliminar("${r[0]}")'>🗑️</button>
        </td>
      </tr>`;
  });
}

/* =====================================================
   EDITAR / ELIMINAR
===================================================== */
function editar(r){
  abrirModal();
  $('id').value = r[0];
  $('fecha_entrada').value = fechaInput(r[2]);
  $('fecha_salida').value  = fechaInput(r[3]);
  $('ubicacion').value = r[4];
  $('codigo').value = r[5];
  $('descripcion').value = r[6];
  $('cantidad').value = r[7];
  $('responsable').value = r[8];
  $('status').value = r[9];
}

function eliminar(id){
  if(!confirm('¿Eliminar registro?')) return;

  fetch(URL_GS,{
    method:'POST',
    body:JSON.stringify({accion:'eliminar',id})
  })
  .then(()=> cargar())
  .catch(()=> alert('Error al eliminar'));
}

/* =====================================================
   GUARDAR (ENTRADA / SALIDA)
===================================================== */
function guardar(){
  const stock = Number($('cantidad').value||0);
  const mov   = Number($('cantidad_mov').value||0);

  if(!TIPO_MOV){
    alert('Seleccione ENTRADA o SALIDA');
    return;
  }

  if(mov<=0){
    alert('Cantidad inválida');
    return;
  }

  let nuevoStock = stock;

  if(TIPO_MOV==='SALIDA'){
    if(mov>stock){
      alert(`Stock insuficiente (${stock})`);
      return;
    }
    nuevoStock = stock - mov;
  }

  if(TIPO_MOV==='ENTRADA'){
    nuevoStock = stock + mov;
  }

  fetch(URL_GS,{
    method:'POST',
    body:JSON.stringify({
      accion: $('id').value ? 'editar' : 'agregar',
      id: $('id').value,
      fecha_entrada: $('fecha_entrada').value,
      fecha_salida: $('fecha_salida').value,
      ubicacion: $('ubicacion').value,
      codigo: $('codigo').value,
      descripcion: $('descripcion').value,
      cantidad: nuevoStock,
      responsable: $('responsable').value,
      status: $('status').value,
      origen: ORIGEN
    })
  })
  .then(r=>r.json())
  .then(res=>{
    if(res.ok===false){
      alert(res.msg||'Error');
      return;
    }
    cerrarModal();
    cargar();
  })
  .catch(()=> alert('Error al guardar'));
}

/* =====================================================
   FILTRO
===================================================== */
function filtrar(txt){
  txt = txt.toLowerCase();
  DATA_FILTRADA = DATA.filter(r=>r.join(' ').toLowerCase().includes(txt));
  renderTabla(DATA_FILTRADA);
}

/* =====================================================
   LIMPIAR FORM
===================================================== */
function limpiarFormulario(){
  document.querySelectorAll('#modal input, #modal select')
    .forEach(i=>i.value='');
  TIPO_MOV = null;
}

/* =====================================================
   SCANNER QR (SOLO MÓVIL)
===================================================== */
let scanner = null;

function abrirScanner(){
  if(!ES_MOBILE){
    alert('Scanner solo en móvil');
    return;
  }

  $('scannerBox').style.display='block';
  scanner = new Html5Qrcode('scannerBox');

  scanner.start(
    {facingMode:'environment'},
    {fps:10,qrbox:220},
    txt=>{
      $('codigo').value = txt.trim();
      cerrarScanner();
      buscarCodigo();
      setTimeout(()=> $('cantidad_mov')?.focus(),300);
    }
  );
}

function cerrarScanner(){
  if(scanner){
    scanner.stop().catch(()=>{});
    scanner = null;
  }
  $('scannerBox').style.display='none';
}

/* =====================================================
   INIT
===================================================== */
document.addEventListener('DOMContentLoaded',()=>{
  cargar();

  if(ES_MOBILE){
    $('btnScanner')?.addEventListener('pointerdown', abrirScanner);
  }
});
