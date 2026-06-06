var DataTypes = require("sequelize").DataTypes;
var _Abertura = require("./Abertura");
var _Boton = require("./Boton");
var _Categoria = require("./Categoria");
var _Cliente = require("./Cliente");
var _Color = require("./Color");
var _Empresa = require("./Empresa");
var _EstadoPedido = require("./EstadoPedido");
var _Estilo = require("./Estilo");
var _FormaPago = require("./FormaPago");
var _Inventario = require("./Inventario");
var _Marca = require("./Marca");
var _MovimientoInventario = require("./MovimientoInventario");
var _Pago = require("./Pago");
var _PagoAplicacion = require("./PagoAplicacion");
var _Pagos = require("./Pagos");
var _Pedido = require("./Pedido");
var _PedidoDetalle = require("./PedidoDetalle");
var _PedidoDetalleMedida = require("./PedidoDetalleMedida");
var _Permiso = require("./Permiso");
var _PermisoRolRecurso = require("./PermisoRolRecurso");
var _Producto = require("./Producto");
var _Recurso = require("./Recurso");
var _Rol = require("./Rol");
var _Talla = require("./Talla");
var _Tamano = require("./Tamano");
var _Tela = require("./Tela");
var _TipoCorte = require("./TipoCorte");
var _TipoCuello = require("./TipoCuello");
var _TipoEmpresa = require("./TipoEmpresa");
var _TipoMedida = require("./TipoMedida");
var _TipoProducto = require("./TipoProducto");
var _TipoSolapa = require("./TipoSolapa");
var _TipoTela = require("./TipoTela");
var _Usuario = require("./Usuario");

function initModels(sequelize) {
  var Abertura = _Abertura(sequelize, DataTypes);
  var Boton = _Boton(sequelize, DataTypes);
  var Categoria = _Categoria(sequelize, DataTypes);
  var Cliente = _Cliente(sequelize, DataTypes);
  var Color = _Color(sequelize, DataTypes);
  var Empresa = _Empresa(sequelize, DataTypes);
  var EstadoPedido = _EstadoPedido(sequelize, DataTypes);
  var Estilo = _Estilo(sequelize, DataTypes);
  var FormaPago = _FormaPago(sequelize, DataTypes);
  var Inventario = _Inventario(sequelize, DataTypes);
  var Marca = _Marca(sequelize, DataTypes);
  var MovimientoInventario = _MovimientoInventario(sequelize, DataTypes);
  var Pago = _Pago(sequelize, DataTypes);
  var PagoAplicacion = _PagoAplicacion(sequelize, DataTypes);
  var Pagos = _Pagos(sequelize, DataTypes);
  var Pedido = _Pedido(sequelize, DataTypes);
  var PedidoDetalle = _PedidoDetalle(sequelize, DataTypes);
  var PedidoDetalleMedida = _PedidoDetalleMedida(sequelize, DataTypes);
  var Permiso = _Permiso(sequelize, DataTypes);
  var PermisoRolRecurso = _PermisoRolRecurso(sequelize, DataTypes);
  var Producto = _Producto(sequelize, DataTypes);
  var Recurso = _Recurso(sequelize, DataTypes);
  var Rol = _Rol(sequelize, DataTypes);
  var Talla = _Talla(sequelize, DataTypes);
  var Tamano = _Tamano(sequelize, DataTypes);
  var Tela = _Tela(sequelize, DataTypes);
  var TipoCorte = _TipoCorte(sequelize, DataTypes);
  var TipoCuello = _TipoCuello(sequelize, DataTypes);
  var TipoEmpresa = _TipoEmpresa(sequelize, DataTypes);
  var TipoMedida = _TipoMedida(sequelize, DataTypes);
  var TipoProducto = _TipoProducto(sequelize, DataTypes);
  var TipoSolapa = _TipoSolapa(sequelize, DataTypes);
  var TipoTela = _TipoTela(sequelize, DataTypes);
  var Usuario = _Usuario(sequelize, DataTypes);

  Pagos.belongsTo(Empresa, { as: "CodigoEmpresa_Empresa", foreignKey: "CodigoEmpresa"});
  Empresa.hasMany(Pagos, { as: "Pagos", foreignKey: "CodigoEmpresa"});
  Usuario.belongsTo(Empresa, { as: "CodigoEmpresa_Empresa", foreignKey: "CodigoEmpresa"});
  Empresa.hasMany(Usuario, { as: "Usuarios", foreignKey: "CodigoEmpresa"});
  Cliente.belongsTo(Empresa, { as: "CodigoEmpresa_Empresa", foreignKey: "CodigoEmpresa"});
  Empresa.hasMany(Cliente, { as: "Clientes", foreignKey: "CodigoEmpresa"});
  Producto.belongsTo(Empresa, { as: "CodigoEmpresa_Empresa", foreignKey: "CodigoEmpresa"});
  Empresa.hasMany(Producto, { as: "Productos", foreignKey: "CodigoEmpresa"});
  Pago.belongsTo(Empresa, { as: "CodigoEmpresa_Empresa", foreignKey: "CodigoEmpresa"});
  Empresa.hasMany(Pago, { as: "CodigoEmpresa_Pagos", foreignKey: "CodigoEmpresa"});
  Inventario.belongsTo(Empresa, { as: "CodigoEmpresa_Empresa", foreignKey: "CodigoEmpresa"});
  Empresa.hasMany(Inventario, { as: "Inventarios", foreignKey: "CodigoEmpresa"});
  MovimientoInventario.belongsTo(Empresa, { as: "CodigoEmpresa_Empresa", foreignKey: "CodigoEmpresa"});
  Empresa.hasMany(MovimientoInventario, { as: "MovimientoInventarios", foreignKey: "CodigoEmpresa"});
  Pedido.belongsTo(Empresa, { as: "CodigoEmpresa_Empresa", foreignKey: "CodigoEmpresa"});
  Empresa.hasMany(Pedido, { as: "Pedidos", foreignKey: "CodigoEmpresa"});
  PermisoRolRecurso.belongsTo(Permiso, { as: "CodigoPermiso_Permiso", foreignKey: "CodigoPermiso"});
  Permiso.hasMany(PermisoRolRecurso, { as: "PermisoRolRecursos", foreignKey: "CodigoPermiso"});
  PermisoRolRecurso.belongsTo(Recurso, { as: "CodigoRecurso_Recurso", foreignKey: "CodigoRecurso"});
  Recurso.hasMany(PermisoRolRecurso, { as: "PermisoRolRecursos", foreignKey: "CodigoRecurso"});
  PermisoRolRecurso.belongsTo(Rol, { as: "CodigoRol_Rol", foreignKey: "CodigoRol"});
  Rol.hasMany(PermisoRolRecurso, { as: "PermisoRolRecursos", foreignKey: "CodigoRol"});
  Usuario.belongsTo(Rol, { as: "CodigoRol_Rol", foreignKey: "CodigoRol"});
  Rol.hasMany(Usuario, { as: "Usuarios", foreignKey: "CodigoRol"});
  MovimientoInventario.belongsTo(Usuario, { as: "CodigoUsuario_Usuario", foreignKey: "CodigoUsuario"});
  Usuario.hasMany(MovimientoInventario, { as: "MovimientoInventarios", foreignKey: "CodigoUsuario"});
  Pedido.belongsTo(Usuario, { as: "CodigoUsuario_Usuario", foreignKey: "CodigoUsuario"});
  Usuario.hasMany(Pedido, { as: "Pedidos", foreignKey: "CodigoUsuario"});
  PedidoDetalle.belongsTo(Abertura, { as: "CodigoAbertura_Abertura", foreignKey: "CodigoAbertura"});
  Abertura.hasMany(PedidoDetalle, { as: "PedidoDetalles", foreignKey: "CodigoAbertura"});
  PedidoDetalle.belongsTo(Boton, { as: "CodigoBoton_Boton", foreignKey: "CodigoBoton"});
  Boton.hasMany(PedidoDetalle, { as: "PedidoDetalles", foreignKey: "CodigoBoton"});
  Producto.belongsTo(Categoria, { as: "CodigoCategoria_Categorium", foreignKey: "CodigoCategoria"});
  Categoria.hasMany(Producto, { as: "Productos", foreignKey: "CodigoCategoria"});
  Pedido.belongsTo(Cliente, { as: "CodigoCliente_Cliente", foreignKey: "CodigoCliente"});
  Cliente.hasMany(Pedido, { as: "Pedidos", foreignKey: "CodigoCliente"});
  Inventario.belongsTo(Color, { as: "CodigoColor_Color", foreignKey: "CodigoColor"});
  Color.hasMany(Inventario, { as: "Inventarios", foreignKey: "CodigoColor"});
  Pedido.belongsTo(EstadoPedido, { as: "CodigoEstadoPedido_EstadoPedido", foreignKey: "CodigoEstadoPedido"});
  EstadoPedido.hasMany(Pedido, { as: "Pedidos", foreignKey: "CodigoEstadoPedido"});
  Inventario.belongsTo(Estilo, { as: "CodigoEstilo_Estilo", foreignKey: "CodigoEstilo"});
  Estilo.hasMany(Inventario, { as: "Inventarios", foreignKey: "CodigoEstilo"});
  Pago.belongsTo(FormaPago, { as: "CodigoFormaPago_FormaPago", foreignKey: "CodigoFormaPago"});
  FormaPago.hasMany(Pago, { as: "Pagos", foreignKey: "CodigoFormaPago"});
  Inventario.belongsTo(Marca, { as: "CodigoMarca_Marca", foreignKey: "CodigoMarca"});
  Marca.hasMany(Inventario, { as: "Inventarios", foreignKey: "CodigoMarca"});
  Inventario.belongsTo(Producto, { as: "CodigoProducto_Producto", foreignKey: "CodigoProducto"});
  Producto.hasMany(Inventario, { as: "Inventarios", foreignKey: "CodigoProducto"});
  Inventario.belongsTo(Talla, { as: "CodigoTalla_Talla", foreignKey: "CodigoTalla"});
  Talla.hasMany(Inventario, { as: "Inventarios", foreignKey: "CodigoTalla"});
  Inventario.belongsTo(Tamano, { as: "CodigoTamano_Tamano", foreignKey: "CodigoTamano"});
  Tamano.hasMany(Inventario, { as: "Inventarios", foreignKey: "CodigoTamano"});
  Inventario.belongsTo(Tela, { as: "CodigoTela_Tela", foreignKey: "CodigoTela"});
  Tela.hasMany(Inventario, { as: "Inventarios", foreignKey: "CodigoTela"});
  PedidoDetalle.belongsTo(Tela, { as: "CodigoTela_Tela", foreignKey: "CodigoTela"});
  Tela.hasMany(PedidoDetalle, { as: "PedidoDetalles", foreignKey: "CodigoTela"});
  PedidoDetalle.belongsTo(TipoCorte, { as: "CodigoTipoCorte_TipoCorte", foreignKey: "CodigoTipoCorte"});
  TipoCorte.hasMany(PedidoDetalle, { as: "PedidoDetalles", foreignKey: "CodigoTipoCorte"});
  PedidoDetalle.belongsTo(TipoCuello, { as: "CodigoTipoCuello_TipoCuello", foreignKey: "CodigoTipoCuello"});
  TipoCuello.hasMany(PedidoDetalle, { as: "PedidoDetalles", foreignKey: "CodigoTipoCuello"});
  Empresa.belongsTo(TipoEmpresa, { as: "CodigoTipoEmpresa_TipoEmpresa", foreignKey: "CodigoTipoEmpresa"});
  TipoEmpresa.hasMany(Empresa, { as: "Empresas", foreignKey: "CodigoTipoEmpresa"});
  PedidoDetalleMedida.belongsTo(TipoMedida, { as: "CodigoTipoMedida_TipoMedida", foreignKey: "CodigoTipoMedida"});
  TipoMedida.hasMany(PedidoDetalleMedida, { as: "PedidoDetalleMedidas", foreignKey: "CodigoTipoMedida"});
  Producto.belongsTo(TipoProducto, { as: "CodigoTipoProducto_TipoProducto", foreignKey: "CodigoTipoProducto"});
  TipoProducto.hasMany(Producto, { as: "Productos", foreignKey: "CodigoTipoProducto"});
  PedidoDetalle.belongsTo(TipoSolapa, { as: "CodigoTipoSolapa_TipoSolapa", foreignKey: "CodigoTipoSolapa"});
  TipoSolapa.hasMany(PedidoDetalle, { as: "PedidoDetalles", foreignKey: "CodigoTipoSolapa"});
  Tela.belongsTo(TipoTela, { as: "CodigoTipoTela_TipoTela", foreignKey: "CodigoTipoTela"});
  TipoTela.hasMany(Tela, { as: "Telas", foreignKey: "CodigoTipoTela"});
  Inventario.belongsTo(TipoTela, { as: "CodigoTipoTela_TipoTela", foreignKey: "CodigoTipoTela"});
  TipoTela.hasMany(Inventario, { as: "Inventarios", foreignKey: "CodigoTipoTela"});
  PedidoDetalle.belongsTo(TipoTela, { as: "CodigoTipoTela_TipoTela", foreignKey: "CodigoTipoTela"});
  TipoTela.hasMany(PedidoDetalle, { as: "PedidoDetalles", foreignKey: "CodigoTipoTela"});
  PagoAplicacion.belongsTo(Pago, { as: "CodigoPago_Pago", foreignKey: "CodigoPago"});
  Pago.hasMany(PagoAplicacion, { as: "PagoAplicacions", foreignKey: "CodigoPago"});
  MovimientoInventario.belongsTo(Inventario, { as: "CodigoInventario_Inventario", foreignKey: "CodigoInventario"});
  Inventario.hasMany(MovimientoInventario, { as: "MovimientoInventarios", foreignKey: "CodigoInventario"});
  PedidoDetalle.belongsTo(Inventario, { as: "CodigoInventario_Inventario", foreignKey: "CodigoInventario"});
  Inventario.hasMany(PedidoDetalle, { as: "PedidoDetalles", foreignKey: "CodigoInventario"});
  PedidoDetalle.belongsTo(Pedido, { as: "CodigoPedido_Pedido", foreignKey: "CodigoPedido"});
  Pedido.hasMany(PedidoDetalle, { as: "PedidoDetalles", foreignKey: "CodigoPedido"});
  PedidoDetalleMedida.belongsTo(PedidoDetalle, { as: "CodigoPedidoDetalle_PedidoDetalle", foreignKey: "CodigoPedidoDetalle"});
  PedidoDetalle.hasMany(PedidoDetalleMedida, { as: "PedidoDetalleMedidas", foreignKey: "CodigoPedidoDetalle"});

  return {
    Abertura,
    Boton,
    Categoria,
    Cliente,
    Color,
    Empresa,
    EstadoPedido,
    Estilo,
    FormaPago,
    Inventario,
    Marca,
    MovimientoInventario,
    Pago,
    PagoAplicacion,
    Pagos,
    Pedido,
    PedidoDetalle,
    PedidoDetalleMedida,
    Permiso,
    PermisoRolRecurso,
    Producto,
    Recurso,
    Rol,
    Talla,
    Tamano,
    Tela,
    TipoCorte,
    TipoCuello,
    TipoEmpresa,
    TipoMedida,
    TipoProducto,
    TipoSolapa,
    TipoTela,
    Usuario,
  };
}
module.exports = initModels;
module.exports.initModels = initModels;
module.exports.default = initModels;
