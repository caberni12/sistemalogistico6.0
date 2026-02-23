const API =
"https://script.google.com/macros/s/AKfycbwb_QOTIe9u1-LDSP1psBGeGkJ8gtC-n-e9H7E-rhf0gd2jU29sw-xHhXXp65OwQB_U/exec";

let USUARIOS = [];
let MODO = "crear";

document.addEventListener("DOMContentLoaded", cargarUsuarios);

async function cargarUsuarios(){
  const r = await fetch(API+"?action=listarUsuarios");
  const d = await r.json();
  USUARIOS = d.data || [];
  renderUsuarios(USUARIOS);
}

function renderUsuarios(data){
  tablaUsuarios.innerHTML = "";
  mobileList.innerHTML = "";

  if(!data.length){
    tablaUsuarios.innerHTML =
      `<tr><td colspan="6">Sin usuarios</td></tr>`;
    return;
  }

  data.forEach(u=>{
    tablaUsuarios.innerHTML += `
      <tr>
        <td>${u[1]}</td>
        <td>${u[2]}</td>
        <td>${u[3]}</td>
        <td>${u[4]}</td>
        <td>${u[5]}</td>
        <td>
          <button class="btn-edit"
            onclick="editarUsuario('${u[1]}','${u[2]}','${u[3]}','${u[4]}','${u[5]}','${u[6]||""}')">Editar</button>
          <button class="btn-danger"
            onclick="eliminarUsuario('${u[1]}')">Eliminar</button>
        </td>
      </tr>`;
  });
}

async function guardarUsuario(){
  const fd = new FormData();
  fd.append("action",MODO==="crear"?"crearUsuario":"editarUsuario");
  fd.append("username",u_user.value);
  fd.append("password",u_pass.value);
  fd.append("nombre",u_nombre.value);
  fd.append("rol",u_rol.value);
  fd.append("activo",u_activo.value);
  fd.append("permisos",[...document.querySelectorAll(".permissions input:checked")].map(c=>c.value).join(","));

  await fetch(API,{method:"POST",body:fd});
  cerrarUsuario();
  cargarUsuarios();
}

async function eliminarUsuario(u){
  if(!confirm("Eliminar "+u+"?"))return;
  const fd=new FormData();
  fd.append("action","eliminarUsuario");
  fd.append("username",u);
  await fetch(API,{method:"POST",body:fd});
  cargarUsuarios();
}