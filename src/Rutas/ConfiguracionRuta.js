const Express = require('express');
const Router = Express.Router();

const Modelo = 'configuracion';
const Tabla = 'Configuracion';

const { CrearProductoInventario, ObtenerInventarioListado, ObtenerInventarioEliminados,
    EliminarInventario, RestaurarInventario, ActualizarProductoInventario,
    ObtenerInventarioPorCodigo, ListadoTipoTela, ListadoTela, CrearTipoTela, EditarTipoTela,
    ObtenerTipoTelaPorCodigo, CrearTela, EditarTela, ObtenerTelaPorCodigo, EliminarTipoTela, EliminarTela,ListadoProducto,
    CrearVariacionInventario, ListadoTelaCompleto } = require('../Controladores/ConfiguracionControlador');

const VerificarToken = require('../FuncionIntermedia/VerificarToken');
const VerificarPermisos = require('../FuncionIntermedia/VerificarPermisos');

// Router.post(`/${Modelo}/crear`, VerificarToken, VerificarPermisos('CrearProductoInventario', Tabla), CrearProductoInventario);
// Router.get(`/${Modelo}/listado/:CodigoEmpresa`, VerificarToken, VerificarPermisos('Ver', Tabla), ObtenerInventarioListado);
// Router.get(`/${Modelo}/eliminados/:CodigoEmpresa`, VerificarToken, VerificarPermisos('Ver', Tabla), ObtenerInventarioEliminados);
// Router.delete(`/${Modelo}/eliminar/:CodigoInventario`, VerificarToken, VerificarPermisos('Eliminar', Tabla), EliminarInventario);
// Router.post(`/${Modelo}/restaurar`, VerificarToken, VerificarPermisos('Editar', Tabla), RestaurarInventario);
// Router.put(`/${Modelo}/actualizar/:CodigoInventario`, VerificarToken, VerificarPermisos('Editar', Tabla), ActualizarProductoInventario);
// Router.get(`/${Modelo}/obtener/:CodigoInventario`, VerificarToken, VerificarPermisos('Ver', Tabla), ObtenerInventarioPorCodigo);
// Router.get(`/${Modelo}/listado-tipo-tela`, VerificarToken, VerificarPermisos('Ver', Tabla), ListadoTipoTela);
// Router.get(`/${Modelo}/listado-tela/:CodigoTipoTela`, VerificarToken, VerificarPermisos('Ver', Tabla), ListadoTela);
// Router.post(`/${Modelo}/crear-variacion`, VerificarToken, VerificarPermisos('Crear', Tabla), CrearVariacionInventario);
// Router.post(`/${Modelo}/crear-tipo-tela`, VerificarToken, VerificarPermisos('Crear', Tabla), CrearTipoTela);
// Router.put(`/${Modelo}/editar-tipo-tela/:codigo`, VerificarToken, VerificarPermisos('Editar', Tabla), EditarTipoTela);
// Router.get(`/${Modelo}/obtener-tipo-tela/:codigo`, VerificarToken, VerificarPermisos('Ver', Tabla), ObtenerTipoTelaPorCodigo);
// Router.post(`/${Modelo}/crear-tela`, VerificarToken, VerificarPermisos('Crear', Tabla), CrearTela);
// Router.put(`/${Modelo}/editar-tela/:codigo`, VerificarToken, VerificarPermisos('Editar', Tabla), EditarTela);
// Router.get(`/${Modelo}/obtener-tela/:codigo`, VerificarToken, VerificarPermisos('Ver', Tabla), ObtenerTelaPorCodigo);
// Router.delete(`/${Modelo}/eliminar-tipo-tela/:codigo`, VerificarToken, VerificarPermisos('Eliminar', Tabla), EliminarTipoTela);
// Router.delete(`/${Modelo}/eliminar-tela/:codigo`, VerificarToken, VerificarPermisos('Eliminar', Tabla), EliminarTela);
// Router.get(`/${Modelo}/listado-producto`, VerificarToken, VerificarPermisos('Ver', Tabla), ListadoProducto);
// Router.get( `/${Modelo}/listado-tela-completo`, VerificarToken, VerificarPermisos('Ver', Tabla), ListadoTelaCompleto);

// Router.post(`/${Modelo}/crear`, VerificarToken, VerificarPermisos('CrearProductoInventario'), CrearProductoInventario);
// Router.get(`/${Modelo}/listado/:CodigoEmpresa`, VerificarToken, VerificarPermisos('VerInventario'), ObtenerInventarioListado);
// Router.get(`/${Modelo}/eliminados/:CodigoEmpresa`, VerificarToken, VerificarPermisos('VerInventarioEliminados'), ObtenerInventarioEliminados);
// Router.delete(`/${Modelo}/eliminar/:CodigoInventario`, VerificarToken, VerificarPermisos('EliminarProductoInventario'), EliminarInventario);
// Router.post(`/${Modelo}/restaurar`, VerificarToken, VerificarPermisos('RestaurarProductoInventario'), RestaurarInventario);
// Router.put(`/${Modelo}/actualizar/:CodigoInventario`, VerificarToken, VerificarPermisos('EditarProductoInventario'), ActualizarProductoInventario);
// Router.get(`/${Modelo}/obtener/:CodigoInventario`, VerificarToken, VerificarPermisos('VerProductoInventario'), ObtenerInventarioPorCodigo);

// Router.get(`/${Modelo}/listado-tipo-tela`, VerificarToken, VerificarPermisos('VerTipoTela'), ListadoTipoTela);
// Router.get(`/${Modelo}/listado-tela/:CodigoTipoTela`, VerificarToken, VerificarPermisos('VerTela'), ListadoTela);

// Router.post(`/${Modelo}/crear-variacion`, VerificarToken, VerificarPermisos('CrearVariacionInventario'), CrearVariacionInventario);

// Router.post(`/${Modelo}/crear-tipo-tela`, VerificarToken, VerificarPermisos('CrearTipoTela'), CrearTipoTela);
// Router.put(`/${Modelo}/editar-tipo-tela/:codigo`, VerificarToken, VerificarPermisos('EditarTipoTela'), EditarTipoTela);
// Router.get(`/${Modelo}/obtener-tipo-tela/:codigo`, VerificarToken, VerificarPermisos('VerTipoTela'), ObtenerTipoTelaPorCodigo);
// Router.delete(`/${Modelo}/eliminar-tipo-tela/:codigo`, VerificarToken, VerificarPermisos('EliminarTipoTela'), EliminarTipoTela);

// Router.post(`/${Modelo}/crear-tela`, VerificarToken, VerificarPermisos('CrearTela'), CrearTela);
// Router.put(`/${Modelo}/editar-tela/:codigo`, VerificarToken, VerificarPermisos('EditarTela'), EditarTela);
// Router.get(`/${Modelo}/obtener-tela/:codigo`, VerificarToken, VerificarPermisos('VerTela'), ObtenerTelaPorCodigo);
// Router.delete(`/${Modelo}/eliminar-tela/:codigo`, VerificarToken, VerificarPermisos('EliminarTela'), EliminarTela);

// Router.get(`/${Modelo}/listado-producto`, VerificarToken, VerificarPermisos('VerProducto'), ListadoProducto);
// Router.get(`/${Modelo}/listado-tela-completo`, VerificarToken, VerificarPermisos('VerTela'), ListadoTelaCompleto);

Router.post(`/${Modelo}/crear`, VerificarToken, VerificarPermisos('CrearProductoInventario', Tabla), CrearProductoInventario);
Router.get(`/${Modelo}/listado/:CodigoEmpresa`, VerificarToken, VerificarPermisos('VerInventario', Tabla), ObtenerInventarioListado);
Router.get(`/${Modelo}/eliminados/:CodigoEmpresa`, VerificarToken, VerificarPermisos('VerInventarioEliminados', Tabla), ObtenerInventarioEliminados);
Router.delete(`/${Modelo}/eliminar/:CodigoInventario`, VerificarToken, VerificarPermisos('EliminarProductoInventario', Tabla), EliminarInventario);
Router.post(`/${Modelo}/restaurar`, VerificarToken, VerificarPermisos('RestaurarProductoInventario', Tabla), RestaurarInventario);
Router.put(`/${Modelo}/actualizar/:CodigoInventario`, VerificarToken, VerificarPermisos('EditarProductoInventario', Tabla), ActualizarProductoInventario);
Router.get(`/${Modelo}/obtener/:CodigoInventario`, VerificarToken, VerificarPermisos('VerProductoInventario', Tabla), ObtenerInventarioPorCodigo);

// Tipo Tela
Router.get(`/${Modelo}/listado-tipo-tela`, VerificarToken, VerificarPermisos('VerTipoTela', Tabla), ListadoTipoTela);
Router.post(`/${Modelo}/crear-tipo-tela`, VerificarToken, VerificarPermisos('CrearTipoTela', Tabla), CrearTipoTela);
Router.put(`/${Modelo}/editar-tipo-tela/:codigo`, VerificarToken, VerificarPermisos('EditarTipoTela', Tabla), EditarTipoTela);
Router.get(`/${Modelo}/obtener-tipo-tela/:codigo`, VerificarToken, VerificarPermisos('VerTipoTela', Tabla), ObtenerTipoTelaPorCodigo);
Router.delete(`/${Modelo}/eliminar-tipo-tela/:codigo`, VerificarToken, VerificarPermisos('EliminarTipoTela', Tabla), EliminarTipoTela);

// Tela
Router.get(`/${Modelo}/listado-tela/:CodigoTipoTela`, VerificarToken, VerificarPermisos('VerTela', Tabla), ListadoTela);
Router.post(`/${Modelo}/crear-tela`, VerificarToken, VerificarPermisos('CrearTela', Tabla), CrearTela);
Router.put(`/${Modelo}/editar-tela/:codigo`, VerificarToken, VerificarPermisos('EditarTela', Tabla), EditarTela);
Router.get(`/${Modelo}/obtener-tela/:codigo`, VerificarToken, VerificarPermisos('VerTela', Tabla), ObtenerTelaPorCodigo);
Router.delete(`/${Modelo}/eliminar-tela/:codigo`, VerificarToken, VerificarPermisos('EliminarTela', Tabla), EliminarTela);

// Variaciones
Router.post(`/${Modelo}/crear-variacion`, VerificarToken, VerificarPermisos('CrearVariacionInventario', Tabla), CrearVariacionInventario);

// Listados adicionales
Router.get(`/${Modelo}/listado-producto`, VerificarToken, VerificarPermisos('VerProducto', Tabla), ListadoProducto);
Router.get(`/${Modelo}/listado-tela-completo`, VerificarToken, VerificarPermisos('VerTela', Tabla), ListadoTelaCompleto);

module.exports = Router;