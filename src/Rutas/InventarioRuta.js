const Express = require('express');
const Router = Express.Router();

const Modelo = 'inventario';
const Tabla = 'Inventario';

const { CrearProductoInventario, ListadoMarca, ListadoEstilo, ListadoTalla, ListadoColor,
    ListadoTipoProducto, ObtenerInventarioListado, EliminarInventario, ObtenerInventarioEliminados,
    RestaurarInventario, ObtenerInventarioPorCodigo, ActualizarProductoInventario,
    CrearMarca, CrearEstilo, CrearTalla, CrearColor, ActualizarMarca, ActualizarEstilo,
    ActualizarTalla, ActualizarColor,ObtenerMarcaPorCodigo, ObtenerEstiloPorCodigo, ObtenerTallaPorCodigo, ObtenerColorPorCodigo } = require('../Controladores/InventarioControlador');

const VerificarToken = require('../FuncionIntermedia/VerificarToken');
const VerificarPermisos = require('../FuncionIntermedia/VerificarPermisos');


// Router.get(`/${Modelo}/tipo-producto`, VerificarToken, VerificarPermisos('Ver', Tabla), ListadoTipoProducto);
// Router.get(`/${Modelo}/marcas`, VerificarToken, VerificarPermisos('Ver', Tabla), ListadoMarca);
// Router.get(`/${Modelo}/estilos`, VerificarToken, VerificarPermisos('Ver', Tabla), ListadoEstilo);
// Router.get(`/${Modelo}/tallas`, VerificarToken, VerificarPermisos('Ver', Tabla), ListadoTalla);
// Router.get(`/${Modelo}/colores`, VerificarToken, VerificarPermisos('Ver', Tabla), ListadoColor);
// Router.post(`/${Modelo}/crear`, VerificarToken, VerificarPermisos('Crear', Tabla), CrearProductoInventario);
// Router.get(`/${Modelo}/listado/:CodigoEmpresa`, VerificarToken, VerificarPermisos('Ver', Tabla), ObtenerInventarioListado);
// Router.get(`/${Modelo}/eliminados/:CodigoEmpresa`, VerificarToken, VerificarPermisos('Ver', Tabla), ObtenerInventarioEliminados);
// Router.delete(`/${Modelo}/eliminar/:CodigoInventario`, VerificarToken, VerificarPermisos('Eliminar', Tabla), EliminarInventario);
// Router.post(`/${Modelo}/restaurar`, VerificarToken, VerificarPermisos('Editar', Tabla), RestaurarInventario);
// Router.put(`/${Modelo}/actualizar/:CodigoInventario`, VerificarToken, VerificarPermisos('Editar', Tabla), ActualizarProductoInventario);
// Router.get(`/${Modelo}/obtener/:CodigoInventario`, VerificarToken, VerificarPermisos('Ver', Tabla), ObtenerInventarioPorCodigo);
// Router.post(`/${Modelo}/marca`, VerificarToken, VerificarPermisos('Crear', Tabla), CrearMarca);
// Router.post(`/${Modelo}/estilo`, VerificarToken, VerificarPermisos('Crear', Tabla), CrearEstilo);
// Router.post(`/${Modelo}/talla`, VerificarToken, VerificarPermisos('Crear', Tabla), CrearTalla);
// Router.post(`/${Modelo}/color`, VerificarToken, VerificarPermisos('Crear', Tabla), CrearColor);
// Router.put(`/${Modelo}/marca`, VerificarToken, VerificarPermisos('Editar', Tabla), ActualizarMarca);
// Router.put(`/${Modelo}/estilo`, VerificarToken, VerificarPermisos('Editar', Tabla), ActualizarEstilo);
// Router.put(`/${Modelo}/talla`, VerificarToken, VerificarPermisos('Editar', Tabla), ActualizarTalla);
// Router.put(`/${Modelo}/color`, VerificarToken, VerificarPermisos('Editar', Tabla), ActualizarColor);
// Router.get(`/${Modelo}/marca/:CodigoMarca`, VerificarToken, VerificarPermisos('Ver', Tabla), ObtenerMarcaPorCodigo);
// Router.get(`/${Modelo}/estilo/:CodigoEstilo`, VerificarToken, VerificarPermisos('Ver', Tabla), ObtenerEstiloPorCodigo);
// Router.get(`/${Modelo}/talla/:CodigoTalla`, VerificarToken, VerificarPermisos('Ver', Tabla), ObtenerTallaPorCodigo);
// Router.get(`/${Modelo}/color/:CodigoColor`, VerificarToken, VerificarPermisos('Ver', Tabla), ObtenerColorPorCodigo);
Router.get(`/${Modelo}/tipo-producto`, VerificarToken, VerificarPermisos('VerTipoProducto', Tabla), ListadoTipoProducto);

Router.get(`/${Modelo}/marcas`, VerificarToken, VerificarPermisos('VerMarca', Tabla), ListadoMarca);
Router.get(`/${Modelo}/estilos`, VerificarToken, VerificarPermisos('VerEstilo', Tabla), ListadoEstilo);
Router.get(`/${Modelo}/tallas`, VerificarToken, VerificarPermisos('VerTalla', Tabla), ListadoTalla);
Router.get(`/${Modelo}/colores`, VerificarToken, VerificarPermisos('VerColor', Tabla), ListadoColor);

Router.post(`/${Modelo}/crear`, VerificarToken, VerificarPermisos('CrearProductoInventario', Tabla), CrearProductoInventario);
Router.get(`/${Modelo}/listado/:CodigoEmpresa`, VerificarToken, VerificarPermisos('VerInventario', Tabla), ObtenerInventarioListado);
Router.get(`/${Modelo}/eliminados/:CodigoEmpresa`, VerificarToken, VerificarPermisos('VerInventarioEliminado', Tabla), ObtenerInventarioEliminados);
Router.delete(`/${Modelo}/eliminar/:CodigoInventario`, VerificarToken, VerificarPermisos('EliminarProductoInventario', Tabla), EliminarInventario);
Router.post(`/${Modelo}/restaurar`, VerificarToken, VerificarPermisos('RestaurarProductoInventario', Tabla), RestaurarInventario);
Router.put(`/${Modelo}/actualizar/:CodigoInventario`, VerificarToken, VerificarPermisos('EditarProductoInventario', Tabla), ActualizarProductoInventario);
Router.get(`/${Modelo}/obtener/:CodigoInventario`, VerificarToken, VerificarPermisos('VerProductoInventario', Tabla), ObtenerInventarioPorCodigo);

// Marca
Router.post(`/${Modelo}/marca`, VerificarToken, VerificarPermisos('CrearMarca', Tabla), CrearMarca);
Router.put(`/${Modelo}/marca`, VerificarToken, VerificarPermisos('EditarMarca', Tabla), ActualizarMarca);
Router.get(`/${Modelo}/marca/:CodigoMarca`, VerificarToken, VerificarPermisos('VerMarca', Tabla), ObtenerMarcaPorCodigo);

// Estilo
Router.post(`/${Modelo}/estilo`, VerificarToken, VerificarPermisos('CrearEstilo', Tabla), CrearEstilo);
Router.put(`/${Modelo}/estilo`, VerificarToken, VerificarPermisos('EditarEstilo', Tabla), ActualizarEstilo);
Router.get(`/${Modelo}/estilo/:CodigoEstilo`, VerificarToken, VerificarPermisos('VerEstilo', Tabla), ObtenerEstiloPorCodigo);

// Talla
Router.post(`/${Modelo}/talla`, VerificarToken, VerificarPermisos('CrearTalla', Tabla), CrearTalla);
Router.put(`/${Modelo}/talla`, VerificarToken, VerificarPermisos('EditarTalla', Tabla), ActualizarTalla);
Router.get(`/${Modelo}/talla/:CodigoTalla`, VerificarToken, VerificarPermisos('VerTalla', Tabla), ObtenerTallaPorCodigo);

// Color
Router.post(`/${Modelo}/color`, VerificarToken, VerificarPermisos('CrearColor', Tabla), CrearColor);
Router.put(`/${Modelo}/color`, VerificarToken, VerificarPermisos('EditarColor', Tabla), ActualizarColor);
Router.get(`/${Modelo}/color/:CodigoColor`, VerificarToken, VerificarPermisos('VerColor', Tabla), ObtenerColorPorCodigo);

module.exports = Router;