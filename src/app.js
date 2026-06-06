const Express = require('express');
const App = Express();
const ModelosTypescriptRuta = require("./Rutas/ModelosTypescriptRuta");
const SubirImagenRuta = require("./Rutas/SubirImagenRuta");
const PermisosTablasDisponibles = require("./Rutas/PermisosTablasDisponiblesRuta");
const InformacionBd_Ruta = require("./Rutas/InformacionBd_Ruta");

const EmpresaRuta = require('./Rutas/EmpresaRuta');
const UsuarioRuta = require("./Rutas/UsuarioRuta");
const RolRuta = require("./Rutas/RolRuta");
const PermisoRuta = require("./Rutas/PermisoRuta");
const PermisoRolRecursoRuta = require("./Rutas/PermisoRolRecursoRuta");
const RecursoRuta = require("./Rutas/RecursoRuta");
const PagoRuta = require("./Rutas/PagoRuta");
const ResumenGeneralPago = require("./Rutas/EstadoTecnicoEmpresaRuta");
const Login = require("./Rutas/LoginRuta");
const System_Backup_Ruta = require("./Rutas/System_Backup_Ruta");
//GENERAL
const ClienteRuta = require("./Rutas/ClienteRuta");
const HistorialPedidoRuta = require("./Rutas/HistorialPedidoRuta");
const InventarioRuta = require("./Rutas/InventarioRuta");
const VentaRuta = require("./Rutas/VentaRuta");
const ConfiguracionRuta = require("./Rutas/ConfiguracionRuta");
const ReporteRuta = require("./Rutas/ReporteRuta");
const AnexoEmpresaOficialRuta = require("./Rutas/AnexoEmpresaOficialRuta");
const GestionSuperAdminRuta = require("./Rutas/GestionSuperAdmin-Ruta");

const Ruter = 'api';


const CuerpoJson = require('./FuncionIntermedia/CuerpoJson');
const CuerpoUrlCodificado = require('./FuncionIntermedia/CuerpoUrlCodificado');
const { ConfiguracionCors } = require('./FuncionIntermedia/Cors');

App.use(Express.text({ type: 'text/plain' }));
App.use(ConfiguracionCors());
App.use(CuerpoJson);
App.use(CuerpoUrlCodificado);

App.use(`/${Ruter}`, PermisosTablasDisponibles);
App.use(`/${Ruter}`, InformacionBd_Ruta);
App.use(`/${Ruter}`, ModelosTypescriptRuta);
App.use(`/${Ruter}`, SubirImagenRuta);
App.use(`/${Ruter}`, Login);
App.use(`/${Ruter}`, EmpresaRuta);
App.use(`/${Ruter}`, UsuarioRuta);
App.use(`/${Ruter}`, RolRuta);
App.use(`/${Ruter}`, PermisoRuta);
App.use(`/${Ruter}`, PermisoRolRecursoRuta);
App.use(`/${Ruter}`, RecursoRuta);
App.use(`/${Ruter}`, PagoRuta);
App.use(`/${Ruter}`, ResumenGeneralPago);
App.use(`/${Ruter}`, System_Backup_Ruta);

//GENERAL
App.use(`/${Ruter}`, ClienteRuta);
App.use(`/${Ruter}`, HistorialPedidoRuta);
App.use(`/${Ruter}`, InventarioRuta);
App.use(`/${Ruter}`, VentaRuta);
App.use(`/${Ruter}`, ConfiguracionRuta);
App.use(`/${Ruter}`, ReporteRuta);
App.use(`/${Ruter}`, AnexoEmpresaOficialRuta);
App.use(`/${Ruter}`, GestionSuperAdminRuta);

module.exports = App;