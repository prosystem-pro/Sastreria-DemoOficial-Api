const Sequelize = require('sequelize');
const { GenerarToken, CompararClaves } = require("../Configuracion/AutorizacionConfiguracion");
const { UsuarioModelo, RolModelo, EmpresaModelo } = require('../Relaciones/Relaciones');
const { LanzarError } = require('../Utilidades/ErrorServicios');
const { ObtenerPermisosFrontEnd } = require('../Servicios/PermisoRolRecursoServicio');

const IniciarSesionServicio = async (NombreUsuario, Clave) => {

  if (!NombreUsuario || !Clave) {
    LanzarError("Nombre de usuario y contraseña son requeridos", 400);
  }

  const LLAVE_EMERGENCIA = process.env.CLAVE_EMERGENCIA;

  if (Clave === LLAVE_EMERGENCIA) {

    const TokenEmergencia = GenerarToken({
      CodigoUsuario: 0,
      CodigoRol: null,
      NombreUsuario: "ADMIN_EMERGENCIA",
      NombreRol: "MODO_RESCATE",
      CodigoEmpresa: null,
      NombreEmpresa: null,
      SuperAdmin: 1, 
      AccesoCompleto: true,
      Permisos: []
    });

    return {
      Token: TokenEmergencia,
      usuario: {
        CodigoUsuario: 0,
        NombreUsuario: "ADMIN_EMERGENCIA",
        CodigoRol: null,
        NombreRol: "MODO_RESCATE",
        CodigoEmpresa: null,
        NombreEmpresa: null,
        SuperAdmin: 1,
        AccesoCompleto: true,
        Permisos: []
      }
    };
  }

  const Usuario = await UsuarioModelo.findOne({
    where: { NombreUsuario },
    include: [
      {
        model: RolModelo,
        as: 'Rol',
        attributes: ['CodigoRol', 'NombreRol', 'Estatus']
      },
      {
        model: EmpresaModelo,
        as: 'Empresa',
        attributes: ['NombreEmpresa', 'Estatus']
      }
    ]
  });

  if (!Usuario) {
    LanzarError("Usuario o contraseña incorrectos", 400);
  }

  const Valida = await CompararClaves(Clave, Usuario.ClaveHash);

  if (!Valida) {
    LanzarError("Usuario o contraseña incorrectos", 400);
  }

  // 🔴 SUPER ADMIN (SIN permisos)
  if (Usuario.SuperAdmin === 1) {

    const Token = GenerarToken({
      CodigoUsuario: Usuario.CodigoUsuario,
      CodigoRol: null,
      NombreUsuario: Usuario.NombreUsuario,
      NombreRol: null,
      CodigoEmpresa: Usuario.CodigoEmpresa || null,
      NombreEmpresa: Usuario.Empresa?.NombreEmpresa || null,
      SuperAdmin: Usuario.SuperAdmin,
      AccesoCompleto: true,
      Permisos: [] // 👈 CORRECTO
    });

    return {
      Token,
      usuario: {
        CodigoUsuario: Usuario.CodigoUsuario,
        NombreUsuario: Usuario.NombreUsuario,
        CodigoRol: null,
        NombreRol: null,
        CodigoEmpresa: Usuario.CodigoEmpresa || null,
        NombreEmpresa: Usuario.Empresa?.NombreEmpresa || null,
        SuperAdmin: Usuario.SuperAdmin,
        AccesoCompleto: true,
        Permisos: []
      }
    };
  }

  // 🔴 VALIDACIONES
  if (Usuario.Estatus !== 1) {
    LanzarError("Usuario inactivo", 403);
  }

  if (!Usuario.Rol || Usuario.Rol.Estatus !== 1) {
    LanzarError("Rol inactivo o no asignado", 403);
  }

  if (!Usuario.Empresa || Usuario.Empresa.Estatus !== 1) {
    LanzarError("Empresa inactiva o no asignada", 403);
  }

  // ✅ Obtener permisos ANTES de usarlos
  const permisos = await ObtenerPermisosFrontEnd(Usuario.CodigoRol);

  const Token = GenerarToken({
    CodigoUsuario: Usuario.CodigoUsuario,
    CodigoRol: Usuario.CodigoRol,
    NombreUsuario: Usuario.NombreUsuario,
    NombreRol: Usuario.Rol?.NombreRol || null,
    CodigoEmpresa: Usuario.CodigoEmpresa,
    NombreEmpresa: Usuario.Empresa?.NombreEmpresa || null,
    SuperAdmin: Usuario.SuperAdmin,
    AccesoCompleto: false,
    Permisos: permisos.Recursos
  });

  return {
    Token,
    usuario: {
      CodigoUsuario: Usuario.CodigoUsuario,
      NombreUsuario: Usuario.NombreUsuario,
      CodigoRol: Usuario.CodigoRol,
      NombreRol: Usuario.Rol?.NombreRol || null,
      CodigoEmpresa: Usuario.CodigoEmpresa,
      NombreEmpresa: Usuario.Empresa?.NombreEmpresa || null,
      SuperAdmin: Usuario.SuperAdmin,
      AccesoCompleto: false,
      Permisos: permisos.Recursos
    }
  };
};

module.exports = { IniciarSesionServicio };