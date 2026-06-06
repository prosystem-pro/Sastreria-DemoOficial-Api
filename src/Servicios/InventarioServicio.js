const Sequelize = require('sequelize');
const BaseDatos = require('../BaseDatos/ConexionBaseDatos');

const InventarioModelo = require('../Modelos/Inventario')(BaseDatos, Sequelize.DataTypes);
const ProductoModelo = require('../Modelos/Producto')(BaseDatos, Sequelize.DataTypes);
const TipoProductoModelo = require('../Modelos/TipoProducto')(BaseDatos, Sequelize.DataTypes);
const EstiloModelo = require('../Modelos/Estilo')(BaseDatos, Sequelize.DataTypes);
const MarcaModelo = require('../Modelos/Marca')(BaseDatos, Sequelize.DataTypes);
const TallaModelo = require('../Modelos/Talla')(BaseDatos, Sequelize.DataTypes);
const ColorModelo = require('../Modelos/Color')(BaseDatos, Sequelize.DataTypes);
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
} = require('../Relaciones/Relaciones');

const ObtenerInventarioListado = async (CodigoEmpresa) => {
    try {
        if (!CodigoEmpresa) LanzarError('Empresa es requerida', 400);

        const Inventario = await InventarioRelacion.findAll({
            where: {
                CodigoEmpresa,
                Estatus: { [Op.in]: [1, 2] }
            },
            attributes: [
                'CodigoInventario',
                'CodigoBarras',
                'PrecioVenta',
                'StockActual',
                'Estatus'
            ],
            include: [
                {
                    model: ProductoRelacion,
                    as: 'Producto',
                    attributes: [
                        'CodigoProducto',
                        'NombreProducto',
                        'CodigoTipoProducto'
                    ],
                    required: true,
                    where: { CodigoTipoProducto: 1 },
                    include: [
                        {
                            model: TipoProductoRelacion,
                            as: 'TipoProducto',
                            attributes: [
                                'CodigoTipoProducto',
                                'NombreTipoProducto'
                            ],
                            required: true
                        }
                    ]
                },
                { model: MarcaRelacion, as: 'Marca', attributes: ['NombreMarca'] },
                { model: EstiloRelacion, as: 'Estilo', attributes: ['NombreEstilo'] },
                { model: TallaRelacion, as: 'Talla', attributes: ['NombreTalla'] },
                { model: ColorRelacion, as: 'Color', attributes: ['NombreColor'] }
            ],
            order: [['CodigoInventario', 'DESC']]
        });

        const resultado = Inventario.map(item => ({
            CodigoInventario: item.CodigoInventario,
            Producto: item.Producto?.NombreProducto || 'Sin producto',
            TipoProducto: item.Producto?.TipoProducto?.NombreTipoProducto || 'Sin tipo',
            CodigoBarra: item.CodigoBarras,
            Marca: item.Marca?.NombreMarca || 'Sin marca',
            Diseno: item.Estilo?.NombreEstilo || 'Sin estilo',
            Talla: item.Talla?.NombreTalla || 'Sin talla',
            Color: item.Color?.NombreColor || 'Sin color',
            PrecioVenta: item.PrecioVenta,
            StockActual: item.StockActual,
            Estatus: item.Estatus
        }));

        return resultado;

    } catch (error) {
        console.error('Error en ObtenerInventarioListado:', error);
        throw error;
    }
};
const CrearProductoInventario = async (Datos, CodigoUsuario) => {

    const Transaccion = await BaseDatos.transaction();

    try {

        let {
            Producto,
            CodigoTipoProducto,
            CodigoMarca,
            CodigoEstilo,
            CodigoTalla,
            CodigoColor,
            CodigoBarra,
            Precio,
            Stock,
            CodigoEmpresa,
            CodigoCategoria
        } = Datos;

        // =========================
        // VALIDACIONES
        // =========================
        Producto = NormalizarTexto(Producto);

        if (!Producto)
            LanzarError('Producto es requerido', 400);

        if (!CodigoTipoProducto)
            LanzarError('Tipo de producto es requerido', 400);

        if (!CodigoMarca)
            LanzarError('Marca es requerida', 400);

        if (!CodigoEstilo)
            LanzarError('Diseño es requerido', 400);

        if (!CodigoTalla)
            LanzarError('Talla es requerida', 400);

        if (!CodigoColor)
            LanzarError('Color es requerido', 400);

        Precio = NormalizarPrecio(Precio);
        Stock = NormalizarStock(Stock);

        if (!CodigoEmpresa)
            LanzarError('Empresa es requerida', 400);

        if (!CodigoUsuario)
            LanzarError('Usuario es requerido', 400);

        // =========================
        // 1. BUSCAR PRODUCTO
        // =========================

        let ProductoDB = await ProductoModelo.findOne({
            where: {
                NombreProducto: Producto,
                CodigoEmpresa: CodigoEmpresa
            },
            transaction: Transaccion
        });

        // =========================
        // 2. CREAR O ACTUALIZAR PRODUCTO
        // =========================

        if (!ProductoDB) {

            ProductoDB = await ProductoModelo.create({
                CodigoEmpresa,
                CodigoTipoProducto,
                CodigoCategoria,
                NombreProducto: Producto,
                PrecioBase: Precio,
                Estatus: 1
            }, { transaction: Transaccion });

        } else {

            await ProductoDB.update({
                CodigoTipoProducto,
                CodigoCategoria,
                PrecioBase: Precio
            }, { transaction: Transaccion });

        }

        // =========================
        // 3. VALIDAR INVENTARIO DUPLICADO
        // =========================

        const ExisteInventario = await InventarioModelo.findOne({
            where: {
                CodigoEmpresa,
                CodigoProducto: ProductoDB.CodigoProducto,
                CodigoMarca,
                CodigoEstilo,
                CodigoTalla,
                CodigoColor
            },
            transaction: Transaccion
        });

        if (ExisteInventario) {

            if ([1, 2].includes(ExisteInventario.Estatus)) {
                LanzarError('Este producto ya existe', 400);
            }

            if (ExisteInventario.Estatus === 3) {
                LanzarError(
                    'El producto ya existe en registros eliminados. Debe restaurarlo desde Productos Eliminados.',
                    400
                );
            }
        }

        // =========================
        // 4. CREAR INVENTARIO
        // =========================

        const InventarioDB = await InventarioModelo.create({
            CodigoEmpresa,
            CodigoProducto: ProductoDB.CodigoProducto,
            CodigoMarca,
            CodigoEstilo,
            CodigoTalla,
            CodigoColor,
            CodigoBarras: CodigoBarra,
            PrecioVenta: Precio,
            StockActual: Stock,
            StockMinimo: 0,
            StockMaximo: 0,
            Estatus: 1
        }, { transaction: Transaccion });

        // =========================
        // 5. MOVIMIENTO INVENTARIO
        // =========================

        await MovimientoInventarioModelo.create({
            CodigoEmpresa,
            CodigoInventario: InventarioDB.CodigoInventario,
            TipoMovimiento: 'ENTRADA',
            OrigenMovimiento: 'CREACION',
            CodigoDocumento: null,
            Cantidad: Stock,
            StockAnterior: 0,
            StockNuevo: Stock,
            Observacion: 'Creación inicial de inventario',
            CodigoUsuario,
            FechaMovimiento: new Date()
        }, { transaction: Transaccion });

        // =========================
        // 6. COMMIT
        // =========================

        await Transaccion.commit();

        return InventarioDB;

    } catch (error) {

        await Transaccion.rollback();

        if (error.name === 'SequelizeUniqueConstraintError') {
            LanzarError('Este producto ya existe', 400);
        }

        throw error;

    }
};
const NormalizarTexto = (texto) => {
    return texto
        .trim() // quita espacios extremos
        .normalize("NFD") // separa tildes
        .replace(/[\u0300-\u036f]/g, "") // elimina tildes
        .replace(/[^a-zA-Z\s]/g, "") // solo letras y espacios
        .replace(/\s+/g, " ") // quita espacios dobles
        .toLowerCase()
        .replace(/\b\w/g, l => l.toUpperCase()); // Primera mayúscula por palabra
};
const NormalizarPrecio = (precio) => {

    if (precio === undefined || precio === null)
        LanzarError('Precio es requerido', 400);

    // Convertir a número
    const numero = Number(precio);

    // Validar que sea número válido
    if (isNaN(numero))
        LanzarError('Precio debe ser numérico', 400);

    // Validar positivo
    if (numero < 0)
        LanzarError('Precio no puede ser negativo', 400);

    // Validar máximo 2 decimales
    if (!/^\d+(\.\d{1,2})?$/.test(precio.toString()))
        LanzarError('Precio debe tener máximo 2 decimales', 400);

    return Number(numero.toFixed(2));
};
const NormalizarStock = (stock) => {

    if (stock === undefined || stock === null)
        LanzarError('Stock es requerido', 400);

    const numero = Number(stock);

    // No es número
    if (isNaN(numero))
        LanzarError('Stock debe ser un número', 400);

    // No es entero
    if (!Number.isInteger(numero))
        LanzarError('Stock no permite decimales', 400);

    // Negativo
    if (numero < 0)
        LanzarError('Stock debe ser un número positivo', 400);

    return numero;
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
                    attributes: ['CodigoProducto', 'NombreProducto', 'CodigoTipoProducto'], // Añadimos Código de TipoProducto
                    include: [
                        {
                            model: TipoProductoModelo,
                            as: 'TipoProducto',
                            attributes: ['CodigoTipoProducto', 'NombreTipoProducto']
                        }
                    ]
                },
                {
                    model: MarcaRelacion,
                    as: 'Marca',
                    attributes: ['CodigoMarca', 'NombreMarca']
                },
                {
                    model: EstiloRelacion,
                    as: 'Estilo',
                    attributes: ['CodigoEstilo', 'NombreEstilo']
                },
                {
                    model: TallaRelacion,
                    as: 'Talla',
                    attributes: ['CodigoTalla', 'NombreTalla']
                },
                {
                    model: ColorRelacion,
                    as: 'Color',
                    attributes: ['CodigoColor', 'NombreColor']
                }
            ]
        });

        if (!Inventario) LanzarError('Inventario no encontrado', 404);

        return {
            CodigoInventario: Inventario.CodigoInventario,
            CodigoProducto: Inventario.Producto?.CodigoProducto,
            Producto: Inventario.Producto?.NombreProducto,
            CodigoTipoProducto: Inventario.Producto?.TipoProducto?.CodigoTipoProducto,
            TipoProducto: Inventario.Producto?.TipoProducto?.NombreTipoProducto,
            CodigoMarca: Inventario.Marca?.CodigoMarca,
            Marca: Inventario.Marca?.NombreMarca,
            CodigoEstilo: Inventario.Estilo?.CodigoEstilo,
            Diseno: Inventario.Estilo?.NombreEstilo,
            CodigoTalla: Inventario.Talla?.CodigoTalla,
            Talla: Inventario.Talla?.NombreTalla,
            CodigoColor: Inventario.Color?.CodigoColor,
            Color: Inventario.Color?.NombreColor,
            CodigoBarra: Inventario.CodigoBarras,
            PrecioVenta: Inventario.PrecioVenta,
            StockActual: Inventario.StockActual,
            Estatus: Inventario.Estatus,
            CodigoEmpresa: Inventario.CodigoEmpresa
        };

    } catch (error) {
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

const ObtenerInventarioEliminados = async (CodigoEmpresa) => {
    try {

        if (!CodigoEmpresa)
            LanzarError('Empresa es requerida', 400);

        const Inventario = await InventarioRelacion.findAll({

            where: {
                CodigoEmpresa,
                Estatus: 3   // 🔹 solo eliminados
            },

            attributes: [
                'CodigoInventario',
                'CodigoBarras',
                'PrecioVenta',
                'StockActual'
            ],

            include: [
                {
                    model: ProductoRelacion,
                    as: 'Producto',
                    attributes: [
                        'CodigoProducto',
                        'NombreProducto',
                        'CodigoTipoProducto'
                    ],
                    required: true,
                    where: {
                        CodigoTipoProducto: 1   // 🔹 SOLO TIPO PRODUCTO 1
                    }
                },

                {
                    model: MarcaRelacion,
                    as: 'Marca',
                    attributes: ['NombreMarca']
                },

                {
                    model: EstiloRelacion,
                    as: 'Estilo',
                    attributes: ['NombreEstilo']
                },

                {
                    model: TallaRelacion,
                    as: 'Talla',
                    attributes: ['NombreTalla']
                },

                {
                    model: ColorRelacion,
                    as: 'Color',
                    attributes: ['NombreColor']
                }
            ],

            order: [['CodigoInventario', 'DESC']]
        });

        return Inventario.map(item => ({

            CodigoInventario: item.CodigoInventario,

            Producto: item.Producto?.NombreProducto || 'Sin producto',

            CodigoBarra: item.CodigoBarras,

            Marca: item.Marca?.NombreMarca || 'Sin marca',

            Diseno: item.Estilo?.NombreEstilo || 'Sin estilo',

            Talla: item.Talla?.NombreTalla || 'Sin talla',

            Color: item.Color?.NombreColor || 'Sin color',

            PrecioVenta: item.PrecioVenta,

            StockActual: item.StockActual

        }));

    } catch (error) {

        console.error('Error en ObtenerInventarioEliminados:', error);
        throw error;

    }
};
const ActualizarProductoInventario = async (CodigoInventario, Datos, CodigoUsuario) => {

    const Transaccion = await BaseDatos.transaction();

    try {

        let {
            Producto,
            CodigoTipoProducto,
            CodigoMarca,
            CodigoEstilo,
            CodigoTalla,
            CodigoColor,
            CodigoBarra,
            Precio,
            Stock,
            CodigoEmpresa,
            CodigoCategoria,
            Estatus
        } = Datos;

        // =========================
        // VALIDACIONES
        // =========================
        Producto = NormalizarTexto(Producto);

        if (!CodigoInventario)
            LanzarError('Código de inventario es requerido', 400);

        if (!Producto)
            LanzarError('Producto es requerido', 400);

        if (!CodigoTipoProducto)
            LanzarError('Tipo de producto es requerido', 400);

        if (!CodigoMarca)
            LanzarError('Marca es requerida', 400);

        if (!CodigoEstilo)
            LanzarError('Diseño es requerido', 400);

        if (!CodigoTalla)
            LanzarError('Talla es requerida', 400);

        if (!CodigoColor)
            LanzarError('Color es requerido', 400);

        Precio = NormalizarPrecio(Precio);

        Stock = NormalizarStock(Stock);

        if (!CodigoEmpresa)
            LanzarError('Empresa es requerida', 400);

        if (!CodigoUsuario)
            LanzarError('Usuario es requerido', 400);

        if (Estatus === undefined || Estatus === null)
            LanzarError('Estatus es requerido', 400);

        // =========================
        // 1. BUSCAR PRODUCTO
        // =========================

        let ProductoDB = await ProductoModelo.findOne({
            where: {
                NombreProducto: Producto,
                CodigoEmpresa: CodigoEmpresa
            },
            transaction: Transaccion
        });

        // =========================
        // 2. CREAR O ACTUALIZAR PRODUCTO
        // =========================

        if (!ProductoDB) {

            ProductoDB = await ProductoModelo.create({
                CodigoEmpresa,
                CodigoTipoProducto,
                CodigoCategoria,
                NombreProducto: Producto,
                PrecioBase: Precio,
                Estatus: 1 // crear siempre activo
            }, { transaction: Transaccion });

        } else {

            await ProductoDB.update({
                CodigoTipoProducto,
                CodigoCategoria,
                PrecioBase: Precio,
                Estatus: Estatus
            }, { transaction: Transaccion });

        }

        // =========================
        // 3. BUSCAR INVENTARIO
        // =========================

        const InventarioDB = await InventarioModelo.findOne({
            where: { CodigoInventario },
            transaction: Transaccion
        });

        if (!InventarioDB)
            LanzarError('Inventario no encontrado', 404);

        // =========================
        // 4. VALIDAR DUPLICADO
        // =========================

        const ExisteOtroInventario = await InventarioModelo.findOne({
            where: {
                CodigoEmpresa,
                CodigoProducto: ProductoDB.CodigoProducto,
                CodigoMarca,
                CodigoEstilo,
                CodigoTalla,
                CodigoColor,
                CodigoInventario: { [Op.ne]: CodigoInventario }
            },
            transaction: Transaccion
        });

        if (ExisteOtroInventario) {
            LanzarError(
                'Otro inventario ya existe con la misma combinación',
                400
            );
        }

        // =========================
        // 5. ACTUALIZAR INVENTARIO
        // =========================

        const StockAnterior = InventarioDB.StockActual;

        await InventarioDB.update({
            CodigoProducto: ProductoDB.CodigoProducto,
            CodigoMarca,
            CodigoEstilo,
            CodigoTalla,
            CodigoColor,
            CodigoBarras: CodigoBarra,
            PrecioVenta: Precio,
            StockActual: Stock,
            Estatus: Estatus
        }, { transaction: Transaccion });

        // =========================
        // 6. MOVIMIENTO INVENTARIO
        // =========================

        if (StockAnterior !== Stock) {

            await MovimientoInventarioModelo.create({
                CodigoEmpresa,
                CodigoInventario: InventarioDB.CodigoInventario,
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

        // =========================
        // 7. COMMIT
        // =========================

        await Transaccion.commit();

        return InventarioDB;

    } catch (error) {

        await Transaccion.rollback();
        throw error;

    }
};


const ListadoTipoProducto = async () => {
    try {
        // Obtenemos todos los tipos de producto activos (Estatus = 1)
        const tipos = await TipoProductoModelo.findAll({
            where: { Estatus: 1 },
            attributes: ['CodigoTipoProducto', 'NombreTipoProducto'],
            order: [['NombreTipoProducto', 'ASC']]
        });

        // Mapear al formato que queremos enviar al frontend
        return tipos.map(t => ({
            CodigoTipoProducto: t.CodigoTipoProducto,
            NombreTipoProducto: t.NombreTipoProducto
        }));

    } catch (error) {
        console.error('Error en ListadoTipoProducto:', error);
        LanzarError('Error al obtener tipos de producto', 500, 'Error');
    }
};
//LISTADOS
const ListadoMarca = async () => {

    try {

        const marcas = await MarcaModelo.findAll({

            where: {
                Estatus: 1
            },

            attributes: [
                'CodigoMarca',
                'NombreMarca'
            ],

            order: [['NombreMarca', 'ASC']]

        });

        return marcas.map(m => ({
            CodigoMarca: m.CodigoMarca,
            NombreMarca: m.NombreMarca
        }));

    } catch (error) {

        console.error(error);

        LanzarError('Error al obtener marcas', 500, 'Error');

    }

};

const ListadoEstilo = async () => {

    try {

        const estilos = await EstiloModelo.findAll({

            where: {
                Estatus: 1
            },

            attributes: [
                'CodigoEstilo',
                'NombreEstilo'
            ],

            order: [['NombreEstilo', 'ASC']]

        });

        return estilos.map(e => ({
            CodigoEstilo: e.CodigoEstilo,
            NombreEstilo: e.NombreEstilo
        }));

    } catch (error) {

        console.error(error);

        LanzarError('Error al obtener estilos', 500, 'Error');

    }

};

const ListadoTalla = async () => {

    try {

        const tallas = await TallaModelo.findAll({

            where: {
                Estatus: 1
            },

            attributes: [
                'CodigoTalla',
                'NombreTalla'
            ],

            order: [['NombreTalla', 'ASC']]

        });

        return tallas.map(t => ({
            CodigoTalla: t.CodigoTalla,
            NombreTalla: t.NombreTalla
        }));

    } catch (error) {

        console.error(error);

        LanzarError('Error al obtener tallas', 500, 'Error');

    }

};

const ListadoColor = async () => {

    try {

        const colores = await ColorModelo.findAll({

            where: {
                Estatus: 1
            },

            attributes: [
                'CodigoColor',
                'NombreColor'
            ],

            order: [['NombreColor', 'ASC']]

        });

        return colores.map(c => ({
            CodigoColor: c.CodigoColor,
            NombreColor: c.NombreColor
        }));

    } catch (error) {

        console.error(error);

        LanzarError('Error al obtener colores', 500, 'Error');

    }

};
//CREAR
const CrearMarca = async (NombreMarca) => {

    try {

        const existe = await MarcaModelo.findOne({
            where: {
                NombreMarca,
                Estatus: 1
            }
        });

        if (existe) {
            return LanzarError('La marca ya existe', 400, 'Alerta');
        }

        const nuevaMarca = await MarcaModelo.create({
            NombreMarca,
            Estatus: 1
        });

        return {
            CodigoMarca: nuevaMarca.CodigoMarca,
            NombreMarca: nuevaMarca.NombreMarca
        };

    } catch (error) {

        console.error(error);

        if (error.name === 'SequelizeUniqueConstraintError') {
            return LanzarError('La marca ya existe', 400, 'Alerta');
        }

        throw error;
    }

};

const CrearEstilo = async (NombreEstilo) => {

    try {

        const nuevoEstilo = await EstiloModelo.create({
            NombreEstilo,
            Estatus: 1
        });

        return {
            CodigoEstilo: nuevoEstilo.CodigoEstilo,
            NombreEstilo: nuevoEstilo.NombreEstilo
        };

    } catch (error) {

        console.error(error);

        if (error.name === 'SequelizeUniqueConstraintError') {
            return LanzarError('El estilo ya existe', 400, 'Alerta');
        }

        throw error;
    }

};
const CrearTalla = async (NombreTalla) => {

    try {

        const nuevaTalla = await TallaModelo.create({
            NombreTalla,
            Estatus: 1
        });

        return {
            CodigoTalla: nuevaTalla.CodigoTalla,
            NombreTalla: nuevaTalla.NombreTalla
        };

    } catch (error) {

        console.error(error);

        if (error.name === 'SequelizeUniqueConstraintError') {
            return LanzarError('La talla ya existe', 400, 'Alerta');
        }

        throw error;
    }

};

const CrearColor = async (NombreColor) => {

    try {

        const nuevoColor = await ColorModelo.create({
            NombreColor,
            Estatus: 1
        });

        return {
            CodigoColor: nuevoColor.CodigoColor,
            NombreColor: nuevoColor.NombreColor
        };

    } catch (error) {

        console.error(error);

        if (error.name === 'SequelizeUniqueConstraintError') {
            return LanzarError('El color ya existe', 400, 'Alerta');
        }

        throw error;
    }

};
//OBTENER POR CODIGO
const ObtenerMarcaPorCodigo = async (CodigoMarca) => {

    try {

        const marca = await MarcaModelo.findByPk(CodigoMarca);

        if (!marca) {
            LanzarError('Marca no encontrada', 404, 'Error');
        }

        return {
            CodigoMarca: marca.CodigoMarca,
            NombreMarca: marca.NombreMarca
        };

    } catch (error) {

        console.error(error);
        LanzarError('Error al obtener marca', 500, 'Error');

    }

};

const ObtenerEstiloPorCodigo = async (CodigoEstilo) => {

    try {

        const estilo = await EstiloModelo.findByPk(CodigoEstilo);

        if (!estilo) {
            LanzarError('Estilo no encontrado', 404, 'Error');
        }

        return {
            CodigoEstilo: estilo.CodigoEstilo,
            NombreEstilo: estilo.NombreEstilo
        };

    } catch (error) {

        console.error(error);
        LanzarError('Error al obtener estilo', 500, 'Error');

    }

};

const ObtenerTallaPorCodigo = async (CodigoTalla) => {

    try {

        const talla = await TallaModelo.findByPk(CodigoTalla);

        if (!talla) {
            LanzarError('Talla no encontrada', 404, 'Error');
        }

        return {
            CodigoTalla: talla.CodigoTalla,
            NombreTalla: talla.NombreTalla
        };

    } catch (error) {

        console.error(error);
        LanzarError('Error al obtener talla', 500, 'Error');

    }

};

const ObtenerColorPorCodigo = async (CodigoColor) => {

    try {

        const color = await ColorModelo.findByPk(CodigoColor);

        if (!color) {
            LanzarError('Color no encontrado', 404, 'Error');
        }

        return {
            CodigoColor: color.CodigoColor,
            NombreColor: color.NombreColor
        };

    } catch (error) {

        console.error(error);
        LanzarError('Error al obtener color', 500, 'Error');

    }

};

//EDITAR
const ActualizarMarca = async (CodigoMarca, NombreMarca) => {

    try {

        const marca = await MarcaModelo.findByPk(CodigoMarca);

        if (!marca) {
            return LanzarError('Marca no encontrada', 404, 'Error');
        }

        marca.NombreMarca = NombreMarca;

        await marca.save();

        return {
            CodigoMarca: marca.CodigoMarca,
            NombreMarca: marca.NombreMarca
        };

    } catch (error) {

        console.error(error);

        if (error.name === 'SequelizeUniqueConstraintError') {
            return LanzarError('La marca ya existe', 400, 'Alerta');
        }

        throw error;
    }

};
const ActualizarEstilo = async (CodigoEstilo, NombreEstilo) => {

    try {

        const estilo = await EstiloModelo.findByPk(CodigoEstilo);

        if (!estilo) {
            return LanzarError('Estilo no encontrado', 404, 'Error');
        }

        estilo.NombreEstilo = NombreEstilo;

        await estilo.save();

        return {
            CodigoEstilo: estilo.CodigoEstilo,
            NombreEstilo: estilo.NombreEstilo
        };

    } catch (error) {

        console.error(error);

        if (error.name === 'SequelizeUniqueConstraintError') {
            return LanzarError('El estilo ya existe', 400, 'Alerta');
        }

        throw error;
    }

};

const ActualizarTalla = async (CodigoTalla, NombreTalla) => {

    try {

        const talla = await TallaModelo.findByPk(CodigoTalla);

        if (!talla) {
            return LanzarError('Talla no encontrada', 404, 'Error');
        }

        talla.NombreTalla = NombreTalla;

        await talla.save();

        return {
            CodigoTalla: talla.CodigoTalla,
            NombreTalla: talla.NombreTalla
        };

    } catch (error) {

        console.error(error);

        if (error.name === 'SequelizeUniqueConstraintError') {
            return LanzarError('La talla ya existe', 400, 'Alerta');
        }

        throw error;
    }

};

const ActualizarColor = async (CodigoColor, NombreColor) => {

    try {

        const color = await ColorModelo.findByPk(CodigoColor);

        if (!color) {
            return LanzarError('Color no encontrado', 404, 'Error');
        }

        color.NombreColor = NombreColor;

        await color.save();

        return {
            CodigoColor: color.CodigoColor,
            NombreColor: color.NombreColor
        };

    } catch (error) {

        console.error(error);

        if (error.name === 'SequelizeUniqueConstraintError') {
            return LanzarError('El color ya existe', 400, 'Alerta');
        }

        throw error;
    }

};

module.exports = {
    CrearProductoInventario, ListadoMarca, ListadoEstilo, ListadoTalla,
    ListadoColor, ListadoTipoProducto, ObtenerInventarioListado, EliminarInventario,
    ObtenerInventarioEliminados, RestaurarInventario, ObtenerInventarioPorCodigo, ActualizarProductoInventario,
    CrearMarca, CrearEstilo, CrearTalla, CrearColor, ActualizarMarca, ActualizarEstilo, ActualizarTalla, ActualizarColor,
    ObtenerMarcaPorCodigo, ObtenerEstiloPorCodigo, ObtenerTallaPorCodigo, ObtenerColorPorCodigo
};