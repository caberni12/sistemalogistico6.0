/* =====================================================
   CONFIGURACIÓN
===================================================== */
const URL_GS =
  'https://script.google.com/macros/s/AKfycbycGy55PJSg3wLg30zCy3gsUEXZTIVuPqFaCABTew4tlBOPS9Td3LgioVViB5RDFAcRqg/exec';

let DATA = [];
let ORIGEN = /android|iphone|ipad|mobile/i.test(navigator.userAgent)
  ? 'MOBILE'
  : 'WEB';

/* =====================================================
   UTILIDADES
===================================================== */
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
   CARGA ROBUSTA (🔥 CLAVE REAL)
===================================================== */
function cargar(){

  fetch(URL_GS)
    .then(r => r.text())   // 👈 NO json()
    .then(txt => {

      console.log('RESPUESTA RAW:', txt); // 👈 OBLIGATORIO

      let json;

      try{
        json = JSON.parse(txt);
      }catch(e){
        console.error('NO ES JSON VÁLIDO');
        DATA = [];
        renderTabla([]);
        return;
      }

      if(Array.isArray(json)){
        DATA = json;
      }else if(Array.isArray(json.data)){
        DATA = json.data;
      }else{
        console.error('FORMATO DESCONOCIDO', json);
        DATA = [];
      }

      renderTabla(DATA);
    })
    .catch(err=>{
      console.error('ERROR FETCH', err);
      DATA = [];
      renderTabla([]);
    });
}

/* =====================================================
   TABLA
===================================================== */
function renderTabla(arr){
  const t = document.getElementById('tabla');
  t.innerHTML = '';

  if(!arr.length){
    t.innerHTML = `<tr><td colspan="11">Sin datos</td></tr>`;
    return;
  }

  arr.forEach(r=>{
    t.innerHTML += `
      <tr>
        <td>${r[5] || ''}</td>
        <td>${r[6] || ''}</td>
        <td>${r[4] || ''}</td>
        <td>${r[7] || ''}</td>
        <td>${formatFecha(r[1])}</td>
        <td>${formatFecha(r[2])}</td>
        <td>${formatFecha(r[3])}</td>
        <td>${r[8] || ''}</td>
        <td>${r[9] || ''}</td>
        <td>${r[10] || ''}</td>
        <td>—</td>
      </tr>`;
  });
}

/* =====================================================
   INIT
===================================================== */
document.addEventListener('DOMContentLoaded', cargar);
