/* =====================================================
   CONFIGURACIÓN
===================================================== */
const URL_GS =
  'https://script.google.com/macros/s/AKfycbz-_cZbe36eaQyopjw1HURuE4Zwbvuo4Lewsn0S393ocCLiQRbdouSUwpiAFOSwVzXwyA/exec';

let DATA = [];
let DATA_FILTRADA = [];

const ES_MOBILE = /android|iphone|ipad|mobile/i.test(navigator.userAgent);
let ORIGEN = ES_MOBILE ? 'MOBILE' : 'WEB';

let timerBuscar = null;
let TIPO_MOV = null;

/* =====================================================
   UTILIDADES
===================================================== */
function $(id){ return document.getElementById(id); }

function normalizarCodigo(v){
  return String(v ?? '').trim();
}

/* ===== FECHA PARA TABLA ===== */
function formatFechaTabla(f){
  if(!f) return '';
  const d = new Date(f);
  if(isNaN(d)) return f;
  const dd = String(d.getDate()).padStart(2,'0');
  const mm = String(d.getMonth()+1).padStart(2,'0');
  const yy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2,'0');
  const mi = String(d.getMinutes()).padStart(2,'0');
  return `${dd}-${mm}-${yy} ${hh}:${mi}`;
}

/* ===== FECHA PARA INPUT DATE ===== */
function formatFechaInput(f){
  if(!f) return '';
  const d = new Date(f);
  if(isNaN(d)) return '';
  const dd = String(d.getDate()).padStart(2,'0');
  const mm = String(d.getMonth()+1).padStart(2,'0');
  const yy = d.getFullYear();
  return `${yy}-${mm}-${dd}`;
}

/* =====================================================
   LOADER BOTONES
===================================================== */
function startBtnLoader(btn){
  if(!btn) return;
  btn.disabled = true;
  btn.dataset.txt = btn.innerHTML;
  btn.classList.add('loading');
  btn.innerHTML = '<span class="btn-loader"></span>';
}

function endBtnLoader(btn){
  if(!btn) return;
  btn.disabled = false;
  btn.classList.remove('loading');
  btn.innerHTML = btn.dataset.txt || 'Guardar';
}

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
  $('btnEntrada').classList.remove('active');
  $('btnSalida').classList.remove('active');
  $(tipo === 'ENTRADA' ? 'btnEntrada' : 'btnSalida').classList.add('active');
}

/* =====================================================
   AUTOCOMPLETE (MAESTRA)
===================================================== */
function buscarCodigo(){
  clearTimeout(timerBuscar);

  const cod = normalizarCodigo($('codigo').value);
  const sug = $('suggest');

  if(!cod){
    $('descripcion').value = '';
    $('cantidad').value = '';
    sug && (sug.style.display = 'none');
    return;
  }

  timerBuscar = setTimeout(()=>{
    fetch(`${URL_GS}?accion=buscar&codigo=${encodeURIComponent(cod)}`)
      .then(r=>r.json())
      .then(d=>{
        if(d.ok){
          $('descripcion').value = d.descripcion;
          $('cantidad').value = Number(d.cantidad || 0);
          if(sug){
            sug.innerHTML = `
              <div>
                ${d.codigo} – ${d.descripcion}
              </div>`;
            sug.style.display = 'block';
          }
        }else{
          $('descripcion').value='';
          $('cantidad').value='';
          sug && (sug.style.display='none');
        }
      })
      .catch(()=>{
        $('descripcion').value='';
        $('cantidad').value='';
        sug && (sug.style.display='none');
      });
  },300);
}

/* =====================================================
   LISTAR / TABLA
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
      DATA_FILTRADA = [];
      renderTabla([]);
    });
}

function renderTabla(arr){
  $('tabla').innerHTML = '';
  $('cards') && ($('cards').innerHTML = '');

  arr.forEach(r=>{
    $('tabla').innerHTML += `
      <tr>
        <td>${r[5]}</td>
        <td>${r[6]}</td>
        <td>${r[4]}</td>
        <td>${r[7]}</td>
        <td>${formatFechaTabla(r[1])}</td>
        <td>${formatFechaTabla(r[2])}</td>
        <td>${formatFechaTabla(r[3])}</td>
        <td>${r[8]}</td>
        <td>${r[9]}</td>
        <td>${r[10]}</td>
        <td>
          <button onclick='editar(${JSON.stringify(r)})'>✏️</button>
          <button onclick='eliminar("${r[0]}",this)'>🗑️</button>
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
  $('fecha_entrada').value = formatFechaInput(r[2]);
  $('fecha_salida').value  = formatFechaInput(r[3]);
  $('ubicacion').value = r[4];
  $('codigo').value = r[5];
  $('descripcion').value = r[6];
  $('cantidad').value = Number(r[7] || 0);
  $('cantidad_mov').value = '';
  $('responsable').value = r[8];
  $('status').value = r[9];
  $('origen').value = r[10];
}

function eliminar(idFila, btn){
  if(!confirm('¿Eliminar este movimiento?')) return;
  startBtnLoader(btn);

  fetch(URL_GS,{
    method:'POST',
    body:JSON.stringify({accion:'eliminar',id:idFila})
  })
  .then(()=>{ endBtnLoader(btn); cargar(); })
  .catch(()=>{ endBtnLoader(btn); alert('Error al eliminar'); });
}

/* =====================================================
   GUARDAR (ENTRADA / SALIDA)
===================================================== */
function guardar(){
  const btn = $('btnGuardar');

  const stockActual = Number($('cantidad').value || 0);
  const mov = Number($('cantidad_mov').value || 0);

  if(!TIPO_MOV){
    alert('Seleccione ENTRADA o SALIDA');
    return;
  }

  if(mov <= 0){
    alert('Ingrese una cantidad válida');
    return;
  }

  let nuevoStock = stockActual;

  if(TIPO_MOV === 'SALIDA'){
    if(mov > stockActual){
      alert(`Stock insuficiente\nStock actual: ${stockActual}\nIntento retirar: ${mov}`);
      return;
    }
    nuevoStock = stockActual - mov;
  }

  if(TIPO_MOV === 'ENTRADA'){
    nuevoStock = stockActual + mov;
  }

  startBtnLoader(btn);

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
    endBtnLoader(btn);
    if(res.ok === false){
      alert(res.msg || 'Error');
      return;
    }
    cerrarModal();
    cargar();
  })
  .catch(()=>{
    endBtnLoader(btn);
    alert('Error al guardar');
  });
}

/* =====================================================
   FILTRO
===================================================== */
function filtrar(txt){
  txt = txt.toLowerCase();
  DATA_FILTRADA = DATA.filter(r => r.join(' ').toLowerCase().includes(txt));
  renderTabla(DATA_FILTRADA);
}

/* =====================================================
   LIMPIAR
===================================================== */
function limpiarFormulario(){
  document.querySelectorAll('#modal input, #modal select').forEach(i=>i.value='');
  TIPO_MOV = null;
  $('suggest') && ($('suggest').style.display='none');
}

/* =====================================================
   SCANNER + LINTERNA (FIX MÓVIL)
===================================================== */
let scanner = null;
let torchOn = false;

function abrirScanner(){
  if(!ES_MOBILE){
    alert('Scanner solo disponible en móvil');
    return;
  }

  $('scannerBox').style.display='block';
  $('torchBtn') && ($('torchBtn').style.display='block');

  scanner = new Html5Qrcode('scannerBox');
  scanner.start(
    {facingMode:{exact:'environment'}},
    {fps:10,qrbox:220},
    txt=>{
      $('codigo').value = txt.trim();
      cerrarScanner();
      buscarCodigo();
      setTimeout(()=> $('cantidad_mov')?.focus(),300);
    }
  );
}

function toggleTorch(){
  if(!scanner) return;
  torchOn = !torchOn;
  scanner.applyVideoConstraints({advanced:[{torch:torchOn}]});
  $('torchBtn')?.classList.toggle('active',torchOn);
}

function cerrarScanner(){
  if(scanner){
    scanner.stop().catch(()=>{}).finally(()=>{
      scanner.clear();
      scanner = null;
    });
  }
  $('scannerBox').style.display='none';
  $('torchBtn') && ($('torchBtn').style.display='none');
  torchOn = false;
}

/* =====================================================
   INIT (ACTIVACIÓN MÓVIL)
===================================================== */
document.addEventListener('DOMContentLoaded', ()=>{
  cargar();

  if(ES_MOBILE){
    const btnScanner = $('btnScanner');
    if(btnScanner){
      btnScanner.addEventListener('pointerdown', e=>{
        e.preventDefault();
        abrirScanner();
      });
    }
  }
});
