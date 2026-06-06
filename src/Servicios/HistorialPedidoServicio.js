const Sequelize = require('sequelize');
const BaseDatos = require('../BaseDatos/ConexionBaseDatos');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { UTCAGuatemala_FechaHora,
    FormatoFecha,
    GuatemalaAUTC,
    FormatoFechaDesdeDateTime, RangoGuatemalaAUTC } = require('../Utilidades/ConversionFechas');


const { PedidoModelo, ClienteModelo, EstadoPedidoModelo, UsuarioModelo,
    ProductoModelo, PedidoDetalleModelo, InventarioModelo, PedidoDetalleMedidaModelo,
    TipoProductoModelo, TipoMedidaModelo, PagoModelo, PagoAplicacionModelo, TipoTelaModelo,
    TelaModelo, MovimientoInventarioModelo } = require('../Relaciones/Relaciones');

const EmpresaModelo = require('../Modelos/Empresa')(BaseDatos, Sequelize.DataTypes);
const TipoProducto = require('../Modelos/TipoProducto')(BaseDatos, Sequelize.DataTypes);
const TipoTela = require('../Modelos/TipoTela')(BaseDatos, Sequelize.DataTypes);
const Tela = require('../Modelos/Tela')(BaseDatos, Sequelize.DataTypes);
const Producto = require('../Modelos/Producto')(BaseDatos, Sequelize.DataTypes);
const Cliente = require('../Modelos/Cliente')(BaseDatos, Sequelize.DataTypes);
const TipoCuello = require('../Modelos/TipoCuello')(BaseDatos, Sequelize.DataTypes);
const EstadoPedido = require('../Modelos/EstadoPedido')(BaseDatos, Sequelize.DataTypes);
const PedidoDetalle = require('../Modelos/PedidoDetalle')(BaseDatos, Sequelize.DataTypes);
const PedidoDetalleMedida = require('../Modelos/PedidoDetalleMedida')(BaseDatos, Sequelize.DataTypes);
const TipoMedida = require('../Modelos/TipoMedida')(BaseDatos, Sequelize.DataTypes);
const FormaPago = require('../Modelos/FormaPago')(BaseDatos, Sequelize.DataTypes);
const { GenerarDocumento } = require('../Utilidades/GeneradorDocumento');
const { LanzarError } = require('../Utilidades/ErrorServicios');
const { Op, literal } = require('sequelize');

const CrearPedido = async (datos, usuario, CodigoEmpresa, NombreRol) => {
    const transaccion = await BaseDatos.transaction();

    try {
        if (!CodigoEmpresa)
            LanzarError('La empresa es obligatoria', 400, 'Alerta');

        if (!datos.CodigoCliente)
            LanzarError('El cliente es obligatorio', 400, 'Alerta');

        if (!datos.Productos || datos.Productos.length === 0)
            LanzarError('El pedido debe tener al menos un producto', 400, 'Alerta');

        // ================= VALIDAR DESCUENTO =================
        if (datos.Descuento === null || datos.Descuento === undefined)
            LanzarError('El descuento es obligatorio', 400, 'Alerta');

        if (typeof datos.Descuento !== 'number' || isNaN(datos.Descuento))
            LanzarError('El descuento debe ser un número válido', 400, 'Alerta');

        if (!Number.isInteger(datos.Descuento))
            LanzarError('El descuento debe ser un número entero', 400, 'Alerta');

        if (datos.Descuento < 0)
            LanzarError('El descuento no puede ser negativo', 400, 'Alerta');

        if (datos.Descuento > 100)
            LanzarError('El descuento no puede ser mayor a 100', 400, 'Alerta');


        let fechaEntrega = datos.FechaEntrega || null;

        const documentoPedido = await GenerarDocumento('PEDIDO', CodigoEmpresa, transaccion);

        if (!documentoPedido)
            LanzarError('No se pudo generar el documento del pedido', 500);

        const pedido = await PedidoModelo.create({
            CodigoEmpresa,
            CodigoCliente: datos.CodigoCliente,
            CodigoEstadoPedido: datos.CodigoEstadoPedido || 1,
            CodigoUsuario: usuario,

            Serie: documentoPedido.Serie,
            TipoDocumento: documentoPedido.TipoDocumento,
            NumeroDocumento: documentoPedido.NumeroDocumento,
            Numero: documentoPedido.Numero,

            FechaCreacion: new Date(),
            FechaEntrega: fechaEntrega,

            Subtotal: datos.Subtotal,
            Descuento: datos.Descuento,
            Total: datos.Total,

            Observaciones: datos.Observaciones || null,
            Estatus: 1

        }, { transaction: transaccion });

        // ================= PRODUCTOS =================
        for (const producto of datos.Productos) {

            // ================= VALIDAR CANTIDAD =================
            if (producto.Cantidad === null || producto.Cantidad === undefined)
                LanzarError('La cantidad es obligatoria', 400, 'Alerta');

            if (typeof producto.Cantidad !== 'number' || isNaN(producto.Cantidad))
                LanzarError('La cantidad debe ser un número válido', 400, 'Alerta');

            if (!Number.isInteger(producto.Cantidad))
                LanzarError('La cantidad debe ser un número entero', 400, 'Alerta');

            if (producto.Cantidad <= 0)
                LanzarError('La cantidad debe ser mayor a 0', 400, 'Alerta');

            const tipoProducto = producto.NombreTipoProducto?.toUpperCase();
            const esFisico = tipoProducto === 'FISICO';
            const esConfeccion = tipoProducto === 'CONFECCION';

            if (!esFisico && !esConfeccion)
                LanzarError(`Tipo de producto no reconocido: ${tipoProducto}`, 400);

            const inventario = await InventarioModelo.findOne({
                where: {
                    CodigoProducto: producto.CodigoProducto,
                    Estatus: 1
                },
                transaction: transaccion,
                lock: transaccion.LOCK.UPDATE
            });

            if (!inventario)
                LanzarError(`No hay inventario para el producto ${producto.CodigoProducto}`, 400);

            let stockAnterior = null;
            let stockNuevo = null;

            if (esFisico) {
                if (inventario.StockActual < producto.Cantidad)
                    LanzarError(`Stock insuficiente para el producto ${producto.CodigoProducto}`, 400);

                stockAnterior = inventario.StockActual;
                stockNuevo = stockAnterior - producto.Cantidad;
            }
            // ================= EMPRESA_ASOCIADA =================

            const NombreTelaAleatorio =
                NombreRol === 'EMPRESA_ASOCIADA'
                    ? producto.NombreTela || null
                    : null;
            const detalle = await PedidoDetalleModelo.create({
                CodigoPedido: pedido.CodigoPedido,
                CodigoInventario: inventario.CodigoInventario,

                CodigoTipoTela: producto.CodigoTipoTela || null,
                CodigoTela: producto.CodigoTela || null,

                NombreTelaAleatorio: NombreTelaAleatorio,

                Codigo: producto.Codigo || null,
                Color: producto.Color || null,
                Referencia: producto.Referencia || null,

                Cantidad: producto.Cantidad,
                PrecioVenta: producto.Precio,
                Subtotal: producto.Subtotal,
                Estatus: 1

            }, { transaction: transaccion });

            // ================= MEDIDAS (RESTAURADO CORRECTO) =================
            if (producto.Medidas && typeof producto.Medidas === 'object') {

                for (const key of Object.keys(producto.Medidas)) {

                    let valor = producto.Medidas[key];

                    if (valor === null || valor === undefined || valor === '')
                        continue;

                    // convertir a número si aplica
                    if (!isNaN(valor) && valor !== '')
                        valor = Number(valor);

                    const tipoMedida = await TipoMedidaModelo.findOne({
                        where: { NombreTipoMedida: key },
                        transaction: transaccion
                    });

                    if (!tipoMedida)
                        continue;

                    const esNumero = typeof valor === 'number';

                    await PedidoDetalleMedidaModelo.create({
                        CodigoPedidoDetalle: detalle.CodigoPedidoDetalle,
                        CodigoTipoMedida: tipoMedida.CodigoTipoMedida,
                        Valor: esNumero ? valor : null,
                        Descripcion: !esNumero ? String(valor) : null
                    }, { transaction: transaccion });
                }
            }

            // ================= INVENTARIO =================
            if (esFisico) {

                await inventario.update(
                    { StockActual: stockNuevo },
                    { transaction: transaccion }
                );

                await MovimientoInventarioModelo.create({
                    CodigoEmpresa,
                    CodigoInventario: inventario.CodigoInventario,
                    CodigoUsuario: usuario,

                    TipoMovimiento: 'SALIDA',
                    OrigenMovimiento: 'PEDIDO',

                    TipoDocumento: documentoPedido.TipoDocumento,
                    CodigoDocumento: pedido.CodigoPedido,
                    NumeroDocumento: documentoPedido.NumeroDocumento,

                    Cantidad: producto.Cantidad,
                    StockAnterior: stockAnterior,
                    StockNuevo: stockNuevo,

                    FechaMovimiento: new Date(),
                    Observacion: `Salida por pedido ${documentoPedido.NumeroDocumento}`

                }, { transaction: transaccion });
            }
        }
        // ================= PAGO INICIAL (SI EXISTE) =================
        // 🔥 SOLO SI NO ES EMPRESA_OFICIAL

        if (datos.MontoPago && datos.FormaPago) {

            const documentoPago = await GenerarDocumento(
                'PAGO',
                CodigoEmpresa,
                transaccion,
                pedido.CodigoPedido
            );

            if (!documentoPago)
                LanzarError('No se pudo generar el documento de pago', 500);

            const saldoAnterior = Number(pedido.Total);
            const saldoPendiente = Number(pedido.Total) - Number(datos.MontoPago);

            const pago = await PagoModelo.create({
                CodigoEmpresa,
                CodigoUsuario: usuario,
                CodigoFormaPago: datos.FormaPago,

                Serie: documentoPago.Serie,
                TipoDocumento: documentoPago.TipoDocumento,
                NumeroDocumento: documentoPago.NumeroDocumento,
                Numero: documentoPago.Numero,

                SaldoAnterior: saldoAnterior,
                SaldoPendiente: saldoPendiente,

                Monto: datos.MontoPago,
                FechaPago: new Date(),

                NumeroComprobante: datos.Referencia || null,
                UrlImagen: datos.UrlImagen || null,
                Observacion: datos.Observacion || null,

                Estatus: 1

            }, { transaction: transaccion });

            await PagoAplicacionModelo.create({
                CodigoPago: pago.CodigoPago,

                TipoDocumento: 'PEDIDO',
                CodigoDocumento: pedido.CodigoPedido,

                MontoAplicado: datos.MontoPago
            }, { transaction: transaccion });
        }

        await transaccion.commit();

        return {
            CodigoPedido: pedido.CodigoPedido,
            NumeroDocumento: documentoPedido.NumeroDocumento
        };

    } catch (errorOriginal) {


        try {

            if (transaccion && !transaccion.finished) {
                await transaccion.rollback();
            }

        } catch (rollbackError) {

        }

        throw errorOriginal;
    }
};
const ActualizarPedido = async (datos, usuario, NombreRol) => {

    const transaccion = await BaseDatos.transaction();

    try {
        if (!datos.CodigoPedido)
            LanzarError('El código de pedido es obligatorio', 400, 'Advertencia');

        if (!datos.CodigoCliente)
            LanzarError('El cliente es obligatorio', 400, 'Advertencia');

        if (!datos.Productos || datos.Productos.length === 0)
            LanzarError('El pedido debe tener al menos un producto', 400, 'Advertencia');
        // ================= VALIDAR DESCUENTO =================
        if (datos.Descuento === null || datos.Descuento === undefined)
            LanzarError('El descuento es obligatorio', 400, 'Advertencia');

        if (typeof datos.Descuento !== 'number' || isNaN(datos.Descuento))
            LanzarError('El descuento debe ser un número válido', 400, 'Advertencia');

        if (!Number.isInteger(datos.Descuento))
            LanzarError('El descuento debe ser un número entero', 400, 'Advertencia');

        if (datos.Descuento < 0)
            LanzarError('El descuento no puede ser negativo', 400, 'Advertencia');

        if (datos.Descuento > 100)
            LanzarError('El descuento no puede ser mayor a 100', 400, 'Advertencia');

        // ===================== VALIDAR PEDIDO =====================
        const pedido = await PedidoModelo.findOne({
            where: {
                CodigoPedido: datos.CodigoPedido,
                Estatus: 1
            },
            transaction: transaccion
        });

        if (!pedido)
            LanzarError('Pedido no encontrado', 404, 'Advertencia');

        // ===================== OBTENER DETALLES ANTERIORES =====================
        const detallesAnteriores = await PedidoDetalleModelo.findAll({
            where: { CodigoPedido: datos.CodigoPedido },
            transaction: transaccion
        });

        // ===================== DEVOLVER STOCK =====================
        for (const det of detallesAnteriores) {

            const inventario = await InventarioModelo.findOne({
                where: { CodigoInventario: det.CodigoInventario },
                transaction: transaccion
            });

            if (inventario && det.NombreTipoProducto?.toUpperCase() === 'FISICO') {

                await inventario.update({
                    StockActual: inventario.StockActual + det.Cantidad
                }, { transaction: transaccion });
            }

            await PedidoDetalleMedidaModelo.destroy({
                where: { CodigoPedidoDetalle: det.CodigoPedidoDetalle },
                transaction: transaccion
            });

            await det.destroy({ transaction: transaccion });
        }
        const convertirFecha = (fecha) => {

            if (!fecha) return null;

            // Ya viene correcta: yyyy-MM-dd
            if (fecha.includes('-')) {
                return fecha;
            }

            // Viene dd/MM/yyyy
            const [dia, mes, anio] = fecha.split('/');

            return `${anio}-${mes}-${dia}`;
        };

        // ===================== VALIDAR ESTADO PEDIDO =====================

        const estadoPedido = await EstadoPedidoModelo.findOne({
            where: {
                CodigoEstadoPedido: datos.CodigoEstadoPedido
            },
            transaction: transaccion
        });

        if (!estadoPedido)
            LanzarError(
                'Estado de pedido no válido',
                400,
                'Advertencia'
            );

        const nombreEstado =
            estadoPedido.NombreEstadoPedido?.toUpperCase();


        // ===================== FECHA ENTREGA =====================

        let fechaEntrega = null;

        // SI ES ENTREGADO
        if (nombreEstado === 'ENTREGADO') {

            // ignorar fecha enviada por frontend
            fechaEntrega = new Date();
        }
        else {

            // usar fecha enviada normalmente
            fechaEntrega = convertirFecha(datos.FechaEntrega);
        }


        // ===================== ACTUALIZAR ENCABEZADO =====================
        const datosActualizar = {

            CodigoCliente: datos.CodigoCliente,
            CodigoEstadoPedido: datos.CodigoEstadoPedido,
            FechaEntrega: fechaEntrega,

            Subtotal: datos.Subtotal,
            Descuento: datos.Descuento,
            Total: datos.Total
        };

        // ===================== ACTUALIZAR ENCABEZADO =====================
        await pedido.update(
            datosActualizar,
            { transaction: transaccion }
        );

        // ===================== INSERTAR NUEVOS PRODUCTOS =====================
        for (const producto of datos.Productos) {
            // ================= VALIDAR CANTIDAD =================
            if (producto.Cantidad === null || producto.Cantidad === undefined)
                LanzarError('La cantidad es obligatoria', 400, 'Advertencia');

            if (typeof producto.Cantidad !== 'number' || isNaN(producto.Cantidad))
                LanzarError('La cantidad debe ser un número válido', 400, 'Advertencia');

            if (!Number.isInteger(producto.Cantidad))
                LanzarError('La cantidad debe ser un número entero', 400, 'Advertencia');

            if (producto.Cantidad <= 0)
                LanzarError('La cantidad debe ser mayor a 0', 400, 'Advertencia');
            const tipoProducto = producto.NombreTipoProducto?.toUpperCase();
            const esFisico = tipoProducto === 'FISICO';
            const esConfeccion = tipoProducto === 'CONFECCION';

            if (!esFisico && !esConfeccion)
                LanzarError(`Tipo de producto no reconocido: ${tipoProducto}`, 400, 'Advertencia');

            const inventario = await InventarioModelo.findOne({
                where: {
                    CodigoProducto: producto.CodigoProducto,
                    Estatus: 1
                },
                transaction: transaccion
            });

            if (!inventario)
                LanzarError(
                    `No hay inventario para el producto ${producto.CodigoProducto}`,
                    400,
                    'Advertencia'
                );

            if (esFisico && inventario.StockActual < producto.Cantidad)
                LanzarError(
                    `Stock insuficiente para el producto ${producto.CodigoProducto}`,
                    400,
                    'Advertencia'
                );
            // ================= EMPRESA_ASOCIADA =================
            let NombreTelaAleatorio = null;

            // ================= EMPRESA_ASOCIADA =================
            if (NombreRol === 'EMPRESA_ASOCIADA') {

                NombreTelaAleatorio =
                    producto.NombreTela || null;

            }
            // ================= EMPRESA_OFICIAL =================
            else {

                // conservar el valor original
                const detalleAnterior = detallesAnteriores.find(
                    d => d.CodigoInventario === inventario.CodigoInventario
                );

                NombreTelaAleatorio =
                    detalleAnterior?.NombreTelaAleatorio || null;
            }
            const detalle = await PedidoDetalleModelo.create({

                CodigoPedido: pedido.CodigoPedido,
                CodigoInventario: inventario.CodigoInventario,

                CodigoTipoTela: producto.CodigoTipoTela || null,
                CodigoTela: producto.CodigoTela || null,

                NombreTelaAleatorio: NombreTelaAleatorio,

                Codigo: producto.Codigo || null,
                Color: producto.Color || null,
                Referencia: producto.Referencia || null,

                Cantidad: producto.Cantidad,
                PrecioVenta: producto.Precio,
                Subtotal: producto.Subtotal,

                Estatus: 1

            }, { transaction: transaccion });

            // ===================== MEDIDAS (MISMA LOGICA QUE CREAR) =====================
            if (producto.Medidas) {

                const medidas = producto.Medidas;

                for (const key in medidas) {

                    const valor = medidas[key];

                    if (valor === null || valor === undefined || valor === '')
                        continue;

                    const tipoMedida = await TipoMedidaModelo.findOne({
                        where: { NombreTipoMedida: key },
                        transaction: transaccion
                    });

                    if (!tipoMedida) continue;

                    const esNumero = typeof valor === 'number';

                    await PedidoDetalleMedidaModelo.create({

                        CodigoPedidoDetalle: detalle.CodigoPedidoDetalle,
                        CodigoTipoMedida: tipoMedida.CodigoTipoMedida,

                        Valor: esNumero ? valor : null,
                        Descripcion: !esNumero ? String(valor) : null

                    }, { transaction: transaccion });
                }
            }

            // ===================== DESCONTAR STOCK =====================

            if (esFisico) {
                await inventario.update({
                    StockActual: inventario.StockActual - producto.Cantidad
                }, { transaction: transaccion });
            }
        }

        await transaccion.commit();

        return {
            CodigoPedido: pedido.CodigoPedido,
            ok: true
        };

    } catch (error) {

        try {
            await transaccion.rollback();
        } catch (_) { }

        throw error;
    }
};
const GenerarPDFPedido = async (CodigoPedido, res) => {
    try {

        if (!CodigoPedido)
            LanzarError('El código de pedido es obligatorio', 400, 'Advertencia');


        // ================= EMPRESA =================
        const empresa = await EmpresaModelo.findOne({
            where: { CodigoEmpresa: 1, Estatus: 1 }
        });

        if (!empresa)
            LanzarError('Empresa no encontrada', 404, 'Advertencia');


        // ================= PEDIDO =================
        const pedido = await ObtenerPedido(Number(CodigoPedido));


        // ================= CLIENTE =================
        const cliente = await ClienteModelo.findOne({
            where: {
                CodigoCliente: pedido.CodigoCliente,
                Estatus: 1
            }
        });

        if (!cliente)
            LanzarError('Cliente no encontrado', 404, 'Advertencia');


        // ================= FORMAS DE PAGO =================
        const formasPagoDB = await FormaPago.findAll({
            attributes: ['CodigoFormaPago', 'NombreFormaPago']
        });

        const mapaFormaPago = {};

        formasPagoDB.forEach(f => {
            mapaFormaPago[f.CodigoFormaPago] = f.NombreFormaPago;
        });


        // ================= PAGOS DESDE BD =================
        const pagosDB = await PagoAplicacionModelo.findAll({
            where: {
                CodigoDocumento: CodigoPedido
            },
            attributes: [
                'CodigoPagoAplicacion',
                'CodigoPago',
                'TipoDocumento',
                'CodigoDocumento',
                'MontoAplicado'
            ],
            include: [
                {
                    model: PagoModelo,
                    as: 'FnPago',
                    where: { Estatus: 1 }, // SOLO Pago tiene Estatus
                    attributes: [
                        'CodigoPago',
                        'CodigoFormaPago',
                        'Monto',
                        'NumeroComprobante'
                    ],
                    required: false
                }
            ]
        });


        // ================= IDENTIFICAR PAGOS =================
        let tarjetaPago = null;
        let otroPago = null;

        pagosDB.forEach(p => {

            const nombreFormaPago =
                mapaFormaPago[p.FnPago?.CodigoFormaPago] || 'Sin forma';

            const nombre = nombreFormaPago.toLowerCase();

            if (nombre.includes('tarjeta') || nombre.includes('transferencia')) {

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
        const fechaPedido = pedido.FechaCreacion;
        const fechaEntrega = pedido.FechaEntrega;

        // ================= PDF =================
        const doc = new PDFDocument({ margin: 40 });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename=pedido_${CodigoPedido}.pdf`
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
        doc.text(`Documento: ${pedido.NumeroDocumento}`, 320, inicioY + 10);

        doc.font('Helvetica').fontSize(10);

        doc.text(`Cliente: ${cliente.NombreCliente}`, 50, inicioY + 40);
        doc.text(`Nit: ${cliente.NIT || ''}`, 50, inicioY + 55);
        doc.text(`Dirección: ${cliente.Direccion || ''}`, 50, inicioY + 70);
        doc.text(`Celular: ${cliente.Celular || ''}`, 50, inicioY + 85);

        doc.text(`Fecha: ${fechaPedido}`, 320, inicioY + 40);
        doc.text(`Atendió: ${pedido.NombreUsuario}`, 320, inicioY + 55);
        doc.text(`Fecha Entrega: ${fechaEntrega}`, 320, inicioY + 70);


        // ================= TABLA PRODUCTOS =================
        let y = inicioY + 150;
        let altoFila = 20;
        let alturaProductos = (pedido.Productos.length + 1) * altoFila;

        doc.roundedRect(40, y, 510, alturaProductos, 6).stroke();

        doc.save()
            .roundedRect(40, y, 510, altoFila, 6)
            .clip()
            .rect(40, y, 510, altoFila)
            .fill('#e6e6e6')
            .restore();

        doc.font('Helvetica-Bold').fontSize(11);

        doc.text('CANTIDAD', 40, y + 5, {
            width: 80,
            align: 'center'
        });
        doc.text('PRODUCTO', 150, y + 5);
        doc.text('TOTAL', 400, y + 5, { width: 140, align: 'right' });

        y += altoFila;

        doc.font('Helvetica').fontSize(10);

        pedido.Productos.forEach(prod => {

            doc.moveTo(40, y)
                .lineTo(550, y)
                .stroke();


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


        // ================= TOTALES =================
        let totalesY = y + 25;

        let xLabel = 380;
        let xMonto = 430;
        let anchoMonto = 120;

        doc.font('Helvetica');

        doc.text('Subtotal:', xLabel, totalesY);
        doc.text(`Q ${pedido.Subtotal.toFixed(2)}`, xMonto, totalesY, { width: anchoMonto, align: 'right' });

        totalesY += 15;

        const descuentoValor = (pedido.Subtotal * pedido.Descuento) / 100;

        doc.text('Descuento:', xLabel, totalesY);
        doc.text(`Q ${descuentoValor.toFixed(2)}`, xMonto, totalesY, { width: anchoMonto, align: 'right' });

        totalesY += 15;

        doc.font('Helvetica-Bold');

        doc.text('Total de tu orden:', xLabel, totalesY);
        doc.text(`Q ${pedido.Total.toFixed(2)}`, xMonto, totalesY, { width: anchoMonto, align: 'right' });

        totalesY += 15;

        doc.font('Helvetica');

        let abonadoY = totalesY;

        doc.text('Abonado:', xLabel, totalesY);
        doc.text(`Q ${pedido.TotalAbonado.toFixed(2)}`, xMonto, totalesY, { width: anchoMonto, align: 'right' });

        totalesY += 15;

        let saldoY = totalesY;

        doc.text('Saldo Pendiente:', xLabel, totalesY);
        doc.text(`Q ${pedido.SaldoPendiente.toFixed(2)}`, xMonto, totalesY, { width: anchoMonto, align: 'right' });


        // ================= FORMA DE PAGO =================
        if (tarjetaPago) {

            let xLabelPago = 40;
            let xValorPago = 140; // columna alineada

            // doc.font('Helvetica-Bold')
            //     .text('TARJETA:', xLabelPago, abonadoY);
            doc.text(`${tarjetaPago.nombre.toUpperCase()}:`, xLabelPago, abonadoY);

            doc.font('Helvetica')
                .text(`Q ${tarjetaPago.monto.toFixed(2)}`, xValorPago, abonadoY);

            if (tarjetaPago.numeroComprobante) {

                doc.font('Helvetica-Bold')
                    .text('REFERENCIA:', xLabelPago, saldoY);

                doc.font('Helvetica')
                    .text(`${tarjetaPago.numeroComprobante}`, xValorPago, saldoY);
            }
        }

        if (otroPago && !tarjetaPago) {

            let xLabelPago = 40;
            let xValorPago = 140;

            doc.font('Helvetica-Bold')
                .text(`${otroPago.nombre.toUpperCase()}:`, xLabelPago, saldoY);

            doc.font('Helvetica')
                .text(`Q ${otroPago.monto.toFixed(2)}`, xValorPago, saldoY);
        }

        // ================= FINAL =================

        doc.end();

    } catch (error) {

        console.error('Error al generar PDF:', error);

        LanzarError(
            error.message || 'Error al generar el PDF del pedido',
            error.statusCode || 500,
            'Error'
        );
    }
};
const GenerarPDFPagoPedido = async (CodigoPago, res) => {
    try {
        if (!CodigoPago)
            LanzarError('El código de pago es obligatorio', 400, 'Advertencia');

        // ================= EMPRESA =================
        const empresa = await EmpresaModelo.findOne({
            where: { CodigoEmpresa: 1, Estatus: 1 }
        });
        if (!empresa)
            LanzarError('Empresa no encontrada', 404, 'Advertencia');

        // ================= PAGO =================
        const pagoAplicacion = await PagoAplicacionModelo.findOne({
            where: { CodigoPago, TipoDocumento: 'PEDIDO' },
            attributes: ['CodigoPago', 'CodigoDocumento', 'MontoAplicado'],
            include: [{
                model: PagoModelo,
                as: 'FnPago',
                attributes: [
                    'CodigoFormaPago', 'NumeroComprobante', 'NumeroDocumento',
                    'FechaPago', 'SaldoAnterior', 'SaldoPendiente', 'Estatus'
                ],
                required: true
            }]
        });
        if (!pagoAplicacion || !pagoAplicacion.FnPago)
            LanzarError('Pago no encontrado', 404, 'Advertencia');
        if (Number(pagoAplicacion.FnPago.Estatus) !== 1)
            LanzarError('El pago está inactivo', 400, 'Advertencia');

        // ================= PEDIDO =================
        const CodigoPedido = pagoAplicacion.CodigoDocumento;
        const pedido = await ObtenerPedido(Number(CodigoPedido));
        if (!pedido)
            LanzarError('Pedido no encontrado', 404, 'Advertencia');

        // ================= CLIENTE =================
        const cliente = await ClienteModelo.findOne({
            where: { CodigoCliente: pedido.CodigoCliente, Estatus: 1 }
        });
        if (!cliente)
            LanzarError('Cliente no encontrado', 404, 'Advertencia');

        // ================= FORMAS DE PAGO =================
        const formasPagoDB = await FormaPago.findAll({ attributes: ['CodigoFormaPago', 'NombreFormaPago'] });
        const mapaFormaPago = {};
        formasPagoDB.forEach(f => { mapaFormaPago[f.CodigoFormaPago] = f.NombreFormaPago; });

        // ================= DATOS =================
        const formaPagoNombre = mapaFormaPago[pagoAplicacion.FnPago.CodigoFormaPago] || 'Sin forma';
        const numeroReferencia = pagoAplicacion.FnPago.NumeroComprobante || '';
        const abono = Number(pagoAplicacion.MontoAplicado);
        const saldoAnterior = Number(pagoAplicacion.FnPago.SaldoAnterior || 0);
        const saldoPendiente = Number(pagoAplicacion.FnPago.SaldoPendiente || 0);
        const fechaPago = pagoAplicacion.FnPago.FechaCreacion
            ? UTCAGuatemala_FechaHora(pagoAplicacion.FnPago.FechaCreacion)
            : UTCAGuatemala_FechaHora(new Date());
        const fechaEntrega = pedido.FechaEntrega || null;

        // ================= PDF =================
        const doc = new PDFDocument({ margin: 40 });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=pago_${CodigoPago}.pdf`);
        doc.pipe(res);

        doc.lineWidth(1).strokeColor('#bfbfbf');

        // ================= LOGO =================
        const logoPath = path.join(__dirname, '../public/LogoConfeccionesCreateli.png');
        if (fs.existsSync(logoPath)) doc.image(logoPath, 470, 40, { width: 70 });

        // ================= EMPRESA =================
        doc.fillColor('black')
            .font('Helvetica-Bold').fontSize(18).text(empresa.NombreEmpresa, 40, 40);
        doc.font('Helvetica').fontSize(10)
            .text(`NIT: ${empresa.NIT}`, 40, 70)
            .text(`Dirección: ${empresa.Direccion}`, 40, 85)
            .text(`Teléfono: ${empresa.Telefono}`, 40, 100);

        // ================= TABLA CLIENTE =================
        const inicioY = 140;
        const anchoTabla = 510;
        const altoTabla = 120;
        const headerHeight = 30;

        doc.roundedRect(40, inicioY, anchoTabla, altoTabla, 6).stroke();
        doc.save().roundedRect(40, inicioY, anchoTabla, headerHeight, 6).clip().rect(40, inicioY, anchoTabla, headerHeight).fill('#e6e6e6').restore();
        doc.moveTo(40, inicioY + headerHeight).lineTo(550, inicioY + headerHeight).stroke();
        doc.moveTo(300, inicioY + headerHeight).lineTo(300, inicioY + altoTabla).stroke();

        doc.font('Helvetica-Bold').fontSize(12);
        doc.text('Recibo de Abono', 50, inicioY + 10);
        doc.text(`Documento: ${pagoAplicacion.FnPago.NumeroDocumento}`, 320, inicioY + 10);

        doc.font('Helvetica').fontSize(10);
        doc.text(`Cliente: ${cliente.NombreCliente}`, 50, inicioY + 40);
        doc.text(`Nit: ${cliente.NIT || ''}`, 50, inicioY + 55);
        doc.text(`Dirección: ${cliente.Direccion || ''}`, 50, inicioY + 70);
        doc.text(`Celular: ${cliente.Celular || ''}`, 50, inicioY + 85);
        doc.text(`Fecha Pago: ${fechaPago}`, 320, inicioY + 40);
        doc.text(`Atendido: ${pedido.NombreUsuario}`, 320, inicioY + 55);
        doc.text(`Fecha Entrega: ${fechaEntrega}`, 320, inicioY + 70);

        // ================= NO. PEDIDO =================
        let totalesY = inicioY + altoTabla + 10;
        const xIzquierda = 50;
        const xDerechaLabel = 400;
        const xDerechaMonto = 420;
        const anchoMonto = 120;

        doc.font('Helvetica-Bold').fontSize(10)
            .text('No. Pedido:', xIzquierda, totalesY)
            .font('Helvetica').text(pedido.NumeroDocumento || '', xIzquierda + 70, totalesY);

        totalesY += 20;

        // ================= TOTALES DERECHA =================
        doc.font('Helvetica-Bold').text('Saldo Anterior:', xDerechaLabel, totalesY);
        doc.font('Helvetica').text(`Q ${saldoAnterior.toFixed(2)}`, xDerechaMonto, totalesY, { width: anchoMonto, align: 'right' });

        totalesY += 20;
        doc.font('Helvetica-Bold').text('Abonado:', xDerechaLabel, totalesY);
        doc.font('Helvetica').text(`Q ${abono.toFixed(2)}`, xDerechaMonto, totalesY, { width: anchoMonto, align: 'right' });

        totalesY += 20;
        doc.font('Helvetica-Bold').text('Saldo Pendiente:', xDerechaLabel, totalesY);
        doc.font('Helvetica').text(`Q ${saldoPendiente.toFixed(2)}`, xDerechaMonto, totalesY, { width: anchoMonto, align: 'right' });

        // ================= COLUMNA IZQUIERDA =================
        const yIzquierda = totalesY - 20; // Alineada a la línea de "Abonado"

        // Forma de pago: título en negrita, valor normal
        doc.font('Helvetica-Bold').text(`${formaPagoNombre.toUpperCase()}:`, xIzquierda, yIzquierda, { continued: true });
        doc.font('Helvetica').text(` Q ${abono.toFixed(2)}`); // valor sin negrita

        const nombre = formaPagoNombre.toUpperCase();

        if (nombre.includes('TARJETA') || nombre.includes('TRANSFERENCIA')) {
            const yReferencia = yIzquierda + 20; // debajo de la forma de pago
            doc.font('Helvetica-Bold').text('Referencia:', xIzquierda, yReferencia, { continued: true });
            doc.font('Helvetica').text(` ${numeroReferencia}`); // valor sin negrita
        }
        // ================= FINAL =================
        doc.end();

    } catch (error) {
        console.error('Error al generar PDF de pago:', error);
        LanzarError(error.message || 'Error al generar PDF de pago del pedido', error.statusCode || 500, 'Error');
    }
};
const ObtenerDatosImpresionPagoPedido = async (CodigoPago) => {

    try {

        if (!CodigoPago)
            LanzarError('El código de pago es obligatorio', 400, 'Advertencia');

        // ================= EMPRESA =================
        const empresa = await EmpresaModelo.findOne({
            where: { CodigoEmpresa: 1, Estatus: 1 }
        });

        if (!empresa)
            LanzarError('Empresa no encontrada', 404);

        // ================= PAGO APLICACIÓN =================
        const pagoAplicacion = await PagoAplicacionModelo.findOne({
            where: {
                CodigoPago,
                TipoDocumento: 'PEDIDO'
            },
            include: [{
                model: PagoModelo,
                as: 'FnPago',
                where: { Estatus: 1 },
                required: true
            }]
        });

        if (!pagoAplicacion || !pagoAplicacion.FnPago)
            LanzarError('Pago no encontrado', 404);

        // ================= PEDIDO =================
        const pedido = await ObtenerPedido(Number(pagoAplicacion.CodigoDocumento));

        if (!pedido)
            LanzarError('Pedido no encontrado', 404);

        // ================= CLIENTE =================
        const cliente = await ClienteModelo.findOne({
            where: {
                CodigoCliente: pedido.CodigoCliente,
                Estatus: 1
            }
        });

        if (!cliente)
            LanzarError('Cliente no encontrado', 404);

        // ================= FORMA DE PAGO =================
        const formaPago = await FormaPago.findOne({
            where: {
                CodigoFormaPago: pagoAplicacion.FnPago.CodigoFormaPago
            }
        });

        const nombreFormaPago = formaPago?.NombreFormaPago || 'Sin forma';

        const monto = Number(pagoAplicacion.MontoAplicado || 0);

        const referencia = pagoAplicacion.FnPago.NumeroComprobante || null;

        const saldoAnterior = Number(pagoAplicacion.FnPago.SaldoAnterior || 0);
        // const saldoPendiente = Number(pagoAplicacion.FnPago.SaldoPendiente || 0);
        const saldoPendiente = pagoAplicacion.FnPago.SaldoPendiente

        const fechaPago = pagoAplicacion.FnPago.FechaCreacion
            ? UTCAGuatemala_FechaHora(pagoAplicacion.FnPago.FechaCreacion)
            : UTCAGuatemala_FechaHora(new Date());
        const fechaEntrega = pedido.FechaEntrega || null;


        // ================= RETORNO =================
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

            pedido: {
                documento: pedido.NumeroDocumento,
                usuario: pedido.NombreUsuario,
                fechaEntrega
            },

            pago: {
                documento: pagoAplicacion.FnPago.NumeroDocumento,
                nombre: nombreFormaPago,
                monto,
                referencia
            },

            totales: {
                saldoAnterior,
                abono: monto,
                saldoPendiente
            },

            fechaPago

        };

    } catch (error) {

        console.error(error);

        LanzarError(
            error.message || 'Error al obtener datos de impresión de pago',
            error.statusCode || 500,
            'Error'
        );
    }
};
const RegistrarPagoPedido = async (datos, usuario) => {

    const transaccion = await BaseDatos.transaction();

    try {

        // ================= VALIDACIONES =================
        if (!datos.CodigoPedido)
            LanzarError('El pedido es obligatorio', 400, 'Alerta');

        if (!datos.MontoPago)
            LanzarError('El monto del pago es obligatorio', 400, 'Alerta');

        if (isNaN(datos.MontoPago))
            LanzarError('El monto debe ser numérico', 400, 'Alerta');

        if (Number(datos.MontoPago) <= 0)
            LanzarError('El monto debe ser mayor a cero', 400, 'Alerta');

        if (!datos.FormaPago)
            LanzarError('La forma de pago es obligatoria', 400, 'Alerta');

        if (datos.MontoPago <= 0)
            LanzarError('El monto debe ser mayor a cero', 400, 'Alerta');


        const formaPago = await FormaPago.findOne({
            where: { CodigoFormaPago: datos.FormaPago },
            attributes: ['NombreFormaPago'],
            transaction: transaccion
        });

        if (!formaPago)
            LanzarError('La forma de pago no existe', 404, 'Alerta');

        // ================= REGLA DE NEGOCIO =================
        const requiereReferencia =
            ['TARJETA', 'TRANSFERENCIA'].includes(
                formaPago.NombreFormaPago?.toUpperCase()
            );

        if (requiereReferencia && !datos.Referencia?.trim()) {
            LanzarError(
                'La referencia es obligatoria para pagos con tarjeta o transferencia',
                400,
                'Alerta'
            );
        }

        // ================= NORMALIZAR =================
        const referencia = datos.Referencia?.trim() ?? null;

        const CodigoEmpresa = 1;

        // ================= PEDIDO =================
        const pedido = await PedidoModelo.findOne({
            where: { CodigoPedido: datos.CodigoPedido },
            transaction: transaccion
        });

        if (!pedido)
            LanzarError('El pedido no existe', 404, 'Alerta');

        // ================= PAGOS ACTUALES =================
        const pagos = await PagoAplicacionModelo.findAll({
            where: {
                TipoDocumento: 'PEDIDO',
                CodigoDocumento: datos.CodigoPedido
            },
            attributes: ['MontoAplicado'],
            transaction: transaccion
        });

        const totalPagado = pagos.reduce(
            (sum, p) => sum + Number(p.MontoAplicado),
            0
        );

        const saldoAnterior = Number(pedido.Total) - totalPagado;

        if (saldoAnterior <= 0)
            LanzarError('El pedido ya está pagado', 400, 'Alerta');

        if (datos.MontoPago > saldoAnterior)
            LanzarError('El monto excede el saldo pendiente', 400, 'Alerta');

        const saldoPendiente = saldoAnterior - Number(datos.MontoPago);

        // ================= DOCUMENTO =================
        const documento = await GenerarDocumento(
            'PAGO',
            CodigoEmpresa,
            transaccion,
            datos.CodigoPedido
        );

        if (!documento)
            LanzarError('No se pudo generar el documento de pago', 500, 'Error');

        // ================= CREAR PAGO =================
        const pago = await PagoModelo.create({

            CodigoEmpresa,
            CodigoUsuario: usuario,
            CodigoFormaPago: datos.FormaPago,

            Serie: documento.Serie,
            TipoDocumento: documento.TipoDocumento,
            NumeroDocumento: documento.NumeroDocumento,
            Numero: documento.Numero,

            SaldoAnterior: saldoAnterior,
            SaldoPendiente: saldoPendiente,

            Monto: datos.MontoPago,
            FechaPago: new Date(),
            FechaCreacion: new Date(),

            // 🔥 AQUÍ SE GUARDA LA REFERENCIA (TARJETA / EFECTIVO / ETC)
            NumeroComprobante: referencia,

            UrlImagen: datos.UrlImagen || null,
            Observacion: datos.Observacion || null,

            Estatus: 1

        }, { transaction: transaccion });

        // ================= APLICAR PAGO =================
        await PagoAplicacionModelo.create({

            CodigoPago: pago.CodigoPago,

            TipoDocumento: 'PEDIDO',
            CodigoDocumento: datos.CodigoPedido,
            NumeroDocumento: documento.NumeroDocumento,

            MontoAplicado: datos.MontoPago,
            SaldoAnterior: saldoAnterior,
            SaldoPendiente: saldoPendiente

        }, { transaction: transaccion });

        // ================= ACTUALIZAR PEDIDO =================

        await transaccion.commit();

        // ================= RESPUESTA =================
        return {
            CodigoPago: pago.CodigoPago,
            CodigoPedido: datos.CodigoPedido,
            NumeroDocumento: documento.NumeroDocumento,
            TotalPedido: pedido.Total,
            SaldoAnterior: saldoAnterior,
            Abono: datos.MontoPago,
            SaldoPendiente: saldoPendiente
        };

    } catch (error) {

        try {
            await transaccion.rollback();
        } catch (_) { }

        throw error;
    }
};
//aqui estamos
const ObtenerPedido = async (CodigoPedido) => {
    try {

        if (!CodigoPedido)
            LanzarError('El código de pedido es obligatorio', 400, 'Advertencia');

        // ===================== PEDIDO =====================
        const pedido = await PedidoModelo.findOne({
            where: {
                CodigoPedido,
                Estatus: 1
            },
            attributes: [
                'CodigoPedido',
                'CodigoEmpresa',
                'CodigoCliente',
                'CodigoUsuario',
                'NumeroDocumento',
                'FechaEntrega',
                'FechaCreacion',
                'CodigoEstadoPedido',
                'Descuento',
                'Subtotal',
                'Total'
            ],
            include: [
                {
                    model: EmpresaModelo,
                    as: 'AdEmpresa',
                    attributes: ['CodigoEmpresa', 'NombreEmpresa']
                },
                {
                    model: ClienteModelo,
                    as: 'CaCliente',
                    attributes: ['CodigoCliente', 'NombreCliente']
                },
                {
                    model: UsuarioModelo,
                    as: 'AdUsuario',
                    attributes: ['CodigoUsuario', 'NombreUsuario']
                },
                {
                    model: EstadoPedidoModelo,
                    as: 'CaEstadoPedido',
                    attributes: ['NombreEstadoPedido']
                },
                {
                    model: PagoAplicacionModelo,
                    as: 'PagosAplicados',
                    attributes: [
                        'CodigoPagoAplicacion',
                        'CodigoPago',
                        'MontoAplicado'
                    ],
                    include: [
                        {
                            model: PagoModelo,
                            as: 'FnPago',
                            attributes: [
                                'CodigoFormaPago',
                                'Monto',
                                'FechaPago'
                            ]
                        }
                    ]
                }
            ]
        });

        if (!pedido)
            LanzarError('Pedido no encontrado', 404, 'Advertencia');

        // ===================== DETALLES =====================
        const detalles = await PedidoDetalleModelo.findAll({
            where: {
                CodigoPedido,
                Estatus: 1
            },
            include: [
                {
                    model: InventarioModelo,
                    as: 'Inventario',
                    attributes: [
                        'CodigoInventario',
                        'CodigoProducto'
                    ],
                    include: [
                        {
                            model: ProductoModelo,
                            as: 'Producto',
                            attributes: [
                                'CodigoProducto',
                                'NombreProducto',
                                'CodigoTipoProducto'
                            ],
                            include: [
                                {
                                    model: TipoProductoModelo,
                                    as: 'TipoProducto',
                                    attributes: [
                                        'CodigoTipoProducto',
                                        'NombreTipoProducto'
                                    ],
                                    required: false
                                }
                            ]
                        }
                    ]
                },
                {
                    model: TipoTelaModelo,
                    as: 'TipoTela',
                    attributes: [
                        'CodigoTipoTela',
                        'NombreTipoTela'
                    ],
                    required: false
                },
                {
                    model: TelaModelo,
                    as: 'Tela',
                    attributes: [
                        'CodigoTela',
                        'NombreTela'
                    ],
                    required: false
                }
            ]
        });

        const productos = [];

        for (const det of detalles) {

            const medidasDB = await PedidoDetalleMedidaModelo.findAll({
                where: {
                    CodigoPedidoDetalle: det.CodigoPedidoDetalle
                },
                include: [
                    {
                        model: TipoMedidaModelo,
                        as: 'TipoMedidaDetalle',
                        attributes: ['NombreTipoMedida']
                    }
                ]
            });

            const medidas = {};

            for (const m of medidasDB) {

                const nombre = m.TipoMedidaDetalle?.NombreTipoMedida;

                if (!nombre) continue;

                if (m.Valor != null)
                    medidas[nombre] = m.Valor;
                else if (m.Descripcion != null)
                    medidas[nombre] = m.Descripcion;
                else
                    medidas[nombre] = null;
            }

            if (medidas.Botones != null) {
                medidas.Botones = String(medidas.Botones);
            }
            productos.push({
                CodigoProducto: det.Inventario?.Producto?.CodigoProducto || null,
                NombreProducto: det.Inventario?.Producto?.NombreProducto || '',
                CodigoTipoProducto: det.Inventario?.Producto?.TipoProducto?.CodigoTipoProducto || null,
                NombreTipoProducto: det.Inventario?.Producto?.TipoProducto?.NombreTipoProducto || '',
                CodigoTipoTela: det.CodigoTipoTela || null,
                NombreTipoTela: det.TipoTela?.NombreTipoTela || '',
                CodigoTela: det.CodigoTela || null,
                NombreTela: det.NombreTelaAleatorio || det.Tela?.NombreTela || '',
                Codigo: det.Codigo || null,
                Color: det.Color || '',
                Referencia: det.Referencia || '',
                Cantidad: det.Cantidad || 0,
                Precio: det.PrecioVenta || 0,
                Subtotal: det.Subtotal || 0,
                Medidas: medidas
            });
        }

        // ===================== PAGOS =====================
        const totalAbonado =
            pedido.PagosAplicados?.reduce(
                (acc, pa) => acc + parseFloat(pa.MontoAplicado || 0),
                0
            ) || 0;

        const saldoPendiente =
            (pedido.Total || 0) - totalAbonado;

        // ===================== RESPUESTA =====================
        const respuesta = {
            CodigoPedido: pedido.CodigoPedido,
            CodigoEmpresa: pedido.CodigoEmpresa,
            NombreEmpresa: pedido.AdEmpresa?.NombreEmpresa || '',
            NumeroDocumento: pedido.NumeroDocumento,
            CodigoCliente: pedido.CodigoCliente,
            NombreCliente: pedido.CaCliente?.NombreCliente || '',
            CodigoUsuario: pedido.CodigoUsuario,
            NombreUsuario: pedido.AdUsuario?.NombreUsuario || '',
            FechaCreacion: pedido.FechaCreacion
                ? UTCAGuatemala_FechaHora(pedido.FechaCreacion)
                : null,

            FechaEntrega: pedido.FechaEntrega
                ? FormatoFecha(pedido.FechaEntrega)
                : '',
            CodigoEstadoPedido: pedido.CodigoEstadoPedido,
            NombreEstadoPedido: pedido.CaEstadoPedido?.NombreEstadoPedido || '',
            Descuento: pedido.Descuento || 0,
            Subtotal: pedido.Subtotal || 0,
            Total: pedido.Total || 0,
            TotalAbonado: totalAbonado,
            SaldoPendiente: saldoPendiente,
            Pagos: pedido.PagosAplicados || [],
            Productos: productos
        };


        return respuesta;

    } catch (error) {

        console.error('Error original en ObtenerPedido:', error);

        if (!error.statusCode)
            LanzarError('Error al obtener pedido', 500, 'Error');

        throw error;
    }
};
// const EliminarPedido = async (CodigoPedido) => {

//     const transaccion = await BaseDatos.transaction();

//     try {

//         if (!CodigoPedido)
//             LanzarError('El código de pedido es obligatorio', 400, 'Advertencia');

//         const pedido = await PedidoModelo.findOne({
//             where: { CodigoPedido },
//             transaction: transaccion
//         });

//         if (!pedido)
//             LanzarError('El pedido no existe', 404, 'Advertencia');

//         const detalles = await PedidoDetalleModelo.findAll({
//             where: { CodigoPedido },
//             transaction: transaccion
//         });

//         for (const detalle of detalles) {

//             const inventario = await InventarioModelo.findOne({
//                 where: {
//                     CodigoInventario: detalle.CodigoInventario
//                 },
//                 transaction: transaccion,
//                 lock: true
//             });

//             if (inventario) {

//                 const stockAnterior = inventario.StockActual;
//                 const stockNuevo = stockAnterior + detalle.Cantidad;

//                 await inventario.update({
//                     StockActual: stockNuevo
//                 }, { transaction: transaccion });

//                 // ================= MOVIMIENTO INVENTARIO =================
//                 await MovimientoInventarioModelo.create({

//                     CodigoEmpresa: 1,
//                     CodigoInventario: inventario.CodigoInventario,
//                     CodigoUsuario: pedido.CodigoUsuario,

//                     TipoMovimiento: 'ENTRADA',
//                     OrigenMovimiento: 'ELIMINACION_PEDIDO',

//                     TipoDocumento: 'PEDIDO',
//                     CodigoDocumento: CodigoPedido,

//                     Cantidad: detalle.Cantidad,

//                     StockAnterior: stockAnterior,
//                     StockNuevo: stockNuevo,

//                     FechaMovimiento: new Date(),
//                     Observacion: `Entrada por eliminación pedido ${CodigoPedido}`,

//                     Estatus: 1,
//                     FechaCreacion: new Date()

//                 }, { transaction: transaccion });
//             }

//             await PedidoDetalleMedidaModelo.destroy({
//                 where: {
//                     CodigoPedidoDetalle: detalle.CodigoPedidoDetalle
//                 },
//                 transaction: transaccion
//             });

//             await detalle.destroy({
//                 transaction: transaccion
//             });
//         }

//         // ================= PAGOS =================
//         const pagosAplicados = await PagoAplicacionModelo.findAll({
//             where: {
//                 TipoDocumento: 'PEDIDO',
//                 CodigoDocumento: CodigoPedido
//             },
//             transaction: transaccion
//         });

//         for (const pagoAplicacion of pagosAplicados) {

//             await pagoAplicacion.destroy({
//                 transaction: transaccion
//             });

//             await PagoModelo.destroy({
//                 where: {
//                     CodigoPago: pagoAplicacion.CodigoPago
//                 },
//                 transaction: transaccion
//             });
//         }

//         await pedido.destroy({
//             transaction: transaccion
//         });

//         await transaccion.commit();

//         return {
//             CodigoPedido,
//             TotalDetalles: detalles.length,
//             TotalPagos: pagosAplicados.length,
//             Mensaje: 'Pedido eliminado completamente'
//         };

//     } catch (error) {

//         try {
//             await transaccion.rollback();
//         } catch (_) { }

//         console.error(error);
//         throw error;
//     }
// };

const EliminarPedido = async (CodigoPedido) => {

    const transaccion = await BaseDatos.transaction();

    try {

        if (!CodigoPedido)
            LanzarError('El código de pedido es obligatorio', 400, 'Advertencia');

        // ================= PEDIDO =================
        const pedido = await PedidoModelo.findOne({
            where: { CodigoPedido },
            transaction: transaccion
        });

        if (!pedido)
            LanzarError('El pedido no existe', 404, 'Advertencia');

        // ================= DETALLES =================
        const detalles = await PedidoDetalleModelo.findAll({
            where: { CodigoPedido },
            transaction: transaccion
        });

        for (const detalle of detalles) {

            // ================= INVENTARIO =================
            const inventario = await InventarioModelo.findOne({
                where: {
                    CodigoInventario: detalle.CodigoInventario
                },
                transaction: transaccion,
                lock: transaccion.LOCK.UPDATE
            });

            if (inventario) {

                const inventario = await InventarioModelo.findOne({
                    where: {
                        CodigoInventario: detalle.CodigoInventario
                    },
                    transaction: transaccion,
                    lock: transaccion.LOCK.UPDATE
                });

                if (!inventario) {
                    continue;
                }


                // ================= PRODUCTO =================
                let producto = null;

                try {
                    producto = await ProductoModelo.findOne({
                        where: {
                            CodigoProducto: inventario.CodigoProducto
                        },
                        transaction: transaccion
                    });


                } catch (err) {
                    console.log(err);
                    throw err;
                }


                // ================= TIPO PRODUCTO =================
                let tipoProductoNombre = null;

                if (producto) {

                    if (producto.CodigoTipoProducto) {

                        const tipoProducto = await TipoProductoModelo.findOne({
                            where: {
                                CodigoTipoProducto: producto.CodigoTipoProducto
                            },
                            transaction: transaccion
                        });

                        tipoProductoNombre = tipoProducto?.NombreTipoProducto || null;

                    }
                }


                // ================= DECISIÓN =================
                const esFisico = tipoProductoNombre?.toUpperCase() === 'FISICO';
                const esConfeccion = tipoProductoNombre?.toUpperCase() === 'CONFECCION';


                if (!esFisico && !esConfeccion) {
                    LanzarError(
                        `Tipo de producto inválido en detalle: ${tipoProductoNombre}`,
                        400,
                        'Error'
                    );
                }

                // =========================================================
                // ✔ SOLO FISICO REGRESA STOCK
                // =========================================================
                if (esFisico) {

                    const stockAnterior = inventario.StockActual;
                    const stockNuevo = stockAnterior + detalle.Cantidad;

                    await inventario.update({
                        StockActual: stockNuevo
                    }, { transaction: transaccion });

                    await MovimientoInventarioModelo.create({

                        CodigoEmpresa: pedido.CodigoEmpresa || 1,
                        CodigoInventario: inventario.CodigoInventario,
                        CodigoUsuario: pedido.CodigoUsuario,

                        TipoMovimiento: 'ENTRADA',
                        OrigenMovimiento: 'ELIMINACION_PEDIDO',

                        TipoDocumento: 'PEDIDO',
                        CodigoDocumento: CodigoPedido,

                        Cantidad: detalle.Cantidad,

                        StockAnterior: stockAnterior,
                        StockNuevo: stockNuevo,

                        FechaMovimiento: new Date(),
                        Observacion: `Entrada por eliminación pedido ${CodigoPedido}`,

                        Estatus: 1,
                        FechaCreacion: new Date()

                    }, { transaction: transaccion });
                }
            }

            // ================= MEDIDAS =================
            await PedidoDetalleMedidaModelo.destroy({
                where: {
                    CodigoPedidoDetalle: detalle.CodigoPedidoDetalle
                },
                transaction: transaccion
            });

            await detalle.destroy({
                transaction: transaccion
            });
        }

        // ================= PAGOS =================
        const pagosAplicados = await PagoAplicacionModelo.findAll({
            where: {
                TipoDocumento: 'PEDIDO',
                CodigoDocumento: CodigoPedido
            },
            transaction: transaccion
        });

        for (const pagoAplicacion of pagosAplicados) {

            await pagoAplicacion.destroy({
                transaction: transaccion
            });

            await PagoModelo.destroy({
                where: {
                    CodigoPago: pagoAplicacion.CodigoPago
                },
                transaction: transaccion
            });
        }

        // ================= ELIMINAR PEDIDO =================
        await pedido.destroy({
            transaction: transaccion
        });

        await transaccion.commit();

        return {
            CodigoPedido,
            TotalDetalles: detalles.length,
            TotalPagos: pagosAplicados.length,
            Mensaje: 'Pedido eliminado completamente'
        };

    } catch (error) {

        if (transaccion && !transaccion.finished) {
            await transaccion.rollback();
        }

        console.error(error);
        throw error;
    }
};
const ListarPagosPorPedido = async (codigoPedido) => {

    try {

        if (!codigoPedido)
            LanzarError('El código de pedido es obligatorio', 400, 'Advertencia');

        // 🔎 Obtener pagos aplicados al pedido
        const pagosAplicados = await PagoAplicacionModelo.findAll({
            where: {
                TipoDocumento: 'PEDIDO',
                CodigoDocumento: codigoPedido
            },
            attributes: [
                'CodigoPago',
                'MontoAplicado'
            ],
            order: [['CodigoPagoAplicacion', 'ASC']]
        });

        if (!pagosAplicados || pagosAplicados.length === 0)
            return [];

        // 🔎 Obtener códigos de pago
        const codigosPago = pagosAplicados.map(p => p.CodigoPago);

        // 🔎 Obtener pagos
        const pagos = await PagoModelo.findAll({
            where: {
                CodigoPago: {
                    [Op.in]: codigosPago
                }
            },
            attributes: [
                'CodigoPago',
                'CodigoFormaPago',
                'FechaPago'
            ]
        });

        // 🔎 Obtener formas de pago
        const formasPago = await FormaPago.findAll({
            attributes: [
                'CodigoFormaPago',
                'NombreFormaPago'
            ]
        });

        // 📦 Convertir a mapas
        const mapaPagos = {};
        pagos.forEach(p => {
            mapaPagos[p.CodigoPago] = p;
        });

        const mapaFormaPago = {};
        formasPago.forEach(f => {
            mapaFormaPago[f.CodigoFormaPago] = f.NombreFormaPago;
        });

        // 📦 Construir resultado
        const resultado = pagosAplicados.map((p, index) => {

            const pago = mapaPagos[p.CodigoPago];

            return {
                Correlativo: index + 1,
                Fecha: pago?.FechaPago || null,
                CodigoPago: p.CodigoPago,
                FormaPago: mapaFormaPago[pago?.CodigoFormaPago] || 'Sin forma',
                Monto: Number(p.MontoAplicado || 0)
            };

        });

        return resultado;

    } catch (error) {

        console.error(error);

        LanzarError('Error al obtener pagos del pedido', 500, 'Error');

    }

};
const ListadoEntregados = async (CodigoEmpresa, SuperAdmin, NombreEmpresa, verOtros = false, FechaInicio,
    FechaFin) => {
    try {

        let where = {
            Estatus: { [Op.in]: [1, 2, 3, 4] }
        };

        // ================= NUEVA LOGICA FECHAS =================
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

            where.FechaCreacion = {
                [Op.between]: [
                    inicioUTC,
                    finUTC
                ]
            };
        }

        if (!SuperAdmin) {

            if (verOtros) {
                // 🔥 TRAE TODAS MENOS LA MÍA
                where.CodigoEmpresa = {
                    [Op.ne]: CodigoEmpresa
                };
            } else {
                // 🔹 NORMAL
                where.CodigoEmpresa = CodigoEmpresa;
            }
        }

        const pedidos = await PedidoModelo.findAll({
            where,
            attributes: [
                'CodigoPedido',
                'CodigoEmpresa',
                'FechaCreacion',
                'FechaEntrega',
                'Subtotal',
                'Descuento',
                'Total'
            ],
            include: [
                {
                    model: ClienteModelo,
                    as: 'CaCliente',
                    attributes: ['NombreCliente']
                },
                {
                    model: EstadoPedidoModelo,
                    as: 'CaEstadoPedido',
                    attributes: ['CodigoEstadoPedido', 'NombreEstadoPedido'],
                    where: {
                        NombreEstadoPedido: 'ENTREGADO'
                    }
                },
                {
                    model: UsuarioModelo,
                    as: 'AdUsuario',
                    attributes: ['NombreUsuario']
                }
            ],
            order: [['FechaCreacion', 'DESC']]
        });

        const resultado = [];

        for (const p of pedidos) {

            const Total = Number(p.Total || 0);

            const pagos = await PagoAplicacionModelo.findAll({
                where: {
                    TipoDocumento: 'PEDIDO',
                    CodigoDocumento: p.CodigoPedido
                },
                attributes: ['MontoAplicado']
            });

            const TotalPagado = pagos.reduce(
                (sum, pago) => sum + Number(pago.MontoAplicado),
                0
            );

            const SaldoPendiente = Total - TotalPagado;

            resultado.push({
                CodigoPedido: p.CodigoPedido,
                CodigoEmpresa: p.CodigoEmpresa,
                NombreEmpresa: NombreEmpresa,
                NombreCliente: p.CaCliente?.NombreCliente || 'Sin cliente',
                FechaCreacion: UTCAGuatemala_FechaHora(p.FechaCreacion),
                FechaEntrega: FormatoFecha(p.FechaEntrega),
                Subtotal: p.Subtotal,
                Descuento: p.Descuento,
                Total: Total,
                NombreEstatus: p.CaEstadoPedido?.NombreEstadoPedido || 'Sin estado',
                Estatus: p.CaEstadoPedido?.CodigoEstadoPedido || 0,
                Usuario: p.AdUsuario?.NombreUsuario || 'Sin usuario',
                TotalPagado: TotalPagado,
                SaldoPendiente: SaldoPendiente < 0 ? 0 : SaldoPendiente
            });
        }

        return resultado;

    } catch (error) {

        throw error;
    }
};

const Listado = async (CodigoEmpresa, SuperAdmin, NombreEmpresa, verOtros = false, FechaInicio,
    FechaFin,) => {
    try {
        let where = {
            Estatus: { [Op.in]: [1, 2, 3, 4] }
        };

        if (!SuperAdmin) {

            if (verOtros) {
                // 🔥 TRAE TODAS MENOS LA MÍA
                where.CodigoEmpresa = {
                    [Op.ne]: CodigoEmpresa
                };
            } else {
                // 🔹 NORMAL (como siempre)
                where.CodigoEmpresa = CodigoEmpresa;
            }
        }
        // ================= FILTRO FECHAS =================
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

            where.FechaCreacion = {
                [Op.between]: [
                    inicioUTC,
                    finUTC
                ]
            };
        }

        const pedidos = await PedidoModelo.findAll({
            where,
            attributes: [
                'CodigoPedido',
                'CodigoEmpresa',
                'FechaCreacion',
                'FechaEntrega',
                'Subtotal',
                'Descuento',
                'Total'
            ],
            include: [
                {
                    model: ClienteModelo,
                    as: 'CaCliente',
                    attributes: ['NombreCliente']
                },
                {
                    model: EstadoPedidoModelo,
                    as: 'CaEstadoPedido',
                    attributes: ['CodigoEstadoPedido', 'NombreEstadoPedido'],
                    where: {
                        NombreEstadoPedido: {
                            [Op.notIn]: ['ENTREGADO', 'VENDIDO']
                        }
                    }
                },
                {
                    model: UsuarioModelo,
                    as: 'AdUsuario',
                    attributes: ['NombreUsuario']
                },
                // ===================== NUEVO INCLUDE =====================
                {
                    model: EmpresaModelo,
                    as: 'AdEmpresa',
                    attributes: ['NombreEmpresa']
                }
            ],

            order: [['FechaCreacion', 'DESC']]
        });

        const resultado = [];

        for (const p of pedidos) {

            const Total = Number(p.Total || 0);

            const pagos = await PagoAplicacionModelo.findAll({
                where: {
                    TipoDocumento: 'PEDIDO',
                    CodigoDocumento: p.CodigoPedido
                },
                attributes: ['MontoAplicado']
            });

            const TotalPagado = pagos.reduce(
                (sum, pago) => sum + Number(pago.MontoAplicado),
                0
            );

            const SaldoPendiente = Total - TotalPagado;

            resultado.push({
                CodigoPedido: p.CodigoPedido,
                CodigoEmpresa: p.CodigoEmpresa,
                NombreEmpresa: verOtros
                    ? (p.AdEmpresa?.NombreEmpresa || 'Sin empresa')
                    : NombreEmpresa,
                NombreCliente: p.CaCliente?.NombreCliente || 'Sin cliente',
                FechaCreacion: UTCAGuatemala_FechaHora(p.FechaCreacion),
                FechaEntrega: FormatoFecha(p.FechaEntrega),
                Subtotal: p.Subtotal,
                Descuento: p.Descuento,
                Total: Total,
                NombreEstatus: p.CaEstadoPedido?.NombreEstadoPedido || 'Sin estado',
                Estatus: p.CaEstadoPedido?.CodigoEstadoPedido || 0,
                Usuario: p.AdUsuario?.NombreUsuario || 'Sin usuario',
                TotalPagado: TotalPagado,
                SaldoPendiente: SaldoPendiente < 0 ? 0 : SaldoPendiente
            });
        }

        return resultado;

    } catch (error) {

        if (error.statusCode) throw error;

        LanzarError('Error al obtener listado de pedidos', 500);
    }
};
const Obtener = async (codigoPedido) => {
    try {

        const pedido = await PedidoModelo.findOne({

            where: {
                CodigoPedido: codigoPedido,
                Estatus: { [Op.in]: [1, 2, 3, 4] }
            },

            attributes: [
                'CodigoPedido',
                'FechaCreacion',
                'FechaEntrega',
                'Subtotal',
                'Descuento',
                'Total'
            ],

            include: [
                {
                    model: ClienteModelo,
                    as: 'CaCliente',
                    attributes: ['CodigoCliente', 'NombreCliente']
                },
                {
                    model: EstadoPedidoModelo,
                    as: 'CaEstadoPedido',
                    attributes: ['CodigoEstadoPedido', 'NombreEstadoPedido']
                },
                {
                    model: UsuarioModelo,
                    as: 'AdUsuario',
                    attributes: ['CodigoUsuario', 'NombreUsuario']
                }
            ]
        });

        if (!pedido) {
            LanzarError('Pedido no encontrado', 404, 'Advertencia');
        }

        const Total = Number(pedido.Total || 0);
        const Pagado = 0;
        const SaldoPendiente = Total - Pagado;

        return {

            CodigoPedido: pedido.CodigoPedido,

            Cliente: {
                CodigoCliente: pedido.CaCliente?.CodigoCliente || 0,
                NombreCliente: pedido.CaCliente?.NombreCliente || ''
            },

            FechaCreacion: pedido.FechaCreacion,
            FechaEntrega: pedido.FechaEntrega,

            Subtotal: pedido.Subtotal,
            Descuento: pedido.Descuento,
            Total: Total,

            Estado: {
                CodigoEstadoPedido: pedido.CaEstadoPedido?.CodigoEstadoPedido || 0,
                NombreEstadoPedido: pedido.CaEstadoPedido?.NombreEstadoPedido || ''
            },

            Usuario: {
                CodigoUsuario: pedido.AdUsuario?.CodigoUsuario || 0,
                NombreUsuario: pedido.AdUsuario?.NombreUsuario || ''
            },

            SaldoPendiente: SaldoPendiente

        };

    } catch (error) {

        console.error(error);

        LanzarError('Error al obtener pedido', 500, 'Error');

    }
};
const ListadoTipoProducto = async (NombreRol) => {

    try {

        const tipos = await TipoProducto.findAll({

            where: {
                Estatus: 1
            },

            attributes: [
                'CodigoTipoProducto',
                'NombreTipoProducto'
            ],

            order: [['NombreTipoProducto', 'ASC']]

        });

        const data = tipos.map(t => ({
            CodigoTipoProducto: t.CodigoTipoProducto,
            NombreTipoProducto: t.NombreTipoProducto
        }));

        if (NombreRol === 'EMPRESA_ASOCIADA') {

            return data.filter(t =>
                t.NombreTipoProducto === 'CONFECCION'
            );
        }

        return data;

    } catch (error) {

        console.error(error);

        LanzarError('Error al obtener tipos de producto', 500, 'Error');
    }
};
const ListadoProducto = async (CodigoTipoProducto = null) => {
    try {

        const whereProducto = {
            Estatus: 1
        };

        if (CodigoTipoProducto) {
            whereProducto.CodigoTipoProducto = CodigoTipoProducto;
        }

        const productos = await ProductoModelo.findAll({

            where: whereProducto,

            include: [
                {
                    model: InventarioModelo,
                    as: 'Inventarios',
                    attributes: [],
                    required: true,
                    where: {
                        Estatus: 1
                    }
                }
            ],

            attributes: [
                'CodigoProducto',
                'NombreProducto',
                'CodigoTipoProducto',
                [Sequelize.fn('SUM', Sequelize.col('Inventarios.StockActual')), 'StockActual']
            ],

            group: [
                'Producto.CodigoProducto',
                'Producto.NombreProducto',
                'Producto.CodigoTipoProducto'
            ],

            order: [
                ['NombreProducto', 'ASC']
            ],

            raw: true
        });

        const resultado = productos.map(p => ({
            CodigoProducto: p.CodigoProducto,
            NombreProducto: p.NombreProducto,
            CodigoTipoProducto: p.CodigoTipoProducto,
            StockActual: Number(p.StockActual) || 0
        }));


        return resultado;

    } catch (error) {
        console.error('[ListadoProducto] Error:', error);
        LanzarError('Error al obtener productos', 500, 'Error');
    }
};
const ListadoVariacionesProducto = async (CodigoProducto) => {
    try {

        if (!CodigoProducto) {
            throw new Error('CodigoProducto es requerido');
        }

        const variaciones = await InventarioModelo.findAll({

            where: {
                CodigoProducto: CodigoProducto
            },

            attributes: [
                'CodigoTipoTela',
                'CodigoTela'
            ],

            include: [
                {
                    model: TipoTelaModelo,
                    as: 'TipoTela',
                    attributes: ['NombreTipoTela']
                },
                {
                    model: TelaModelo,
                    as: 'Tela',
                    attributes: ['NombreTela']
                }
            ],

            raw: true
        });

        const tiposTelaMap = new Map();
        const telas = [];

        variaciones.forEach(v => {

            // TIPOS TELA únicos
            if (!tiposTelaMap.has(v.CodigoTipoTela)) {
                tiposTelaMap.set(v.CodigoTipoTela, {
                    CodigoTipoTela: v.CodigoTipoTela,
                    NombreTipoTela: v['TipoTela.NombreTipoTela']
                });
            }

            // TELAS
            telas.push({
                CodigoTela: v.CodigoTela,
                NombreTela: v['Tela.NombreTela'],
                CodigoTipoTela: v.CodigoTipoTela
            });

        });

        return {
            TiposTela: Array.from(tiposTelaMap.values()),
            Telas: telas
        };

    } catch (error) {
        console.error('[ListadoVariacionesProducto] Error:', error);
        throw error;
    }
};
const ListadoTipoTela = async () => {

    try {

        const tipos = await TipoTela.findAll({

            where: {
                Estatus: 1
            },

            attributes: [
                'CodigoTipoTela',
                'NombreTipoTela'
            ],

            order: [['NombreTipoTela', 'ASC']]

        });

        return tipos.map(t => ({
            CodigoTipoTela: t.CodigoTipoTela,
            NombreTipoTela: t.NombreTipoTela
        }));

    } catch (error) {

        console.error(error);

        LanzarError('Error al obtener tipos de tela', 500, 'Error');

    }

};
const ListadoTela = async () => {

    try {

        const telas = await Tela.findAll({

            where: {
                Estatus: 1
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

        console.error(error);

        LanzarError('Error al obtener nombres de tela', 500, 'Error');

    }

};
const ListadoTipoCuello = async () => {

    try {

        const tiposCuello = await TipoCuello.findAll({

            where: {
                Estatus: 1
            },

            attributes: [
                'CodigoTipoCuello',
                'NombreTipoCuello'
            ],

            order: [['NombreTipoCuello', 'ASC']]

        });

        return tiposCuello.map(t => ({
            CodigoTipoCuello: t.CodigoTipoCuello,
            NombreTipoCuello: t.NombreTipoCuello
        }));

    } catch (error) {

        console.error('ERROR ListadoTipoCuello:', error);
        throw error;

    }

};
const ListadoEstadoPedido = async () => {

    try {

        const estadosPedido = await EstadoPedido.findAll({

            where: {
                Estatus: 1,
                NombreEstadoPedido: {
                    [Op.ne]: 'VENDIDO'
                }
            },

            attributes: [
                'CodigoEstadoPedido',
                'NombreEstadoPedido'
            ],

            order: [
                [
                    literal(`CASE 
                        WHEN NombreEstadoPedido = 'ENTREGADO' THEN 1 
                        ELSE 0 
                    END`),
                    'ASC'
                ],
                ['NombreEstadoPedido', 'ASC']
            ]

        });

        return estadosPedido.map(e => ({
            CodigoEstadoPedido: e.CodigoEstadoPedido,
            NombreEstadoPedido: e.NombreEstadoPedido
        }));

    } catch (error) {

        console.error('ERROR ListadoEstadoPedido:', error);
        throw error;

    }

};
const ObtenerProducto = async (codigoProducto, codigoTela = null, codigoTipoTela = null) => {
    try {

        if (!codigoProducto)
            LanzarError('El código del producto es obligatorio', 400, 'Advertencia');

        const producto = await ProductoModelo.findOne({
            where: { CodigoProducto: codigoProducto },
            attributes: ['CodigoProducto', 'NombreProducto'],
            include: [
                {
                    model: TipoProductoModelo,
                    as: 'TipoProducto',
                    attributes: ['NombreTipoProducto']
                }
            ]
        });

        if (!producto)
            LanzarError('Producto no encontrado', 404, 'Advertencia');

        const tipoProducto = (producto.TipoProducto?.NombreTipoProducto || '').toUpperCase();

        if (!tipoProducto)
            LanzarError('El tipo de producto no está configurado correctamente', 400, 'Advertencia');

        let inventario = null;

        // ===================== FISICO =====================
        if (tipoProducto === 'FISICO') {

            inventario = await InventarioModelo.findOne({
                where: {
                    CodigoProducto: codigoProducto,
                    CodigoTipoTela: null,
                    CodigoTela: null
                },
                attributes: ['PrecioVenta']
            });

        }
        // ===================== CONFECCION =====================
        else if (tipoProducto === 'CONFECCION') {

            if (!codigoTela || !codigoTipoTela)
                LanzarError('La variación de tela es obligatoria para productos de confección', 400, 'Advertencia');

            inventario = await InventarioModelo.findOne({
                where: {
                    CodigoProducto: codigoProducto,
                    CodigoTipoTela: codigoTipoTela,
                    CodigoTela: codigoTela
                },
                attributes: ['PrecioVenta']
            });

        }
        else {
            LanzarError(`Tipo de producto no válido: ${tipoProducto}`, 400, 'Advertencia');
        }

        if (!inventario)
            LanzarError('No se encontró la variación del producto con precio', 404, 'Advertencia');

        return {
            NombreProducto: producto.NombreProducto,
            Precio: inventario.PrecioVenta
        };

    } catch (error) {
        throw error;
    }
};
const ListadoCliente = async (CodigoEmpresa, SuperAdmin) => {

    try {

        let where = {
            Estatus: 1
        };

        // 🔥 FILTRO MULTIEMPRESA
        if (!SuperAdmin) {
            where.CodigoEmpresa = CodigoEmpresa;
        }

        const clientes = await Cliente.findAll({

            where,

            attributes: [
                'CodigoCliente',
                'NombreCliente'
            ],

            order: [['NombreCliente', 'ASC']]

        });

        return clientes.map(c => ({
            CodigoCliente: c.CodigoCliente,
            NombreCliente: c.NombreCliente
        }));

    } catch (error) {

        console.error(error);
        LanzarError('Error al obtener clientes', 500, 'Error');

    }

};
const ListadoFormaPago = async () => {
    try {
        const formas = await FormaPago.findAll({
            where: {
                Estatus: 1
            },
            attributes: [
                'CodigoFormaPago',
                'NombreFormaPago'
            ],
            order: [['NombreFormaPago', 'ASC']]
        });

        return formas.map(f => ({
            CodigoFormaPago: f.CodigoFormaPago,
            NombreFormaPago: f.NombreFormaPago
        }));

    } catch (error) {
        console.error(error);
        LanzarError('Error al obtener formas de pago', 500, 'Error');
    }
};

module.exports = {
    Listado, Obtener, ListadoTipoProducto, ListadoTipoTela,
    ListadoTela, ListadoProducto, ObtenerProducto, ListadoCliente, CrearPedido, ListadoTipoCuello,
    ObtenerPedido, ActualizarPedido, ListadoFormaPago, RegistrarPagoPedido, ListarPagosPorPedido,
    EliminarPedido, ListadoEstadoPedido, ListadoEntregados, GenerarPDFPedido, GenerarPDFPagoPedido,
    ObtenerDatosImpresionPagoPedido, ListadoVariacionesProducto
};