const Sequelize = require('sequelize');
const BaseDatos = require('../BaseDatos/ConexionBaseDatos');

const InventarioModelo = require('../Modelos/Inventario')(BaseDatos, Sequelize.DataTypes);
const ProductoModelo = require('../Modelos/Producto')(BaseDatos, Sequelize.DataTypes);
const TipoProductoModelo = require('../Modelos/TipoProducto')(BaseDatos, Sequelize.DataTypes);
const TipoTelaModelo = require('../Modelos/TipoTela')(BaseDatos, Sequelize.DataTypes);
const TelaModelo = require('../Modelos/Tela')(BaseDatos, Sequelize.DataTypes);
const MovimientoInventarioModelo = require('../Modelos/MovimientoInventario')(BaseDatos, Sequelize.DataTypes);

const { LanzarError } = require('../Utilidades/ErrorServicios');
const { Op } = require('sequelize');

const {
    InventarioModelo: InventarioRelacion,
    ProductoModelo: ProductoRelacion,
    MarcaModelo: MarcaRelacion,
    EstiloModelo: EstiloRelacion,
    TallaModelo: TallaRelacion,
    ColorModelo: ColorRelacion,
    TipoProductoModelo: TipoProductoRelacion,
    TipoTelaModelo: TipoTelaRelacion,
    TelaModelo: TelaRelacion
} = require('../Relaciones/Relaciones');

const ListadoNombreTelaCompleto = async () => {
    try {

        const telas = await TelaRelacion.findAll({

            where: { Estatus: 1 },

            attributes: [
                'CodigoTela',
                'NombreTela',
                'CodigoTipoTela'
            ],

            include: [
                {
                    model: TipoTelaRelacion,
                    as: 'TipoTela',
                    attributes: ['NombreTipoTela'],
                    required: true
                }
            ],

            order: [['NombreTela', 'ASC']]

        });

        return telas.map(t => ({

            CodigoTela: t.CodigoTela,
            CodigoTipoTela: t.CodigoTipoTela,
            NombreTipoTela: t.TipoTela?.NombreTipoTela || '',
            NombreTela: t.NombreTela

        }));

    } catch (error) {

        console.error(error);

        LanzarError(
            'Error al obtener listado de telas',
            500,
            'Error'
        );
    }
};
const ActualizarProductoInventario = async (CodigoInventario, Datos, CodigoUsuario) => {

    const Transaccion = await BaseDatos.transaction();

    try {

        const {
            CodigoProducto,
            CodigoTipoProducto,
            CodigoTipoTela,
            CodigoTela,
            Precio,
            Stock,
            Estatus,
            NombreProducto
        } = Datos;

        if (!CodigoInventario) LanzarError('Código de inventario es requerido', 400);
        if (!CodigoProducto) LanzarError('Producto es requerido', 400);
        if (!CodigoTipoProducto) LanzarError('Tipo de producto es requerido', 400);
        if (!CodigoTipoTela) LanzarError('Tipo de tela es requerido', 400);
        if (!CodigoTela) LanzarError('Tela es requerida', 400);
        if (Precio === undefined || Precio === null) LanzarError('Precio es requerido', 400);
        if (Stock === undefined || Stock === null) LanzarError('Stock es requerido', 400);
        if (Estatus === undefined || Estatus === null) LanzarError('Estatus es requerido', 400);
        if (!CodigoUsuario) LanzarError('Usuario es requerido', 400);

        const CodigoEmpresa = 1;

        // =========================
        // 1. BUSCAR INVENTARIO
        // =========================
        const InventarioDB = await InventarioRelacion.findOne({
            where: {
                CodigoInventario,
                CodigoEmpresa
            },
            transaction: Transaccion
        });

        if (!InventarioDB)
            LanzarError('Inventario no encontrado', 404);

        // =========================
        // 2. VALIDAR DUPLICADO
        // =========================
        const ExisteOtroInventario = await InventarioRelacion.findOne({
            where: {
                CodigoEmpresa,
                CodigoProducto,
                CodigoTipoTela,
                CodigoTela,
                CodigoInventario: { [Op.ne]: CodigoInventario }
            },
            transaction: Transaccion
        });

        if (ExisteOtroInventario)
            LanzarError('Otro inventario ya existe con la misma combinación', 400);

        // =========================
        // 3. ACTUALIZAR INVENTARIO
        // =========================
        const StockAnterior = InventarioDB.StockActual;

        await InventarioDB.update({
            CodigoProducto,
            CodigoTipoProducto,
            CodigoTipoTela,
            CodigoTela,
            PrecioVenta: Precio,
            StockActual: Stock,
            Estatus,

            ...(NombreProducto && {
                NombreProducto: NormalizarNombre(NombreProducto)
            })
        }, { transaction: Transaccion });

        // =========================
        // 4. MOVIMIENTO INVENTARIO
        // =========================
        if (StockAnterior !== Stock) {

            await MovimientoInventarioModelo.create({
                CodigoEmpresa,
                CodigoInventario: CodigoInventario,
                TipoMovimiento: 'AJUSTE',
                OrigenMovimiento: 'ACTUALIZACION',
                CodigoDocumento: null,
                Cantidad: Stock,
                StockAnterior,
                StockNuevo: Stock,
                Observacion: 'Actualización de inventario',
                CodigoUsuario,
                FechaMovimiento: new Date()
            }, { transaction: Transaccion });

        }

        await Transaccion.commit();

        return InventarioDB;

    } catch (error) {

        await Transaccion.rollback();
        throw error;

    }

};
const NormalizarNombre = (texto) => {
    if (!texto) return '';

    return texto
        .trim()
        .replace(/\s+/g, ' ')
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .toLowerCase()
        .replace(/\b\w/g, c => c.toUpperCase());
};
const CrearProductoInventario = async (Datos, CodigoUsuario) => {
    const Transaccion = await BaseDatos.transaction();

    try {

        const {
            CodigoTipoProducto,
            CodigoTipoTela,
            CodigoTela,
            NombreProducto,
            Precio
        } = Datos;

        // EMPRESA QUEMADA
        const CodigoEmpresa = 1;

        // =========================
        // VALIDACIONES
        // =========================

        if (!CodigoTipoProducto)
            LanzarError('Tipo de producto es requerido', 400);

        if (!CodigoTipoTela)
            LanzarError('Tipo de tela es requerido', 400);

        if (!CodigoTela)
            LanzarError('Tela es requerida', 400);

        if (!NombreProducto)
            LanzarError('Nombre de producto es requerido', 400);

        if (Precio === undefined || Precio === null)
            LanzarError('Precio es requerido', 400);

        if (!CodigoUsuario)
            LanzarError('Usuario es requerido', 400);

        // =========================
        // VALIDAR PRODUCTO DUPLICADO
        // =========================
        const NombreProductoLimpio = NormalizarNombre(NombreProducto);
        // 1. Buscar producto por nombre
        const ProductoExistente = await ProductoModelo.findOne({
            where: {
                NombreProducto: NombreProductoLimpio,
                CodigoEmpresa
            },
            transaction: Transaccion
        });

        if (ProductoExistente) {

            // 2. Buscar inventario de ese producto
            const InventarioExistente = await InventarioModelo.findOne({
                where: {
                    CodigoProducto: ProductoExistente.CodigoProducto
                },
                transaction: Transaccion
            });

            if (InventarioExistente) {

                if (InventarioExistente.Estatus === 1) {
                    LanzarError('El producto ya existe', 400);
                }

                if (InventarioExistente.Estatus === 3) {
                    LanzarError('El producto ya existe en productos eliminados. Debe restaurarlo.', 400);
                }
            }
        }

        // =========================
        // 1. CREAR PRODUCTO
        // =========================

        const ProductoDB = await ProductoModelo.create({
            CodigoEmpresa,
            CodigoTipoProducto,
            NombreProducto: NombreProductoLimpio,
            PrecioBase: Precio,
            Estatus: 1
        }, { transaction: Transaccion });

        // =========================
        // 2. CREAR INVENTARIO
        // =========================

        const InventarioDB = await InventarioModelo.create({

            CodigoEmpresa,
            CodigoProducto: ProductoDB.CodigoProducto,
            CodigoTipoTela,
            CodigoTela,
            PrecioVenta: Precio,
            StockActual: 0,
            StockMinimo: 0,
            StockMaximo: 0,
            Estatus: 1

        }, { transaction: Transaccion });

        // =========================
        // COMMIT
        // =========================

        await Transaccion.commit();

        return {
            Producto: ProductoDB,
            Inventario: InventarioDB
        };

    } catch (error) {

        await Transaccion.rollback();
        throw error;

    }
};

const ObtenerInventarioPorCodigo = async (CodigoInventario) => {
    try {
        if (!CodigoInventario) LanzarError('Código de inventario es requerido', 400);

        const Inventario = await InventarioRelacion.findOne({
            where: { CodigoInventario },
            attributes: [
                'CodigoInventario',
                'CodigoBarras',
                'PrecioVenta',
                'StockActual',
                'Estatus',
                'CodigoEmpresa'
            ],
            include: [
                {
                    model: ProductoRelacion,
                    as: 'Producto',
                    attributes: ['CodigoProducto', 'NombreProducto', 'CodigoTipoProducto'],
                    include: [
                        {
                            model: TipoProductoRelacion,
                            as: 'TipoProducto',
                            attributes: ['CodigoTipoProducto', 'NombreTipoProducto']
                        }
                    ]
                },
                {
                    model: TipoTelaRelacion,
                    as: 'TipoTela',
                    attributes: ['CodigoTipoTela', 'NombreTipoTela']
                },
                {
                    model: TelaRelacion,
                    as: 'Tela',
                    attributes: ['CodigoTela', 'NombreTela']
                }
            ]
        });

        if (!Inventario) LanzarError('Inventario no encontrado', 404);

        return {
            CodigoInventario: Inventario.CodigoInventario,
            CodigoProducto: Inventario.Producto?.CodigoProducto,
            NombreProducto: Inventario.Producto?.NombreProducto,
            CodigoTipoProducto: Inventario.Producto?.TipoProducto?.CodigoTipoProducto,
            NombreTipoProducto: Inventario.Producto?.TipoProducto?.NombreTipoProducto,
            CodigoTipoTela: Inventario.TipoTela?.CodigoTipoTela,
            NombreTipoTela: Inventario.TipoTela?.NombreTipoTela,
            CodigoTela: Inventario.Tela?.CodigoTela,
            NombreTela: Inventario.Tela?.NombreTela,
            CodigoBarra: Inventario.CodigoBarras,
            Precio: Inventario.PrecioVenta,
            StockActual: Inventario.StockActual,
            Estatus: Inventario.Estatus,
            CodigoEmpresa: Inventario.CodigoEmpresa
        };

    } catch (error) {
        throw error;
    }
};


module.exports = {
    NormalizarNombre
};
//CORREGIDOS

const ObtenerInventarioListado = async (CodigoEmpresa) => {
    try {
        if (!CodigoEmpresa) LanzarError('Empresa es requerida', 400);

        const Inventario = await InventarioRelacion.findAll({
            where: { CodigoEmpresa, Estatus: { [Op.in]: [1, 2] } },
            attributes: ['CodigoInventario', 'PrecioVenta'],
            include: [
                {
                    model: ProductoRelacion,
                    as: 'Producto',
                    attributes: ['NombreProducto', 'CodigoTipoProducto', 'CodigoProducto'],
                    required: true,
                    where: { CodigoTipoProducto: 2 }
                },
                {
                    model: TipoTelaRelacion,
                    as: 'TipoTela',
                    attributes: ['NombreTipoTela'],
                    required: true
                },
                {
                    model: TelaRelacion,
                    as: 'Tela',
                    attributes: ['NombreTela'],
                    required: true
                }
            ],
            order: [['CodigoInventario', 'DESC']]
        });

        const agrupado = {};

        Inventario.forEach(item => {
            const nombreProducto = item.Producto?.NombreProducto || 'Sin producto';

            if (!agrupado[nombreProducto]) {
                agrupado[nombreProducto] = {
                    Producto: nombreProducto,
                    CodigoProducto: item.Producto?.CodigoProducto || null, // ✅ ahora sí
                    Variaciones: []
                };
            }

            agrupado[nombreProducto].Variaciones.push({
                CodigoInventario: item.CodigoInventario,
                TipoTela: item.TipoTela?.NombreTipoTela || 'Sin tipo tela',
                Tela: item.Tela?.NombreTela || 'Sin tela',
                Precio: item.PrecioVenta
            });
        });

        return Object.values(agrupado);

    } catch (error) {
        console.error('Error en ObtenerInventarioListado:', error);
        throw error;
    }
};


const CrearVariacionInventario = async (Datos, CodigoUsuario) => {
    const Transaccion = await BaseDatos.transaction();

    try {
        const {
            CodigoProducto,
            CodigoTipoProducto,
            CodigoTipoTela,
            CodigoTela,
            Precio
        } = Datos;

        const CodigoEmpresa = 1; // Empresa fija

        // =========================
        // VALIDACIONES
        // =========================

        if (!CodigoProducto)
            LanzarError('Código de producto es requerido', 400);

        if (!CodigoTipoProducto)
            LanzarError('Tipo de producto es requerido', 400);

        if (!CodigoTipoTela)
            LanzarError('Tipo de tela es requerido', 400);

        if (!CodigoTela)
            LanzarError('Tela es requerida', 400);

        if (Precio === undefined || Precio === null)
            LanzarError('Precio es requerido', 400);

        if (!CodigoUsuario)
            LanzarError('Usuario es requerido', 400);

        // =========================
        // VALIDAR DUPLICADO EN INVENTARIO
        // =========================

        const ExisteInventario = await InventarioModelo.findOne({
            where: {
                CodigoProducto,
                CodigoTipoTela,
                CodigoTela,
                CodigoEmpresa
            },
            transaction: Transaccion
        });

        if (ExisteInventario)
            LanzarError('Esta variación ya existe en el inventario', 400);

        // =========================
        // CREAR NUEVA VARIACION EN INVENTARIO
        // =========================

        const InventarioDB = await InventarioModelo.create({
            CodigoEmpresa,
            CodigoProducto,
            CodigoTipoTela,
            CodigoTela,
            PrecioVenta: Precio,
            StockActual: 0,
            StockMinimo: 0,
            StockMaximo: 0,
            Estatus: 1
        }, { transaction: Transaccion });

        // =========================
        // COMMIT
        // =========================

        await Transaccion.commit();

        return InventarioDB;

    } catch (error) {
        await Transaccion.rollback();
        throw error;
    }
};


const ObtenerInventarioEliminados = async (CodigoEmpresa) => {
    try {
        if (!CodigoEmpresa) LanzarError('Empresa es requerida', 400);

        const Inventario = await InventarioRelacion.findAll({
            where: {
                CodigoEmpresa,
                Estatus: 3 // ✅ solo cambia esto
            },
            attributes: ['CodigoInventario', 'PrecioVenta'],
            include: [
                {
                    model: ProductoRelacion,
                    as: 'Producto',
                    attributes: ['NombreProducto', 'CodigoTipoProducto', 'CodigoProducto'],
                    required: true,
                    where: { CodigoTipoProducto: 2 }
                },
                {
                    model: TipoTelaRelacion,
                    as: 'TipoTela',
                    attributes: ['NombreTipoTela'],
                    required: true
                },
                {
                    model: TelaRelacion,
                    as: 'Tela',
                    attributes: ['NombreTela'],
                    required: true
                }
            ],
            order: [['CodigoInventario', 'DESC']]
        });

        const agrupado = {};

        Inventario.forEach(item => {
            const nombreProducto = item.Producto?.NombreProducto || 'Sin producto';

            if (!agrupado[nombreProducto]) {
                agrupado[nombreProducto] = {
                    Producto: nombreProducto,
                    CodigoProducto: item.Producto?.CodigoProducto || null,
                    Variaciones: []
                };
            }

            agrupado[nombreProducto].Variaciones.push({
                CodigoInventario: item.CodigoInventario,
                TipoTela: item.TipoTela?.NombreTipoTela || 'Sin tipo tela',
                Tela: item.Tela?.NombreTela || 'Sin tela',
                Precio: item.PrecioVenta
            });
        });

        return Object.values(agrupado);

    } catch (error) {
        console.error('Error en ObtenerInventarioEliminados:', error);
        throw error;
    }
};
const EliminarInventario = async (CodigoInventario, CodigoUsuario) => {
    const Transaccion = await BaseDatos.transaction();

    try {
        if (!CodigoInventario) LanzarError('Código de inventario es requerido', 400);
        if (!CodigoUsuario) LanzarError('Usuario es requerido', 400);

        // =========================
        // 1. Buscar inventario
        // =========================
        const InventarioDB = await InventarioModelo.findOne({
            where: { CodigoInventario },
            transaction: Transaccion
        });

        if (!InventarioDB) LanzarError('Inventario no encontrado', 404);

        // =========================
        // 2. Actualizar estatus a 3
        // =========================
        await InventarioDB.update(
            { Estatus: 3 },
            { transaction: Transaccion }
        );

        // =========================
        // 3. Registrar movimiento de inventario (opcional)
        // =========================
        await MovimientoInventarioModelo.create({
            CodigoEmpresa: InventarioDB.CodigoEmpresa,
            CodigoInventario: InventarioDB.CodigoInventario,
            TipoMovimiento: 'SALIDA',
            OrigenMovimiento: 'ELIMINACION',
            CodigoDocumento: null,
            Cantidad: InventarioDB.StockActual,
            StockAnterior: InventarioDB.StockActual,
            StockNuevo: 0,
            Observacion: 'Inventario eliminado (estatus 3)',
            CodigoUsuario,
            FechaMovimiento: new Date()
        }, { transaction: Transaccion });

        await Transaccion.commit();

        return { mensaje: 'Inventario eliminado correctamente', CodigoInventario };

    } catch (error) {
        await Transaccion.rollback();
        throw error;
    }
};

const RestaurarInventario = async (CodigosInventario, CodigoUsuario) => {
    const Transaccion = await BaseDatos.transaction();

    try {
        // =========================
        // 1. Validaciones
        // =========================
        if (!CodigosInventario || (Array.isArray(CodigosInventario) && CodigosInventario.length === 0)) {
            LanzarError('Se requiere al menos un código de inventario', 400);
        }
        if (!CodigoUsuario) LanzarError('Usuario es requerido', 400);

        // Asegurarse de que sea un array
        const CodigosArray = Array.isArray(CodigosInventario) ? CodigosInventario : [CodigosInventario];

        // =========================
        // 2. Buscar inventarios existentes
        // =========================
        const InventariosDB = await InventarioModelo.findAll({
            where: { CodigoInventario: { [Op.in]: CodigosArray } },
            transaction: Transaccion
        });

        if (!InventariosDB || InventariosDB.length === 0) {
            LanzarError('No se encontraron inventarios para restaurar', 404);
        }

        // =========================
        // 3. Actualizar estatus a 1
        // =========================
        for (const inventario of InventariosDB) {
            await inventario.update({ Estatus: 1 }, { transaction: Transaccion });

            // =========================
            // 4. Registrar movimiento
            // =========================
            await MovimientoInventarioModelo.create({
                CodigoEmpresa: inventario.CodigoEmpresa,
                CodigoInventario: inventario.CodigoInventario,
                TipoMovimiento: 'ENTRADA',
                OrigenMovimiento: 'RESTAURACION',
                CodigoDocumento: null,
                Cantidad: inventario.StockActual,
                StockAnterior: 0,
                StockNuevo: inventario.StockActual,
                Observacion: 'Inventario restaurado (estatus 1)',
                CodigoUsuario,
                FechaMovimiento: new Date()
            }, { transaction: Transaccion });
        }

        await Transaccion.commit();

        return { mensaje: 'Inventario(s) restaurado(s) correctamente', CodigosInventario: CodigosArray };

    } catch (error) {
        await Transaccion.rollback();
        throw error;
    }
};
//FINAL CORREGIDOS



// LISTADO PRODUCTOS
const ListadoProducto = async () => {
    try {

        const productos = await ProductoRelacion.findAll({
            where: { Estatus: 1 },
            attributes: [
                'CodigoProducto',
                'NombreProducto',
                'CodigoTipoProducto',
                'PrecioBase'
            ],
            include: [
                {
                    model: TipoProductoRelacion,
                    as: 'TipoProducto',
                    attributes: ['CodigoTipoProducto', 'NombreTipoProducto']
                }
            ],
            order: [['NombreProducto', 'ASC']]
        });

        return productos.map(p => ({
            CodigoProducto: p.CodigoProducto,
            NombreProducto: p.NombreProducto,
            CodigoTipoProducto: p.TipoProducto?.CodigoTipoProducto,
            TipoProducto: p.TipoProducto?.NombreTipoProducto,
            PrecioBase: p.PrecioBase
        }));

    } catch (error) {
        throw error;
    }
};
const ListadoTipoTela = async () => {
    try {
        const tipos = await TipoTelaModelo.findAll({
            where: { Estatus: 1 },
            attributes: ['CodigoTipoTela', 'NombreTipoTela'],
            order: [['NombreTipoTela', 'ASC']]
        });

        return tipos.map(t => ({
            CodigoTipoTela: t.CodigoTipoTela,
            NombreTipoTela: t.NombreTipoTela
        }));

    } catch (error) {
        throw error;
    }
};

const ListadoNombreTela = async (CodigoTipoTela) => {
    try {

        if (!CodigoTipoTela)
            LanzarError('CodigoTipoTela es requerido', 400);

        const telas = await TelaModelo.findAll({
            where: {
                Estatus: 1,
                CodigoTipoTela: CodigoTipoTela
            },
            attributes: [
                'CodigoTela',
                'NombreTela'
            ],
            order: [['NombreTela', 'ASC']]
        });

        return telas.map(t => ({
            CodigoTela: t.CodigoTela,
            NombreTela: t.NombreTela
        }));

    } catch (error) {

        throw error;
    }
};

// CREAR
const CrearTipoTela = async (data) => {
    try {

        const NombreTipoTela = NormalizarNombre(data.NombreTipoTela);

        if (!NombreTipoTela) {
            LanzarError('El nombre del tipo de tela es requerido', 400, 'Alerta');
        }

        const existe = await TipoTelaModelo.findOne({
            where: {
                NombreTipoTela,
                Estatus: 1
            }
        });

        if (existe) {
            LanzarError('El tipo de tela ya existe', 400, 'Alerta');
        }

        const nuevo = await TipoTelaModelo.create({
            NombreTipoTela,
            Estatus: 1
        });

        return {
            CodigoTipoTela: nuevo.CodigoTipoTela,
            NombreTipoTela: nuevo.NombreTipoTela
        };

    } catch (error) {
        throw error;
    }
};

const CrearTela = async (data) => {
    try {

        const CodigoTipoTela = data.CodigoTipoTela;
        const NombreTela = NormalizarNombre(data.NombreTela);

        if (!CodigoTipoTela || !NombreTela) {
            LanzarError('Tipo de tela y nombre de tela son requeridos', 400, 'Alerta');
        }

        const tipoTela = await TipoTelaModelo.findByPk(CodigoTipoTela);

        if (!tipoTela) {
            LanzarError('El tipo de tela no existe', 400, 'Alerta');
        }

        const existe = await TelaModelo.findOne({
            where: {
                NombreTela,
                Estatus: 1
            }
        });

        if (existe) {
            LanzarError('La tela ya existe', 400, 'Alerta');
        }

        const nueva = await TelaModelo.create({
            CodigoTipoTela,
            NombreTela,
            Estatus: 1
        });

        return {
            CodigoTela: nueva.CodigoTela,
            CodigoTipoTela: nueva.CodigoTipoTela,
            NombreTela: nueva.NombreTela
        };

    } catch (error) {
        throw error;
    }
};
// OBTENER POR CODIGO
const ObtenerTipoTelaPorCodigo = async (codigo) => {
    try {

        const tipo = await TipoTelaModelo.findOne({
            where: {
                CodigoTipoTela: codigo,
                Estatus: 1
            },
            attributes: ['CodigoTipoTela', 'NombreTipoTela']
        });

        if (!tipo) {
            LanzarError('Tipo de tela no encontrado', 404, 'Alerta');
        }

        return tipo;

    } catch (error) {
        throw error;
    }
};
const ObtenerTelaPorCodigo = async (codigo) => {
    try {

        const tela = await TelaModelo.findOne({
            where: {
                CodigoTela: codigo,
                Estatus: 1
            },
            attributes: [
                'CodigoTela',
                'CodigoTipoTela',
                'NombreTela'
            ],
            include: [
                {
                    model: TipoTelaModelo,
                    attributes: ['CodigoTipoTela', 'NombreTipoTela']
                }
            ]
        });

        if (!tela) {
            LanzarError('Tela no encontrada', 404, 'Alerta');
        }

        return tela;

    } catch (error) {
        throw error;
    }
};

// EDITAR
const EditarTipoTela = async (codigo, data) => {
    try {

        const { NombreTipoTela } = data;

        const tipo = await TipoTelaModelo.findByPk(codigo);

        if (!tipo) {
            LanzarError('Tipo de tela no encontrado', 404, 'Alerta');
        }

        const existe = await TipoTelaModelo.findOne({
            where: {
                NombreTipoTela,
                CodigoTipoTela: { [Op.ne]: codigo }
            }
        });

        if (existe) {
            LanzarError('Ya existe un tipo de tela con ese nombre', 400, 'Alerta');
        }

        await tipo.update({
            NombreTipoTela
        });

        return {
            CodigoTipoTela: tipo.CodigoTipoTela,
            NombreTipoTela: tipo.NombreTipoTela
        };

    } catch (error) {
        throw error;
    }
};

const EditarTela = async (codigo, data) => {
    try {

        const { CodigoTipoTela, NombreTela } = data;

        const tela = await TelaModelo.findByPk(codigo);

        if (!tela) {
            LanzarError('Tela no encontrada', 404, 'Alerta');
        }

        if (CodigoTipoTela) {
            const tipoTela = await TipoTelaModelo.findByPk(CodigoTipoTela);

            if (!tipoTela) {
                LanzarError('El tipo de tela no existe', 400, 'Alerta');
            }
        }

        if (NombreTela) {
            const existe = await TelaModelo.findOne({
                where: {
                    NombreTela,
                    CodigoTela: { [Op.ne]: codigo }
                }
            });

            if (existe) {
                LanzarError('Ya existe una tela con ese nombre', 400, 'Alerta');
            }
        }

        await tela.update({
            CodigoTipoTela,
            NombreTela
        });

        return {
            CodigoTela: tela.CodigoTela,
            CodigoTipoTela: tela.CodigoTipoTela,
            NombreTela: tela.NombreTela
        };

    } catch (error) {
        console.error(error);
        throw error;
    }
};
// ELIMINAR
const EliminarTipoTela = async (codigo) => {
    try {

        const tipo = await TipoTelaRelacion.findOne({
            where: {
                CodigoTipoTela: codigo
            }
        });

        if (!tipo) {
            LanzarError('Tipo de tela no encontrado', 404, 'Alerta');
        }

        // eliminación física
        await TipoTelaRelacion.destroy({
            where: {
                CodigoTipoTela: codigo
            }
        });

        return {
            message: 'Tipo de tela eliminado correctamente'
        };

    } catch (error) {
        throw error;
    }
};

const EliminarTela = async (codigo) => {
    try {

        const tela = await TelaModelo.findOne({
            where: {
                CodigoTela: codigo,
                Estatus: 1
            }
        });

        if (!tela) {
            LanzarError('Tela no encontrada', 404, 'Alerta');
        }

        await tela.update({
            Estatus: 0
        });

        return {
            message: 'Tela eliminada correctamente'
        };

    } catch (error) {

        throw error;
    }
};
module.exports = {
    EliminarTipoTela, EliminarTela,
    CrearProductoInventario,
    ObtenerInventarioListado,
    ObtenerInventarioPorCodigo,
    RestaurarInventario,
    EliminarInventario,
    ObtenerInventarioEliminados,
    ActualizarProductoInventario, ListadoTipoTela, ListadoNombreTela,
    CrearTipoTela,
    EditarTipoTela,
    ObtenerTipoTelaPorCodigo,
    CrearTela, ListadoNombreTelaCompleto,
    EditarTela, ListadoProducto,
    ObtenerTelaPorCodigo, CrearVariacionInventario

};