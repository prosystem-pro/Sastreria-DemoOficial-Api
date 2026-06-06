const Sequelize = require('sequelize');
const BaseDatos = require('../BaseDatos/ConexionBaseDatos');
const { GenerarDocumento } = require('../Utilidades/GeneradorDocumento');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const EmpresaModelo = require('../Modelos/Empresa')(BaseDatos, Sequelize.DataTypes);
const FormaPago = require('../Modelos/FormaPago')(BaseDatos, Sequelize.DataTypes);

const {
    InventarioModelo: InventarioRelacion,
    ProductoModelo: ProductoRelacion,
    PedidoModelo,
    PedidoDetalleModelo,
    PagoModelo,
    PagoAplicacionModelo,
    EstadoPedidoModelo,
    MovimientoInventarioModelo,
    UsuarioModelo,
    ClienteModelo,
    TipoProductoModelo
} = require('../Relaciones/Relaciones');

const { UTCAGuatemala_FechaHora,
    FormatoFecha,
    GuatemalaAUTC,
    FormatoFechaDesdeDateTime, RangoGuatemalaAUTC } = require('../Utilidades/ConversionFechas');

const { Op } = require('sequelize');
const { LanzarError } = require('../Utilidades/ErrorServicios');
const ObtenerDatosImpresion = async (CodigoPedido) => {

    try {

        if (!CodigoPedido)
            LanzarError('El código de venta es obligatorio', 400, 'Advertencia');

        // ================= EMPRESA =================
        const empresa = await EmpresaModelo.findOne({
            where: { CodigoEmpresa: 1, Estatus: 1 }
        });

        if (!empresa)
            LanzarError('Empresa no encontrada', 404);

        // ================= VENTA / PEDIDO =================
        const venta = await ObtenerVenta(Number(CodigoPedido));

        if (!venta)
            LanzarError('Venta no encontrada', 404);

        // ================= CLIENTE =================
        const cliente = await ClienteModelo.findOne({
            where: {
                CodigoCliente: venta.CodigoCliente,
                Estatus: 1
            }
        });

        if (!cliente)
            LanzarError('Cliente no encontrado', 404);

        // ================= FORMAS DE PAGO =================
        const formasPagoDB = await FormaPago.findAll({
            attributes: ['CodigoFormaPago', 'NombreFormaPago']
        });

        const mapaFormaPago = {};
        formasPagoDB.forEach(f => {
            mapaFormaPago[f.CodigoFormaPago] = f.NombreFormaPago;
        });

        // ================= PAGOS =================
        const pagosDB = await PagoAplicacionModelo.findAll({
            where: {
                CodigoDocumento: CodigoPedido,
                TipoDocumento: ['VENTA', 'PEDIDO']
            },
            include: [
                {
                    model: PagoModelo,
                    as: 'FnPago',
                    where: { Estatus: 1 },
                    required: false
                }
            ]
        });

        // ================= ABONOS =================
        let Abono = 0;

        pagosDB.forEach(p => {
            Abono += Number(p.MontoAplicado || 0);
        });

        // ================= CLASIFICAR PAGOS =================
        let tarjetaPago = null;
        let otroPago = null;

        pagosDB.forEach(p => {

            const nombreFormaPago =
                mapaFormaPago[p.FnPago?.CodigoFormaPago] || 'Sin forma';

            const nombre = nombreFormaPago.toLowerCase();

            if (nombre.includes('tarjeta') || nombre.includes('transfer')) {

                tarjetaPago = {
                    nombre: nombreFormaPago,
                    monto: Number(p.MontoAplicado || 0),
                    numeroComprobante: p.FnPago?.NumeroComprobante || null
                };

            } else {

                otroPago = {
                    nombre: nombreFormaPago,
                    monto: Number(p.MontoAplicado || 0)
                };

            }

        });

        // ================= TOTALES =================
        const Total = Number(venta.Total || 0);
        const SaldoPendiente = Total - Abono;

        // ================= RETORNO FINAL =================
        return {

            empresa: {
                nombre: empresa.NombreEmpresa,
                nit: empresa.NIT,
                direccion: empresa.Direccion,
                telefono: empresa.Telefono,
                logo: '/public/LogoConfeccionesCreateli.png'
            },

            cliente: {
                nombre: cliente.NombreCliente,
                nit: cliente.NIT || '',
                direccion: cliente.Direccion || '',
                celular: cliente.Celular || ''
            },

            venta: {
                documento: venta.NumeroDocumento,
                // fecha: fechaVenta,

                fecha: venta.FechaCreacion || null,
                fechaEntrega: venta.FechaEntrega
                    ? FormatoFecha(venta.FechaEntrega)
                    : '',
                usuario: venta.NombreUsuario,
                estado: 'VENTA'
            },

            productos: venta.Productos.map(p => ({
                cantidad: p.Cantidad,
                nombre: p.NombreProducto,
                subtotal: p.Subtotal
            })),

            pago: tarjetaPago || otroPago,
            referencia: tarjetaPago?.numeroComprobante || null,

            // ================= TOTALES ORDENADOS =================
            totales: {
                subtotal: Number(venta.Subtotal || 0),
                descuento: Number(venta.Descuento || 0),
                abono: Abono,
                saldoPendiente: SaldoPendiente,
                total: Total
            }

        };

    } catch (error) {

        console.error(error);

        LanzarError(
            error.message || 'Error al obtener datos de impresión',
            error.statusCode || 500,
            'Error'
        );
    }
};

const ObtenerVenta = async (CodigoPedido) => {

    try {

        if (!CodigoPedido)
            LanzarError('Código de venta requerido', 400);


        const venta = await PedidoModelo.findOne({

            where: {
                CodigoPedido: CodigoPedido,
                Estatus: 1
            },

            include: [

                // ================= CLIENTE =================
                {
                    model: ClienteModelo,
                    as: 'CaCliente',
                    attributes: [
                        'CodigoCliente',
                        'NombreCliente',
                        'NIT',
                        'Direccion',
                        'Celular'
                    ]
                },

                // ================= USUARIO =================
                {
                    model: UsuarioModelo,
                    as: 'AdUsuario',
                    attributes: [
                        'CodigoUsuario',
                        'NombreUsuario'
                    ]
                },

                // ================= DETALLE =================
                {
                    model: PedidoDetalleModelo,
                    as: 'PedidoDetalles',
                    where: { Estatus: 1 },
                    required: false,
                    include: [

                        {
                            model: InventarioRelacion,
                            as: 'Inventario',
                            attributes: [
                                'CodigoInventario',
                                'CodigoProducto'
                            ],

                            include: [
                                {
                                    model: ProductoRelacion,
                                    as: 'Producto',
                                    attributes: [
                                        'CodigoProducto',
                                        'NombreProducto'
                                    ]
                                }
                            ]
                        }

                    ]
                }

            ]

        });


        if (!venta)
            return null;


        // ================= PRODUCTOS =================
        const productos = venta.PedidoDetalles.map(item => ({

            CodigoInventario: item.CodigoInventario,

            CodigoProducto: item.Inventario?.CodigoProducto || '',

            NombreProducto:
                item.Inventario?.Producto?.NombreProducto || 'Producto',

            Cantidad: item.Cantidad,

            PrecioVenta: Number(item.PrecioVenta),

            Subtotal: Number(item.Subtotal)

        }));


        // ================= PAGOS =================
        const pagos = await PagoAplicacionModelo.findAll({

            where: {
                CodigoDocumento: CodigoPedido,
                TipoDocumento: venta.TipoDocumento
            },

            include: [
                {
                    model: PagoModelo,
                    as: 'FnPago',
                    where: { Estatus: 1 },
                    required: false
                }
            ]
        });


        let totalAbonado = 0;

        pagos.forEach(p => {
            totalAbonado += Number(p.MontoAplicado || 0);
        });


        const saldoPendiente = Number(venta.Total) - totalAbonado;


        // ================= RESPUESTA =================
        return {

            CodigoPedido: venta.CodigoPedido,
            CodigoCliente: venta.CodigoCliente,

            NumeroDocumento: venta.NumeroDocumento,
            Serie: venta.Serie,
            TipoDocumento: venta.TipoDocumento,

            Subtotal: Number(venta.Subtotal),
            Descuento: Number(venta.Descuento),
            Total: Number(venta.Total),

            NombreCliente: venta.CaCliente?.NombreCliente,
            NIT: venta.CaCliente?.NIT,
            Direccion: venta.CaCliente?.Direccion,
            Celular: venta.CaCliente?.Celular,

            NombreUsuario: venta.AdUsuario?.NombreUsuario,

            Productos: productos,

            TotalAbonado: totalAbonado,
            SaldoPendiente: saldoPendiente,

            FechaCreacion: UTCAGuatemala_FechaHora(venta.FechaCreacion),
            FechaEntrega: venta.FechaEntrega || null

        };

    } catch (error) {

        console.error(error);

        LanzarError(
            error.message || 'Error al obtener venta',
            error.statusCode || 500,
            'Error'
        );
    }
};

// CREAR VENTA (USANDO PEDIDO)
const CrearVenta = async (datos, usuario) => {
    let transaction;

    try {

        if (!usuario)
            LanzarError('Usuario no autenticado', 401);

        transaction = await BaseDatos.transaction();

        const {
            CodigoCliente,
            CodigoFormaPago,
            Descuento,
            Pago,
            Subtotal,
            Total,
            Productos,
            NumeroComprobante
        } = datos;

        if (!CodigoCliente)
            LanzarError('Cliente requerido', 400);

        if (!CodigoFormaPago)
            LanzarError('Forma de pago requerida', 400);

        if (!Productos || Productos.length === 0)
            LanzarError('Debe agregar productos', 400);

        if (!Pago || Pago <= 0)
            LanzarError('Pago inválido', 400);

        const CodigoEmpresa = 1;

        // ==============================
        // GENERAR DOCUMENTO DE VENTA
        // ==============================
        const documentoVenta = await GenerarDocumento(
            'VENTA',
            CodigoEmpresa,
            transaction
        );

        if (!documentoVenta)
            LanzarError('No se pudo generar el documento de la venta', 500);


        // ==============================
        // OBTENER ESTADO VENDIDO
        // ==============================
        const estadoVenta = await EstadoPedidoModelo.findOne({
            where: {
                NombreEstadoPedido: 'VENDIDO',
                Estatus: 1
            },
            transaction
        });

        if (!estadoVenta)
            LanzarError('Estado VENDIDO no configurado', 400);


        // ==============================
        // CREAR VENTA (PEDIDO)
        // ==============================
        const venta = await PedidoModelo.create({

            CodigoEmpresa,
            CodigoCliente,
            CodigoEstadoPedido: estadoVenta.CodigoEstadoPedido,
            CodigoUsuario: usuario.CodigoUsuario,

            Serie: documentoVenta.Serie,
            TipoDocumento: documentoVenta.TipoDocumento,
            NumeroDocumento: documentoVenta.NumeroDocumento,
            Numero: documentoVenta.Numero,

            FechaCreacion: new Date(),
            FechaEntrega: new Date(),

            Subtotal,
            Descuento,
            Total,

            Observacion: 'Venta directa',
            Estatus: 1

        }, { transaction });

        const CodigoPedido = venta.CodigoPedido;


        // ==============================
        // PRODUCTOS
        // ==============================
        for (const item of Productos) {
            if (!Number.isInteger(item.Cantidad) || item.Cantidad <= 0) {
                LanzarError(`Cantidad inválida en producto ${item.CodigoInventario}`, 400);
            }
            const inventario = await InventarioRelacion.findOne({
                where: {
                    CodigoInventario: item.CodigoInventario,
                    Estatus: 1
                },
                transaction,
                lock: transaction.LOCK.UPDATE
            });

            if (!inventario)
                LanzarError(`Producto ${item.CodigoInventario} no existe`, 404);

            if (item.Cantidad > inventario.StockActual) {
                LanzarError(
                    `Stock insuficiente del producto ${item.CodigoInventario}. Disponible: ${inventario.StockActual}`,
                    400
                );
            }

            if (!inventario)
                LanzarError(`Producto ${item.CodigoInventario} no existe`, 404);

            if (inventario.StockActual < item.Cantidad)
                LanzarError(
                    `Stock insuficiente del producto ${item.CodigoInventario}`,
                    400
                );

            const stockAnterior = inventario.StockActual;
            const stockNuevo = stockAnterior - item.Cantidad;

            // =============================
            // DETALLE
            // =============================
            await PedidoDetalleModelo.create({

                CodigoPedido,
                CodigoInventario: item.CodigoInventario,
                Cantidad: item.Cantidad,
                PrecioVenta: item.PrecioVenta,
                Subtotal: item.Total,
                Estatus: 1

            }, { transaction });

            // =============================
            // ACTUALIZAR STOCK
            // =============================
            await inventario.update({
                StockActual: stockNuevo
            }, { transaction });

            // =============================
            // MOVIMIENTO INVENTARIO
            // =============================
            await MovimientoInventarioModelo.create({

                CodigoEmpresa,
                CodigoInventario: item.CodigoInventario,
                CodigoUsuario: usuario.CodigoUsuario,

                TipoMovimiento: 'SALIDA',
                OrigenMovimiento: 'VENTA',

                TipoDocumento: documentoVenta.TipoDocumento,   // 🔴 DOCUMENTO DE VENTA
                CodigoDocumento: CodigoPedido,
                NumeroDocumento: documentoVenta.NumeroDocumento,

                Cantidad: item.Cantidad,
                StockAnterior: stockAnterior,
                StockNuevo: stockNuevo,

                FechaMovimiento: new Date(),
                Observacion: `Salida por venta ${documentoVenta.NumeroDocumento}`,
                Estatus: 1,
                FechaCreacion: new Date()

            }, { transaction });

        }


        // ==============================
        // CALCULAR SALDOS
        // ==============================
        const saldoAnterior = 0;
        const saldoPendiente = Total - Pago;


        // ==============================
        // GENERAR DOCUMENTO DE PAGO
        // ==============================
        const documentoPago = await GenerarDocumento(
            'PAGO',
            CodigoEmpresa,
            transaction,
            CodigoPedido
        );

        if (!documentoPago)
            LanzarError('No se pudo generar el documento de pago', 500);


        // ==============================
        // CREAR PAGO
        // ==============================
        const pagoRegistro = await PagoModelo.create({

            CodigoEmpresa,
            CodigoFormaPago,
            CodigoUsuario: usuario.CodigoUsuario,

            Serie: documentoPago.Serie,
            TipoDocumento: documentoPago.TipoDocumento,
            NumeroDocumento: documentoPago.NumeroDocumento,
            Numero: documentoPago.Numero,

            FechaPago: new Date(),

            SaldoAnterior: saldoAnterior,
            SaldoPendiente: saldoPendiente,

            Monto: Pago,
            NumeroComprobante,

            Observacion: 'Pago de venta',
            Estatus: 1,
            FechaCreacion: new Date()

        }, { transaction });


        // ==============================
        // APLICAR PAGO A LA VENTA
        // ==============================
        await PagoAplicacionModelo.create({

            CodigoPago: pagoRegistro.CodigoPago,

            TipoDocumento: documentoVenta.TipoDocumento,  // 🔴 VENTA
            CodigoDocumento: CodigoPedido,
            NumeroDocumento: documentoVenta.NumeroDocumento,

            MontoAplicado: Pago,
            SaldoAnterior: saldoAnterior,
            SaldoPendiente: saldoPendiente,

            FechaCreacion: new Date()

        }, { transaction });


        // ==============================
        // COMMIT
        // ==============================
        await transaction.commit();

        return {

            success: true,
            message: 'Venta creada correctamente',

            data: {
                CodigoPedido,
                NumeroDocumentoVenta: documentoVenta.NumeroDocumento,
                NumeroDocumentoPago: documentoPago.NumeroDocumento
            }

        };

    } catch (error) {

        if (transaction)
            await transaction.rollback();

        console.error(error);

        LanzarError(
            error.message || 'Error al crear venta',
            error.statusCode || 500,
            'Error'
        );
    }
};

const GenerarPDFVenta = async (CodigoPedido, res) => {

    try {

        if (!CodigoPedido)
            LanzarError('El código de venta es obligatorio', 400, 'Advertencia');


        // ================= EMPRESA =================
        const empresa = await EmpresaModelo.findOne({
            where: { CodigoEmpresa: 1, Estatus: 1 }
        });

        if (!empresa)
            LanzarError('Empresa no encontrada', 404);


        // ================= VENTA =================
        const venta = await ObtenerVenta(Number(CodigoPedido));

        if (!venta)
            LanzarError('Venta no encontrada', 404);


        // ================= CLIENTE =================
        const cliente = await ClienteModelo.findOne({
            where: {
                CodigoCliente: venta.CodigoCliente,
                Estatus: 1
            }
        });

        if (!cliente)
            LanzarError('Cliente no encontrado', 404);


        // ================= FORMAS DE PAGO =================
        const formasPagoDB = await FormaPago.findAll({
            attributes: ['CodigoFormaPago', 'NombreFormaPago']
        });

        const mapaFormaPago = {};

        formasPagoDB.forEach(f => {
            mapaFormaPago[f.CodigoFormaPago] = f.NombreFormaPago;
        });


        // ================= PAGOS =================
        const pagosDB = await PagoAplicacionModelo.findAll({

            where: {
                CodigoDocumento: CodigoPedido,
                TipoDocumento: 'VENTA'
            },

            include: [
                {
                    model: PagoModelo,
                    as: 'FnPago',
                    where: { Estatus: 1 },
                    required: false
                }
            ]
        });


        let tarjetaPago = null;
        let otroPago = null;

        pagosDB.forEach(p => {

            const nombreFormaPago =
                mapaFormaPago[p.FnPago?.CodigoFormaPago] || 'Sin forma';

            if (
                nombreFormaPago.toLowerCase().includes('tarjeta') ||
                nombreFormaPago.toLowerCase().includes('transfer')
            ) {

                tarjetaPago = {
                    nombre: nombreFormaPago,
                    monto: p.MontoAplicado,
                    numeroComprobante: p.FnPago?.NumeroComprobante
                };

            } else {

                otroPago = {
                    nombre: nombreFormaPago,
                    monto: p.MontoAplicado
                };
            }
        });


        // ================= FECHAS =================
        const fechaVenta = venta.FechaCreacion;


        // ================= PDF =================
        const doc = new PDFDocument({ margin: 40 });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename=venta_${CodigoPedido}.pdf`
        );

        doc.pipe(res);

        doc.lineWidth(1);
        doc.strokeColor('#bfbfbf');


        // ================= LOGO =================
        const logoPath = path.join(
            __dirname,
            '../public/LogoConfeccionesCreateliFactura.jpeg'
        );

        if (fs.existsSync(logoPath)) {
            doc.image(logoPath, 365, 30, {
                width: 120,
                height: 80
            });
        }


        // ================= EMPRESA =================
        doc.fillColor('black')
            .font('Helvetica-Bold')
            .fontSize(18)
            .text(empresa.NombreEmpresa, 40, 40);

        doc.font('Helvetica')
            .fontSize(10)
            .text(`NIT: ${empresa.NIT}`, 40, 70)
            .text(`Dirección: ${empresa.Direccion}`, 40, 85)
            .text(`Teléfono: ${empresa.Telefono}`, 40, 100);


        // ================= TABLA CLIENTE =================
        let inicioY = 140;
        let anchoTabla = 510;
        let altoTabla = 120;
        let headerHeight = 30;

        doc.roundedRect(40, inicioY, anchoTabla, altoTabla, 6).stroke();

        doc.save()
            .roundedRect(40, inicioY, anchoTabla, headerHeight, 6)
            .clip()
            .rect(40, inicioY, anchoTabla, headerHeight)
            .fill('#e6e6e6')
            .restore();

        doc.moveTo(40, inicioY + headerHeight)
            .lineTo(550, inicioY + headerHeight)
            .stroke();

        doc.moveTo(300, inicioY + headerHeight)
            .lineTo(300, inicioY + altoTabla)
            .stroke();


        doc.font('Helvetica-Bold').fontSize(12);

        doc.text('Información del cliente', 50, inicioY + 10);
        doc.text(`Documento: ${venta.NumeroDocumento}`, 320, inicioY + 10);


        doc.font('Helvetica').fontSize(10);

        doc.text(`Cliente: ${cliente.NombreCliente}`, 50, inicioY + 40);
        doc.text(`Nit: ${cliente.NIT || ''}`, 50, inicioY + 55);
        doc.text(`Dirección: ${cliente.Direccion || ''}`, 50, inicioY + 70);
        doc.text(`Celular: ${cliente.Celular || ''}`, 50, inicioY + 85);

        doc.text(`Fecha: ${fechaVenta}`, 320, inicioY + 40);
        doc.text(`Atendió: ${venta.NombreUsuario}`, 320, inicioY + 55);
        doc.text(`Estado: VENTA`, 320, inicioY + 70);


        // ================= PRODUCTOS =================
        let y = inicioY + 150;
        let altoFila = 20;
        let alturaProductos = (venta.Productos.length + 1) * altoFila;

        doc.roundedRect(40, y, 510, alturaProductos, 6).stroke();

        doc.save()
            .roundedRect(40, y, 510, altoFila, 6)
            .clip()
            .rect(40, y, 510, altoFila)
            .fill('#e6e6e6')
            .restore();

        doc.font('Helvetica-Bold').fontSize(11);

        doc.text('CANTIDAD', 50, y + 5, {
            width: 80,
            align: 'center'
        });
        doc.text('PRODUCTO', 150, y + 5);
        doc.text('TOTAL', 400, y + 5, { width: 140, align: 'right' });

        y += altoFila;

        doc.font('Helvetica').fontSize(10);

        venta.Productos.forEach(prod => {

            // doc.moveTo(40, y)
            //     .lineTo(550, y)
            //     .stroke();


            doc.text(String(prod.Cantidad), 40, y + 5, {
                width: 80,
                align: 'center'
            });

            doc.text(prod.NombreProducto, 150, y + 5, {
                width: 220
            });

            doc.text(
                `Q ${prod.Subtotal.toFixed(2)}`,
                400,
                y + 5,
                { width: 140, align: 'right' }
            );

            y += altoFila;
        });


        // ================= TOTALES DOS COLUMNAS =================
        let totalesY = y + 25;

        let xIzqLabel = 40;
        let xIzqMonto = 140;

        let xDerLabel = 380;
        let xDerMonto = 430;
        let anchoMonto = 120;

        // bajar una fila pagos
        let offsetPago = 15;


        // ===== FORMA DE PAGO (SIEMPRE) =====
        let formaPagoMostrar = tarjetaPago || otroPago;

        if (formaPagoMostrar) {

            doc.font('Helvetica-Bold')
                .text(
                    `${formaPagoMostrar.nombre.toUpperCase()}:`,
                    xIzqLabel,
                    totalesY + offsetPago
                );

            doc.font('Helvetica')
                .text(
                    `Q ${formaPagoMostrar.monto.toFixed(2)}`,
                    xIzqMonto,
                    totalesY + offsetPago
                );
        }


        // ===== DERECHA FILA 1 =====
        doc.font('Helvetica')
            .text('Subtotal:', xDerLabel, totalesY);

        doc.text(
            `Q ${venta.Subtotal.toFixed(2)}`,
            xDerMonto,
            totalesY,
            { width: anchoMonto, align: 'right' }
        );


        totalesY += 15;


        // ===== REFERENCIA SOLO TARJETA =====
        if (tarjetaPago?.numeroComprobante) {

            doc.font('Helvetica-Bold')
                .text(
                    'REFERENCIA:',
                    xIzqLabel,
                    totalesY + offsetPago
                );

            doc.font('Helvetica')
                .text(
                    tarjetaPago.numeroComprobante,
                    xIzqMonto,
                    totalesY + offsetPago
                );
        }


        // ===== DERECHA FILA 2 =====
        doc.text(
            `Descuento (${venta.Descuento || 0}%):`,
            xDerLabel,
            totalesY
        );

        doc.text(
            `Q ${(
                venta.Subtotal * ((venta.Descuento || 0) / 100)
            ).toFixed(2)}`,
            xDerMonto,
            totalesY,
            { width: anchoMonto, align: 'right' }
        );


        totalesY += 15;


        // ===== TOTAL =====
        doc.font('Helvetica-Bold');

        doc.text('Total de la venta:', xDerLabel, totalesY);

        doc.text(
            `Q ${venta.Total.toFixed(2)}`,
            xDerMonto,
            totalesY,
            { width: anchoMonto, align: 'right' }
        );


        doc.end();

    } catch (error) {

        console.error(error);

        LanzarError(
            error.message || 'Error al generar PDF de la venta',
            error.statusCode || 500,
            'Error'
        );
    }
};
// ELIMINAR VENTA
const EliminarVenta = async (CodigoPedido, usuario) => {

    let transaction;

    try {

        // =============================
        // VALIDACIONES
        // =============================

        if (!usuario)
            LanzarError('Usuario no autenticado', 401);

        if (!CodigoPedido)
            LanzarError('Código de venta requerido', 400);


        // =============================
        // INICIAR TRANSACCION
        // =============================

        transaction = await BaseDatos.transaction();


        // =============================
        // OBTENER VENTA
        // =============================

        const venta = await PedidoModelo.findOne({

            where: {
                CodigoPedido: CodigoPedido,
                Estatus: 1
            },

            include: [
                {
                    model: PedidoDetalleModelo,
                    as: 'PedidoDetalles',
                    attributes: [
                        'CodigoPedidoDetalle',
                        'CodigoInventario',
                        'Cantidad'
                    ],
                    required: false
                }
            ],

            transaction

        });

        if (!venta)
            LanzarError('Venta no encontrada', 404);


        // =============================
        // DEVOLVER STOCK
        // =============================

        for (const detalle of (venta.PedidoDetalles || [])) {

            const inventario = await InventarioRelacion.findOne({

                where: {
                    CodigoInventario: detalle.CodigoInventario
                },

                attributes: [
                    'CodigoInventario',
                    'StockActual'
                ],

                transaction,
                lock: transaction.LOCK.UPDATE

            });

            if (!inventario)
                LanzarError(
                    `Inventario ${detalle.CodigoInventario} no encontrado`,
                    404
                );

            const stockAnterior = inventario.StockActual;
            const stockNuevo = stockAnterior + detalle.Cantidad;


            // =============================
            // ACTUALIZAR STOCK
            // =============================

            await inventario.update({
                StockActual: stockNuevo
            }, { transaction });


            // =============================
            // MOVIMIENTO INVENTARIO
            // =============================

            await MovimientoInventarioModelo.create({

                CodigoEmpresa: venta.CodigoEmpresa,
                CodigoInventario: detalle.CodigoInventario,
                CodigoUsuario: usuario.CodigoUsuario,

                TipoMovimiento: 'ENTRADA',
                OrigenMovimiento: 'ELIMINACION_VENTA',

                TipoDocumento: venta.TipoDocumento, // 🔴 VENTA
                CodigoDocumento: venta.CodigoPedido,
                NumeroDocumento: venta.NumeroDocumento,

                Cantidad: detalle.Cantidad,
                StockAnterior: stockAnterior,
                StockNuevo: stockNuevo,

                FechaMovimiento: new Date(),
                Observacion: `Devolución por eliminación de venta ${venta.NumeroDocumento}`,

                Estatus: 1,
                FechaCreacion: new Date()

            }, { transaction });

        }


        // =============================
        // OBTENER PAGOS APLICADOS
        // =============================

        const pagosAplicados = await PagoAplicacionModelo.findAll({

            where: {
                CodigoDocumento: CodigoPedido,
                TipoDocumento: venta.TipoDocumento // 🔴 VENTA
            },

            attributes: ['CodigoPago'],
            transaction

        });

        const codigosPagos = pagosAplicados.map(p => p.CodigoPago);


        // =============================
        // ELIMINAR PAGO APLICACION
        // =============================

        await PagoAplicacionModelo.destroy({

            where: {
                CodigoDocumento: CodigoPedido,
                TipoDocumento: venta.TipoDocumento
            },

            transaction

        });


        // =============================
        // ELIMINAR PAGOS
        // =============================

        if (codigosPagos.length > 0) {

            await PagoModelo.destroy({

                where: {
                    CodigoPago: codigosPagos
                },

                transaction

            });

        }


        // =============================
        // ELIMINAR DETALLES
        // =============================

        await PedidoDetalleModelo.destroy({

            where: {
                CodigoPedido: CodigoPedido
            },

            transaction

        });


        // =============================
        // ELIMINAR VENTA
        // =============================

        await PedidoModelo.destroy({

            where: {
                CodigoPedido: CodigoPedido
            },

            transaction

        });


        // =============================
        // COMMIT
        // =============================

        await transaction.commit();

        return {

            success: true,
            message: 'Venta eliminada correctamente',
            bitacora: 'Stock devuelto y pagos eliminados correctamente'

        };


    } catch (error) {

        if (transaction)
            await transaction.rollback();

        console.error(error);

        LanzarError(
            error.message || 'Error al eliminar venta',
            error.statusCode || 500,
            'Error'
        );
    }
};

// LISTADO PRODUCTOS PARA SELECT
const ListadoProducto = async () => {

    try {
        const productos = await InventarioRelacion.findAll({

            where: {
                Estatus: 1,
                // StockActual: {
                //     [Op.gt]: 0
                // }
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
                        'PrecioBase'
                    ],
                    include: [
                        {
                            model: TipoProductoModelo,
                            as: 'TipoProducto',
                            attributes: ['NombreTipoProducto'],
                            where: {
                                NombreTipoProducto: 'FISICO'
                            }
                        }
                    ]
                }
            ],

            order: [
                [{ model: ProductoRelacion, as: 'Producto' }, 'NombreProducto', 'ASC']
            ]

        });

        const resultado = productos.map(p => ({

            CodigoInventario: p.CodigoInventario,
            CodigoBarras: p.CodigoBarras,

            CodigoProducto: p.Producto?.CodigoProducto,
            NombreProducto: p.Producto?.NombreProducto,

            PrecioVenta: p.PrecioVenta,
            PrecioBase: p.Producto?.PrecioBase,
            StockActual: p.StockActual

        }));

        return resultado;

    } catch (error) {

        console.error(error);

        LanzarError(
            'Error al obtener productos',
            500,
            'Error'
        );

    }

};

// LISTADO DE VENTAS
const ListadoVentas = async (FechaInicio, FechaFin) => {
    try {

        // ================= FILTRO =================
        const whereFecha = {
            Estatus: 1
        };

        // ================= FECHAS =================
        if (
            FechaInicio &&
            FechaFin &&
            FechaInicio !== 'undefined' &&
            FechaFin !== 'undefined'
        ) {

            // 🔥 GUATEMALA → UTC
            const {
                inicioUTC,
                finUTC
            } = RangoGuatemalaAUTC(
                FechaInicio,
                FechaFin
            );

            whereFecha.FechaCreacion = {
                [Op.between]: [
                    inicioUTC,
                    finUTC
                ]
            };
        }

        const ventas = await PedidoModelo.findAll({

            where: whereFecha,

            attributes: [
                'CodigoPedido',
                'FechaCreacion',
                'Subtotal',
                'Descuento',
                'Total'
            ],

            include: [
                {
                    model: EstadoPedidoModelo,
                    as: 'CaEstadoPedido',
                    attributes: ['NombreEstadoPedido'],
                    where: {
                        NombreEstadoPedido: 'VENDIDO'
                    }
                },
                {
                    model: PagoAplicacionModelo,
                    as: 'PagosAplicados',
                    attributes: [
                        'CodigoPagoAplicacion',
                        'MontoAplicado'
                    ],
                    include: [
                        {
                            model: PagoModelo,
                            as: 'FnPago',
                            attributes: ['Monto']
                        }
                    ]
                },
                {
                    model: UsuarioModelo,
                    as: 'AdUsuario',
                    attributes: ['NombreUsuario']
                },
                {
                    model: ClienteModelo,
                    as: 'CaCliente',
                    attributes: ['NombreCliente']
                }
            ],

            order: [['FechaCreacion', 'DESC']]
        });

        const resultado = ventas.map(v => ({
            CodigoPedido: v.CodigoPedido,

            Fecha: UTCAGuatemala_FechaHora(
                v.FechaCreacion
            ),

            Total: v.Total,

            Cliente:
                v.CaCliente?.NombreCliente ||
                'Sin cliente',

            Usuario:
                v.AdUsuario?.NombreUsuario ||
                'Desconocido',

            Pagos:
                v.PagosAplicados?.map(p => ({
                    MontoAplicado: p.MontoAplicado,
                    MontoPago:
                        p.FnPago?.Monto || 0
                })) || []
        }));

        return resultado;

    } catch (error) {

        console.error(error);

        LanzarError(
            'Error al obtener listado de ventas',
            500,
            'Error'
        );
    }
};

module.exports = {
    ListadoProducto, CrearVenta, ListadoVentas, EliminarVenta, GenerarPDFVenta, ObtenerVenta, ObtenerDatosImpresion
};