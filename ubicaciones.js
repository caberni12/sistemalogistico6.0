/* =====================================================
   CONFIGURACIÓN
===================================================== */
const URL_GS =
  'https://script.google.com/macros/s/AKfycbwP-NHZUqboSXDPq8HcWEl1qseurNEym8D0jv__DgZG1N0xkEmAQOSrKmLvXrxRZACv1g/exec';

let DATA = [];
let ORIGEN = /android|iphone|ipad|mobile/i.test(navigator.userAgent)
  ? 'MOBILE'
  : 'WEB';

let timerBuscar = null;

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
    day:'2-digit',
    month:'short',
    year:'numeric',
    hour:'2-digit',
    minute:'2-digit'
  });
}

/* =====================================================
   PROGRESS BAR
===================================================== */
function startProgress(){
  const b = document.getElementById('progress-bar');
  if(!b) return;
  b.classList.add('active');
  b.style.width = '30%';
}

function endProgress(){
  const b = document.getElementById('progress-bar');
  if(!b) return;
  b.style.width = '100%';
  setTimeout(()=>{
    b.classList.remove('active');
    b.style.width = '0%';
  },300);
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
   AUTOCOMPLETE
===================================================== */
function buscarCodigo(){
  clearTimeout(timerBuscar);

  const cod = normalizarCodigo(codigo.value);
  const sug = document.getElementById('suggest');

  if(!cod){
    descripcion.value = '';
    sug.style.display = 'none';
    return;
  }

  timerBuscar = setTimeout(()=>{
    fetch(`${URL_GS}?accion=buscar&codigo=${encodeURIComponent(cod)}`)
      .then(r=>r.json())
      .then(d=>{
        if(d.ok){
          descripcion.value = d.descripcion;
          sug.innerHTML = `
            <div onclick="selectProducto('${d.codigo}','${d.descripcion}')">
              ${d.codigo} – ${d.descripcion}
            </div>`;
          sug.style.display = 'block';
        }else{
          descripcion.value='';
          sug.style.display='none';
        }
      })
      .catch(()=>{
        descripcion.value='';
        sug.style.display='none';
      });
  },300);
}

function selectProducto(c,d){
  codigo.value = c;
  descripcion.value = d;
  suggest.style.display = 'none';
}

/* =====================================================
   LISTAR / TABLA
===================================================== */
function cargar(){
  startProgress();

  fetch(`${URL_GS}?accion=listar`)
    .then(r=>r.json())
    .then(d=>{
      DATA = d.data || [];
      renderTabla(DATA);
      endProgress();
    })
    .catch(()=>{
      DATA=[];
      renderTabla([]);
      endProgress();
    });
}

function renderTabla(arr){
  tabla.innerHTML = '';
  cards.innerHTML = '';

  arr.forEach(r=>{
    tabla.innerHTML += `
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

    cards.innerHTML += `
      <div class="card-item">
        <div class="card-row"><b>Código</b><span>${r[5]}</span></div>
        <div class="card-row"><b>Descripción</b><span>${r[6]}</span></div>
        <div class="card-row"><b>Ubicación</b><span>${r[4]}</span></div>
        <div class="card-row"><b>Cantidad</b><span>${r[7]}</span></div>
      </div>`;
  });
}

/* =====================================================
   EDITAR / ELIMINAR
===================================================== */
function editar(r){
  abrirModal();

  id.value = r[0];
  fecha_entrada.value = r[2] ? r[2].slice(0,10) : '';
  fecha_salida.value  = r[3] ? r[3].slice(0,10) : '';
  ubicacion.value = r[4];
  codigo.value = r[5];
  descripcion.value = r[6];
  cantidad.value = r[7];
  responsable.value = r[8];
  status.value = r[9];
  origen.value = r[10];
}

function eliminar(id){
  if(!confirm('¿Eliminar este movimiento?')) return;

  startProgress();

  fetch(URL_GS,{
    method:'POST',
    body:JSON.stringify({accion:'eliminar',id})
  })
  .then(()=>cargar())
  .catch(()=>alert('Error al eliminar'));
}

/* =====================================================
   GUARDAR
===================================================== */
function guardar(){
  startProgress();

  fetch(URL_GS,{
    method:'POST',
    body:JSON.stringify({
      accion: id.value ? 'editar' : 'agregar',
      id: id.value,
      fecha_entrada: fecha_entrada.value,
      fecha_salida: fecha_salida.value,
      ubicacion: ubicacion.value,
      codigo: codigo.value,
      descripcion: descripcion.value,
      cantidad: Number(cantidad.value || 0),
      responsable: responsable.value,
      status: status.value,
      origen: ORIGEN
    })
  })
  .then(()=>{
    cerrarModal();
    cargar();
    endProgress();
  })
  .catch(()=>{
    endProgress();
    alert('Error al guardar');
  });
}

/* =====================================================
   FILTRO
===================================================== */
function filtrar(txt){
  txt = txt.toLowerCase();
  renderTabla(DATA.filter(r =>
    r.join(' ').toLowerCase().includes(txt)
  ));
}

/* =====================================================
   LIMPIAR
===================================================== */
function limpiarFormulario(){
  document.querySelectorAll('#modal input, #modal select')
    .forEach(i=>i.value='');
  const s=document.getElementById('suggest');
  if(s) s.style.display='none';
}

/* =====================================================
   SCANNER + LINTERNA
===================================================== */
let scanner=null;
let torchOn=false;

function abrirScanner(){
  if(!/android|iphone|ipad|mobile/i.test(navigator.userAgent)){
    alert('Scanner solo disponible en móvil');
    return;
  }

  scannerBox.style.display='block';
  torchBtn.style.display='block';

  scanner=new Html5Qrcode('scannerBox');
  scanner.start(
    {facingMode:{exact:'environment'}},
    {fps:10,qrbox:220},
    txt=>{
      codigo.value=txt.trim();
      cerrarScanner();
      buscarCodigo();
    }
  );
}

function toggleTorch(){
  if(!scanner) return;
  torchOn=!torchOn;
  scanner.applyVideoConstraints({advanced:[{torch:torchOn}]});
  torchBtn.classList.toggle('active',torchOn);
}

function cerrarScanner(){
  if(scanner){
    scanner.stop().then(()=>scanner.clear()).catch(()=>{});
    scanner=null;
  }
  scannerBox.style.display='none';
  torchBtn.style.display='none';
  torchOn=false;
}

/* =====================================================
   INIT
===================================================== */
document.addEventListener('DOMContentLoaded', cargar);
