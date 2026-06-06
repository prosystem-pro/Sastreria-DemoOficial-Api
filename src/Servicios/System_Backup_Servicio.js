const Sequelize = require('sequelize');
const BaseDatos = require('../BaseDatos/ConexionBaseDatos');
const { LanzarError } = require('../Utilidades/ErrorServicios');
const { DateTime } = require('luxon');

const EscaparValor = (valor) => {
    if (valor === null || valor === undefined) return 'NULL';

    // 🛑 CLAVE: Si es Buffer (Binario / Hash de contraseña), lo escribe tal cual como 0x... SIN COMILLAS NI N''
    if (Buffer.isBuffer(valor)) {
        return `0x${valor.toString('hex')}`;
    }

    if (valor instanceof Date) {
        return `'${valor.toISOString().slice(0, 19).replace('T', ' ')}'`;
    }
    if (typeof valor === 'boolean') return valor ? '1' : '0';
    if (typeof valor === 'number') return valor;

    // Texto normal: Se escapa con comillas simples
    return `'${String(valor).replace(/'/g, "''")}'`;
};

const RespaldoCompleto = async () => {
    try {
        const nombreBD = BaseDatos.config.database;
        let sql = '';
        const resumen = { tablas_procesadas: 0, total_registros: 0 };

        // 🔹 SOLO LO INDISPENSABLE: Conectar a la base
        sql += `USE [${nombreBD}]\nGO\n\n`;

        const tablas = await BaseDatos.query(`
            SELECT 
                TABLE_SCHEMA AS Esquema, 
                TABLE_NAME AS Tabla
            FROM INFORMATION_SCHEMA.TABLES
            WHERE TABLE_TYPE = 'BASE TABLE'
              AND TABLE_NAME NOT IN ('sysdiagrams','dtproperties','__EFMigrationsHistory')
            ORDER BY 
                CASE 
                    WHEN TABLE_NAME IN ('Empresa', 'Rol', 'Permiso', 'Recurso', 'TipoEmpresa', 'TipoProducto', 'TipoTela', 'FormaPago', 'EstadoPedido') THEN 1
                    ELSE 2 
                END,
                TABLE_SCHEMA, TABLE_NAME
        `, { type: Sequelize.QueryTypes.SELECT });

        if (!tablas || tablas.length === 0) LanzarError('No se encontraron tablas', 404);

        for (const { Esquema, Tabla } of tablas) {
            const columnas = await BaseDatos.query(`
                SELECT COLUMN_NAME, 
                       COLUMNPROPERTY(OBJECT_ID('[${Esquema}].[${Tabla}]'), COLUMN_NAME, 'IsIdentity') AS EsIdentity
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = '${Esquema}' AND TABLE_NAME = '${Tabla}'
                ORDER BY ORDINAL_POSITION
            `, { type: Sequelize.QueryTypes.SELECT });

            const tieneIdentity = columnas.some(c => c.EsIdentity === 1);
            const registros = await BaseDatos.query(`SELECT * FROM [${Esquema}].[${Tabla}]`, { type: Sequelize.QueryTypes.SELECT });

            // 🔹 SI NO HAY DATOS: NO ESCRIBIMOS NADA, AHORRAMOS ESPACIO
            if (registros.length === 0) continue;

            resumen.tablas_procesadas++;
            resumen.total_registros += registros.length;

            const nombresCols = columnas.map(c => `[${c.COLUMN_NAME}]`).join(', ');

            // 🔹 ACTIVAR IDENTITY SOLO SI ES NECESARIO
            if (tieneIdentity) sql += `SET IDENTITY_INSERT [${Esquema}].[${Tabla}] ON;\n`;

            // 🔹 GENERAR LOS INSERT (de 100 en 100 para no saturar)
            for (let i = 0; i < registros.length; i += 100) {
                const lote = registros.slice(i, i + 100);
                const valores = lote.map(reg => `(${columnas.map(c => EscaparValor(reg[c.COLUMN_NAME])).join(', ')})`);
                sql += `INSERT INTO [${Esquema}].[${Tabla}] (${nombresCols}) VALUES\n${valores.join(',\n')};\n`;
            }

            // 🔹 DESACTIVAR IDENTITY Y SEPARAR LÓGICAMENTE CON GO
            if (tieneIdentity) sql += `SET IDENTITY_INSERT [${Esquema}].[${Tabla}] OFF;\n`;
            sql += `GO\n\n`;
        }

        const nombreArchivo = `${process.env.NOMBRE_EMPRESA || 'NO SE ENCONTRO EL NOMBRE'} - Respaldo Completo (PERSONALIZADO) - ${DateTime.now().setZone('America/Guatemala').toFormat('yyyy-MM-dd HH.mm')}.sql`;

        return { contenidoSQL: sql, nombreArchivo, resumen };

    } catch (error) {
        throw new Error(`ERROR AL GENERAR RESPALDO: ${error.message}`);
    }
};

const RestaurarRespaldoCompleto = async (contenidoSQL) => {

    // 🛑 AHORA EL RESPALDO ES LIMPIO: Solo separamos por GO y quitamos espacios vacíos
    // Ya NO necesitamos filtrar comentarios porque ya no existen en el archivo
    let lotes = contenidoSQL
        .split(/^GO\s*$/m)
        .map(l => l.trim())
        .filter(l => l.length > 0); // Solo quitamos bloques vacíos


    // 🔍 DETECCIÓN CONFIABLE: Ahora SÍ es 100% seguro porque cada tabla está en su propio lote
    const existeLoteEmpresa = lotes.some(l => l.includes('INSERT INTO [Ad].[Empresa]'));

    if (lotes.length === 0) {
        LanzarError('El archivo SQL no contiene sentencias válidas', 400);
    }

    const conexion = await BaseDatos.connectionManager.getConnection();
    const { Request } = require('tedious');

    try {

        await new Promise((resolve, reject) => {
            const req = new Request(`
                DECLARE @sql NVARCHAR(MAX) = N'';
                SELECT @sql += N'ALTER TABLE ' + QUOTENAME(TABLE_SCHEMA) + '.' + QUOTENAME(TABLE_NAME) + ' NOCHECK CONSTRAINT ALL;'
                FROM INFORMATION_SCHEMA.TABLES
                WHERE TABLE_TYPE = 'BASE TABLE' 
                  AND TABLE_SCHEMA IN ('Ad', 'Op', 'Inv', 'Fn', 'Ca');
                IF @sql <> N'' EXEC sp_executesql @sql;
            `, (err) => {
                if (err) return reject(err);
                resolve();
            });
            conexion.execSql(req);
        });

        const tablas = await BaseDatos.query(`
            SELECT 
                TABLE_SCHEMA AS Esquema, 
                TABLE_NAME AS Tabla,
                TABLE_SCHEMA + '.' + TABLE_NAME AS NombreCompleto
            FROM INFORMATION_SCHEMA.TABLES
            WHERE TABLE_TYPE = 'BASE TABLE' 
              AND TABLE_NAME NOT IN ('sysdiagrams','dtproperties','__EFMigrationsHistory')
              AND TABLE_SCHEMA IN ('Ad', 'Op', 'Inv', 'Fn', 'Ca')
            ORDER BY 
                -- 🔄 MISMO ORDEN QUE EL RESPALDO: Primero tablas maestras
                CASE 
                    WHEN TABLE_NAME IN ('Empresa', 'Rol', 'Permiso', 'Recurso', 'TipoEmpresa', 'TipoProducto', 'TipoTela', 'FormaPago', 'EstadoPedido') THEN 2
                    ELSE 1 
                END,
                TABLE_SCHEMA, TABLE_NAME
        `, { type: Sequelize.QueryTypes.SELECT });

        for (const { Esquema, Tabla, NombreCompleto } of tablas) {
            try {
                const esTablaMaestra = ['Empresa', 'Rol', 'Permiso', 'Recurso', 'TipoEmpresa', 'TipoProducto', 'TipoTela', 'FormaPago', 'EstadoPedido'].includes(Tabla);

                await new Promise((resolve) => {
                    let sqlLimpieza;
                    if (esTablaMaestra) {
                        // ✅ Limpieza y reinicio de identidad si aplica
                        sqlLimpieza = `DELETE FROM [${Esquema}].[${Tabla}]; 
                                       IF EXISTS (SELECT * FROM sys.identity_columns WHERE OBJECT_ID = OBJECT_ID('${Esquema}.${Tabla}'))
                                       DBCC CHECKIDENT ('${Esquema}.${Tabla}', RESEED, 0);`;
                    } else {
                        // ✅ Intenta TRUNCATE (más rápido) y si falla por restricciones, usa DELETE
                        sqlLimpieza = `BEGIN TRY TRUNCATE TABLE [${Esquema}].[${Tabla}]; END TRY BEGIN CATCH DELETE FROM [${Esquema}].[${Tabla}]; END CATCH;`;
                    }

                    const req = new Request(sqlLimpieza, () => resolve());
                    conexion.execSql(req);
                });

            } catch (e) {

            }
        }

        for (let lote of lotes) {
            if (lote.trim().length < 5) continue;

            // 🔎 Identificamos la tabla del lote actual
            const matchTabla = lote.match(/INSERT INTO \[(\w+)\]\.\[(\w+)\]/);
            let sentencia = lote;
            let nombreTablaLote = 'desconocida';

            if (matchTabla) {
                const esquema = matchTabla[1];
                const tabla = matchTabla[2];
                nombreTablaLote = `${esquema}.${tabla}`;

                // 🚀 MEJORA CLAVE: Como el respaldo YA trae SET IDENTITY_INSERT, YA NO LO AGREGAMOS AQUÍ
                // Solo ejecutamos lo que viene, porque ya está perfecto.
                sentencia = lote;
            }

            await new Promise((resolve) => {
                const req = new Request(sentencia, (err) => {
                    if (err) {
                        if (nombreTablaLote === 'Ad.Empresa') {
                            console.error(`❌ CRÍTICO: No se pudo insertar Ad.Empresa -> ${err.message}`);
                        }
                    } else {
                        if (nombreTablaLote === 'Ad.Empresa') {
                        } else if (nombreTablaLote !== 'desconocida') {
                        }
                    }
                    resolve();
                });
                conexion.execSql(req);
            });
        }

        try {
            await new Promise((resolve) => {
                const req = new Request(`
                    DECLARE @sql2 NVARCHAR(MAX) = N'';
                    SELECT @sql2 += N'ALTER TABLE ' + QUOTENAME(TABLE_SCHEMA) + '.' + QUOTENAME(TABLE_NAME) + ' CHECK CONSTRAINT ALL;'
                    FROM INFORMATION_SCHEMA.TABLES
                    WHERE TABLE_TYPE = 'BASE TABLE' 
                      AND TABLE_SCHEMA IN ('Ad', 'Op', 'Inv', 'Fn', 'Ca');
                    IF @sql2 <> N'' EXEC sp_executesql @sql2;
                `, () => resolve());
                conexion.execSql(req);
            });
        } catch (e) {
        }

        return { estado: 'OK', mensaje: 'Restauración completa', totalSentencias: lotes.length };

    } catch (error) {
        console.error('❌ ERROR:', error.message);
        throw error;
    } finally {
        BaseDatos.connectionManager.releaseConnection(conexion);
    }
};

const RespaldoPorMes = async (anio, mes) => {
    try {
        // ✅ 1. VALIDACIÓN DE ENTRADA
        if (!anio || !mes || mes < 1 || mes > 12) {
            LanzarError('Debe proporcionar Año y Mes válidos (ej: anio:2025, mes:1)', 400);
        }

        // ✅ 2. DEFINIR RANGO DE FECHAS PARA EL FILTRO
        const fechaInicio = DateTime.fromObject({ year: anio, month: mes, day: 1 }).setZone('America/Guatemala').startOf('month');
        const fechaFin = fechaInicio.endOf('month');

        // Formato para SQL: '2025-01-01 00:00:00' y '2025-01-31 23:59:59'
        const fechaInicioSQL = fechaInicio.toSQL().slice(0, 19).replace('T', ' ');
        const fechaFinSQL = fechaFin.toSQL().slice(0, 19).replace('T', ' ');

        const nombreBD = BaseDatos.config.database;
        let sql = '';
        const resumen = {
            anio_respaldado: anio,
            mes_respaldado: mes,
            tablas_maestras: 0,
            tablas_transaccionales: 0,
            total_registros: 0
        };

        sql += `USE [${nombreBD}]\nGO\n\n`;

        // ─────────────────────────────────────────────────────────────────────────────
        // ✅ CLASIFICACIÓN DEFINITIVA (TAL COMO LA DEJAMOS VALIDADA)
        // ─────────────────────────────────────────────────────────────────────────────
        const TABLAS_MAESTRAS = [
            'Ad.Empresa', 'Ad.Permiso', 'Ad.PermisoRolRecurso', 'Ad.Recurso', 'Ad.Rol', 'Ad.Usuario',
            'Ca.Abertura', 'Ca.Boton', 'Ca.Categoria', 'Ca.Cliente', 'Ca.Color', 'Ca.EstadoPedido',
            'Ca.Estilo', 'Ca.FormaPago', 'Ca.Marca', 'Ca.Producto', 'Ca.Talla', 'Ca.Tamano', 'Ca.Tela',
            'Ca.TipoCorte', 'Ca.TipoCuello', 'Ca.TipoEmpresa', 'Ca.TipoMedida', 'Ca.TipoProducto',
            'Ca.TipoSolapa', 'Ca.TipoTela',
            'Inv.Inventario' // ✅ AQUÍ ESTÁ, COMO LO PEDISTE, ES CATÁLOGO/STOCK
        ];

        const TABLAS_TRANSACCIONALES = [
            {
                nombre: 'Ad.Pagos',
                esquema: 'Ad',
                tabla: 'Pagos',
                // ✅ CAMPO DE FECHA ELEGIDO: FechaDeposito (la real del movimiento)
                filtroFecha: `FechaDeposito BETWEEN '${fechaInicioSQL}' AND '${fechaFinSQL}'`
            },
            {
                nombre: 'Fn.Pago',
                esquema: 'Fn',
                tabla: 'Pago',
                // ✅ CAMPO DE FECHA: FechaPago
                filtroFecha: `FechaPago BETWEEN '${fechaInicioSQL}' AND '${fechaFinSQL}'`
            },
            {
                nombre: 'Fn.PagoAplicacion',
                esquema: 'Fn',
                tabla: 'PagoAplicacion',
                // ✅ LÓGICA ESPECIAL: No tiene fecha, se une con Pedido por CodigoDocumento
                filtroFecha: `EXISTS (
                    SELECT 1 FROM Op.Pedido p 
                    WHERE p.CodigoPedido = [Fn].[PagoAplicacion].CodigoDocumento 
                    AND p.FechaCreacion BETWEEN '${fechaInicioSQL}' AND '${fechaFinSQL}'
                )`
            },
            {
                nombre: 'Inv.MovimientoInventario',
                esquema: 'Inv',
                tabla: 'MovimientoInventario',
                // ✅ CAMPO DE FECHA: FechaMovimiento
                filtroFecha: `FechaMovimiento BETWEEN '${fechaInicioSQL}' AND '${fechaFinSQL}'`
            },
            {
                nombre: 'Op.Pedido',
                esquema: 'Op',
                tabla: 'Pedido',
                // ✅ CAMPO DE FECHA REINA: FechaCreacion
                filtroFecha: `FechaCreacion BETWEEN '${fechaInicioSQL}' AND '${fechaFinSQL}'`
            },
            {
                nombre: 'Op.PedidoDetalle',
                esquema: 'Op',
                tabla: 'PedidoDetalle',
                // ✅ SE UNE A PEDIDO
                filtroFecha: `EXISTS (
                    SELECT 1 FROM Op.Pedido p 
                    WHERE p.CodigoPedido = [Op].[PedidoDetalle].CodigoPedido 
                    AND p.FechaCreacion BETWEEN '${fechaInicioSQL}' AND '${fechaFinSQL}'
                )`
            },
            {
                nombre: 'Op.PedidoDetalleMedida',
                esquema: 'Op',
                tabla: 'PedidoDetalleMedida',
                // ✅ SE UNE A DETALLE -> PEDIDO
                filtroFecha: `EXISTS (
                    SELECT 1 FROM Op.Pedido p 
                    INNER JOIN Op.PedidoDetalle pd ON pd.CodigoPedido = p.CodigoPedido
                    WHERE pd.CodigoPedidoDetalle = [Op].[PedidoDetalleMedida].CodigoPedidoDetalle 
                    AND p.FechaCreacion BETWEEN '${fechaInicioSQL}' AND '${fechaFinSQL}'
                )`
            }
        ];

        // ─────────────────────────────────────────────────────────────────────────────
        // 🔹 PROCESAR TABLAS MAESTRAS (SELECCION * SIN FILTRO)
        // ─────────────────────────────────────────────────────────────────────────────
        for (const nombreCompleto of TABLAS_MAESTRAS) {
            const [Esquema, Tabla] = nombreCompleto.split('.');

            // Obtener columnas e identidad (igual que tu respaldo completo)
            const columnas = await BaseDatos.query(`
                SELECT COLUMN_NAME, COLUMNPROPERTY(OBJECT_ID('[${Esquema}].[${Tabla}]'), COLUMN_NAME, 'IsIdentity') AS EsIdentity
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = '${Esquema}' AND TABLE_NAME = '${Tabla}'
                ORDER BY ORDINAL_POSITION
            `, { type: Sequelize.QueryTypes.SELECT });

            const tieneIdentity = columnas.some(c => c.EsIdentity === 1);

            // 🔹 AQUÍ LA DIFERENCIA: SELECCIONA TODO, SIN WHERE
            const registros = await BaseDatos.query(`SELECT * FROM [${Esquema}].[${Tabla}]`, { type: Sequelize.QueryTypes.SELECT });

            if (registros.length === 0) continue;

            resumen.tablas_maestras++;
            resumen.total_registros += registros.length;
            const nombresCols = columnas.map(c => `[${c.COLUMN_NAME}]`).join(', ');

            if (tieneIdentity) sql += `SET IDENTITY_INSERT [${Esquema}].[${Tabla}] ON;\n`;

            // Lotes de 100 igual que tu código
            for (let i = 0; i < registros.length; i += 100) {
                const lote = registros.slice(i, i + 100);
                const valores = lote.map(reg => `(${columnas.map(c => EscaparValor(reg[c.COLUMN_NAME])).join(', ')})`);
                sql += `INSERT INTO [${Esquema}].[${Tabla}] (${nombresCols}) VALUES\n${valores.join(',\n')};\n`;
            }

            if (tieneIdentity) sql += `SET IDENTITY_INSERT [${Esquema}].[${Tabla}] OFF;\n`;
            sql += `GO\n\n`;
        }

        // ─────────────────────────────────────────────────────────────────────────────
        // 🔹 PROCESAR TABLAS TRANSACCIONALES (SELECCION * CON FILTRO DE FECHA)
        // ─────────────────────────────────────────────────────────────────────────────
        for (const tablaTrans of TABLAS_TRANSACCIONALES) {
            const { esquema, tabla, filtroFecha } = tablaTrans;

            const columnas = await BaseDatos.query(`
                SELECT COLUMN_NAME, COLUMNPROPERTY(OBJECT_ID('[${esquema}].[${tabla}]'), COLUMN_NAME, 'IsIdentity') AS EsIdentity
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = '${esquema}' AND TABLE_NAME = '${tabla}'
                ORDER BY ORDINAL_POSITION
            `, { type: Sequelize.QueryTypes.SELECT });

            const tieneIdentity = columnas.some(c => c.EsIdentity === 1);

            // 🔹 AQUÍ LA MAGIA: SELECCIONA SOLO LO DEL MES ELEGIDO
            const registros = await BaseDatos.query(`
                SELECT * 
                FROM [${esquema}].[${tabla}] 
                WHERE ${filtroFecha}
            `, { type: Sequelize.QueryTypes.SELECT });

            if (registros.length === 0) {
                continue;
            }

            resumen.tablas_transaccionales++;
            resumen.total_registros += registros.length;
            const nombresCols = columnas.map(c => `[${c.COLUMN_NAME}]`).join(', ');

            if (tieneIdentity) sql += `SET IDENTITY_INSERT [${esquema}].[${tabla}] ON;\n`;

            for (let i = 0; i < registros.length; i += 100) {
                const lote = registros.slice(i, i + 100);
                const valores = lote.map(reg => `(${columnas.map(c => EscaparValor(reg[c.COLUMN_NAME])).join(', ')})`);
                sql += `INSERT INTO [${esquema}].[${tabla}] (${nombresCols}) VALUES\n${valores.join(',\n')};\n`;
            }

            if (tieneIdentity) sql += `SET IDENTITY_INSERT [${esquema}].[${tabla}] OFF;\n`;
            sql += `GO\n\n`;
        }

        // ✅ NOMBRE DEL ARCHIVO (INDICA EL MES RESPALDADO)
        const nombreMesLargo = fechaInicio.toFormat('MMMM');
        const nombreArchivo = `${process.env.NOMBRE_EMPRESA || 'EMPRESA'} - Respaldo Mensual - ${anio}-${mes.toString().padStart(2, '0')} (${nombreMesLargo}) - ${DateTime.now().setZone('America/Guatemala').toFormat('yyyy-MM-dd HH.mm')}.sql`;

        return {
            contenidoSQL: sql,
            nombreArchivo,
            resumen,
            rango_respaldado: `${fechaInicioSQL} al ${fechaFinSQL}`
        };

    } catch (error) {
        throw new Error(`ERROR AL GENERAR RESPALDO MENSUAL: ${error.message}`);
    }
};

const BorrarDatosPorMes = async (anio, mes) => {
    try {
        if (!anio || !mes || mes < 1 || mes > 12) {
            LanzarError('Año y Mes inválidos para borrar', 400);
        }

        // 📅 CONFIGURACIÓN DE FECHAS: Rango completo del mes en zona Guatemala
        const fechaInicio = new Date(Date.UTC(anio, mes - 1, 1, 6, 0, 0)); 
        const fechaFin = new Date(Date.UTC(anio, mes, 0, 29, 59, 59)); 
        const fechaInicioSQL = fechaInicio.toISOString().slice(0, 19).replace('T', ' ');
        const fechaFinSQL = fechaFin.toISOString().slice(0, 19).replace('T', ' ');

        const conexion = await BaseDatos.connectionManager.getConnection();
        const { Request } = require('tedious');
        let registrosBorrados = 0;


        // ✅ ORDEN ESTRICTO DE BORRADO (HIJOS PRIMERO, LUEGO PADRES)
        // ✅ ESTRUCTURA BASADA EXACTAMENTE EN TUS INDICACIONES
        const ORDEN_BORRADO = [
            {
                nombre: 'Op.PedidoDetalleMedida',
                query: `
                    DELETE pdm 
                    FROM Op.PedidoDetalleMedida pdm
                    INNER JOIN Op.PedidoDetalle pd ON pd.CodigoPedidoDetalle = pdm.CodigoPedidoDetalle
                    INNER JOIN Op.Pedido p ON p.CodigoPedido = pd.CodigoPedido
                    -- 🎯 FILTRO CORRECTO: Solo por fecha del Pedido Padre
                    WHERE p.FechaCreacion BETWEEN '${fechaInicioSQL}' AND '${fechaFinSQL}'
                `
            },
            {
                nombre: 'Op.PedidoDetalle',
                query: `
                    DELETE pd 
                    FROM Op.PedidoDetalle pd
                    INNER JOIN Op.Pedido p ON p.CodigoPedido = pd.CodigoPedido
                    -- 🎯 FILTRO CORRECTO: Esta tabla NO tiene fecha, se filtra por Pedido
                    WHERE p.FechaCreacion BETWEEN '${fechaInicioSQL}' AND '${fechaFinSQL}'
                `
            },
            {
                nombre: 'Fn.PagoAplicacion',
                query: `
                    DELETE pa 
                    FROM Fn.PagoAplicacion pa
                    INNER JOIN Op.Pedido p ON p.CodigoPedido = pa.CodigoDocumento
                    -- 🎯 FILTRO CORRECTO: Tabla intermedia sin fecha, ligada al Pedido
                    WHERE p.FechaCreacion BETWEEN '${fechaInicioSQL}' AND '${fechaFinSQL}'
                `
            },
            {
                nombre: 'Inv.MovimientoInventario',
                // 📌 CAMPO CORRECTO SEGÚN TU DATO: FechaMovimiento
                query: `DELETE FROM Inv.MovimientoInventario WHERE FechaMovimiento BETWEEN '${fechaInicioSQL}' AND '${fechaFinSQL}'`
            },
            {
                nombre: 'Fn.Pago',
                // 📌 CAMPO CORRECTO SEGÚN TU DATO: FechaPago (Usamos esta, si prefieres FechaCreacion me dices)
                query: `DELETE FROM Fn.Pago WHERE FechaPago BETWEEN '${fechaInicioSQL}' AND '${fechaFinSQL}'`
            },
            {
                nombre: 'Ad.Pagos',
                // 📌 CAMPO CORRECTO SEGÚN TU DATO: FechaDeposito
                query: `DELETE FROM Ad.Pagos WHERE FechaDeposito BETWEEN '${fechaInicioSQL}' AND '${fechaFinSQL}'`
            },
            {
                nombre: 'Op.Pedido',
                // 📌 CAMPO CORRECTO PRINCIPAL: FechaCreacion (Como me indicaste)
                query: `DELETE FROM Op.Pedido WHERE FechaCreacion BETWEEN '${fechaInicioSQL}' AND '${fechaFinSQL}'`
            }
        ];

        // EJECUCIÓN
        for (const tabla of ORDEN_BORRADO) {
            await new Promise((resolve, reject) => {
                const req = new Request(tabla.query, (err, rowCount) => {
                    if (err) return reject(new Error(`Error borrando ${tabla.nombre}: ${err.message}`));
                    registrosBorrados += rowCount;
                    resolve();
                });
                conexion.execSql(req);
            });
        }

        BaseDatos.connectionManager.releaseConnection(conexion);

        // 🚨 MENSAJE FINAL
        if (registrosBorrados === 0) {
            const error = new Error(`ℹ️ Atención: No se encontraron registros para el mes ${mes}/${anio}.`);
            error.tipo = 'Alerta';
            throw error;
        }

        return { 
            mensaje: `✅ Borrado completado. Total registros eliminados: ${registrosBorrados}`, 
            registrosBorrados 
        };

    } catch (error) {
        throw error;
    }
};



module.exports = {
    RespaldoCompleto,
    RestaurarRespaldoCompleto,
    RespaldoPorMes,
    BorrarDatosPorMes
};
