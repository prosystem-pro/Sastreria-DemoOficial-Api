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
        // ⬇️⬇️⬇️ CAMBIO: Guardamos hora de inicio para calcular duración
        const horaInicio = DateTime.now().setZone('America/Guatemala');
        const nombreBD = BaseDatos.config.database;
        let sql = '';

        // ⬇️⬇️⬇️ CAMBIO: Resumen ampliado con todos los datos para el informe
        const resumen = {
            fecha_inicio: horaInicio.toFormat('yyyy-MM-dd HH:mm:ss'),
            base_datos: nombreBD,
            total_tablas_encontradas: 0,
            tablas_procesadas: 0,
            tablas_vacias: [],       // Lista de tablas sin registros
            tablas_con_datos: [],    // Lista de tablas que sí se respaldaron
            total_registros: 0,
            duracion_segundos: 0,
            estado: 'PENDIENTE'
        };

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

        // ⬇️⬇️⬇️ CAMBIO: Guardamos cuántas tablas hay en total
        resumen.total_tablas_encontradas = tablas.length;

        if (!tablas || tablas.length === 0) {
            resumen.estado = 'ERROR';
            LanzarError('No se encontraron tablas en la base de datos', 404);
        }

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

            // 🔹 SI NO HAY DATOS: Guardamos en la lista de vacías y continuamos
            if (registros.length === 0) {
                resumen.tablas_vacias.push(`[${Esquema}].[${Tabla}]`);
                continue;
            }

            // ⬇️⬇️⬇️ CAMBIO: Actualizamos contadores y listas
            resumen.tablas_procesadas++;
            resumen.total_registros += registros.length;
            resumen.tablas_con_datos.push(`[${Esquema}].[${Tabla}] (${registros.length} registros)`);

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

        // ⬇️⬇️⬇️ CAMBIO: Calculamos duración y marcamos como exitoso
        const horaFin = DateTime.now().setZone('America/Guatemala');
        resumen.duracion_segundos = horaFin.diff(horaInicio, 'seconds').seconds.toFixed(2);
        resumen.estado = 'EXITOSO';

        const nombreArchivo = `${process.env.NOMBRE_EMPRESA || 'NO SE ENCONTRO EL NOMBRE'} - Respaldo Completo (PERSONALIZADO) - ${horaInicio.toFormat('yyyy-MM-dd HH.mm')}.sql`;

        // ⬇️⬇️⬇️ CAMBIO: Devolvemos también el resumen completo
        return { contenidoSQL: sql, nombreArchivo, resumen };

    } catch (error) {
        // ⬇️⬇️⬇️ CAMBIO: En caso de error también devolvemos resumen
        const resumenError = {
            fecha: DateTime.now().setZone('America/Guatemala').toFormat('yyyy-MM-dd HH:mm:ss'),
            base_datos: BaseDatos.config.database || 'Desconocida',
            estado: 'FALLIDO',
            error: error.message
        };
        // Lanzamos el error junto con el resumen
        throw { message: error.message, resumen: resumenError };
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
        if (!anio || !mes || mes < 1 || mes > 12) {
            LanzarError('Debe proporcionar Año y Mes válidos (ej: anio:2025, mes:1)', 400);
        }

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

        const TABLAS_MAESTRAS = [
            'Ad.Empresa', 'Ad.Permiso', 'Ad.PermisoRolRecurso', 'Ad.Recurso', 'Ad.Rol', 'Ad.Usuario',
            'Ca.Abertura', 'Ca.Boton', 'Ca.Categoria', 'Ca.Cliente', 'Ca.Color', 'Ca.EstadoPedido',
            'Ca.Estilo', 'Ca.FormaPago', 'Ca.Marca', 'Ca.Producto', 'Ca.Talla', 'Ca.Tamano', 'Ca.Tela',
            'Ca.TipoCorte', 'Ca.TipoCuello', 'Ca.TipoEmpresa', 'Ca.TipoMedida', 'Ca.TipoProducto',
            'Ca.TipoSolapa', 'Ca.TipoTela',
            'Inv.Inventario'
        ];

        const TABLAS_TRANSACCIONALES = [
            {
                nombre: 'Ad.Pagos',
                esquema: 'Ad',
                tabla: 'Pagos',
                filtroFecha: `YEAR(FechaDeposito) = ${anio} AND MONTH(FechaDeposito) = ${mes}`
            },
            {
                nombre: 'Fn.Pago',
                esquema: 'Fn',
                tabla: 'Pago',
                filtroFecha: `YEAR(FechaPago) = ${anio} AND MONTH(FechaPago) = ${mes}`
            },
            {
                nombre: 'Fn.PagoAplicacion',
                esquema: 'Fn',
                tabla: 'PagoAplicacion',
                filtroFecha: `EXISTS (
                    SELECT 1 FROM Op.Pedido p 
                    WHERE p.CodigoPedido = [Fn].[PagoAplicacion].CodigoDocumento 
                    AND YEAR(p.FechaCreacion) = ${anio} AND MONTH(p.FechaCreacion) = ${mes}
                )`
            },
            {
                nombre: 'Inv.MovimientoInventario',
                esquema: 'Inv',
                tabla: 'MovimientoInventario',
                filtroFecha: `YEAR(FechaMovimiento) = ${anio} AND MONTH(FechaMovimiento) = ${mes}`
            },
            {
                nombre: 'Op.Pedido',
                esquema: 'Op',
                tabla: 'Pedido',
                filtroFecha: `YEAR(FechaCreacion) = ${anio} AND MONTH(FechaCreacion) = ${mes}`
            },
            {
                nombre: 'Op.PedidoDetalle',
                esquema: 'Op',
                tabla: 'PedidoDetalle',
                filtroFecha: `EXISTS (
                    SELECT 1 FROM Op.Pedido p 
                    WHERE p.CodigoPedido = [Op].[PedidoDetalle].CodigoPedido 
                    AND YEAR(p.FechaCreacion) = ${anio} AND MONTH(p.FechaCreacion) = ${mes}
                )`
            },
            {
                nombre: 'Op.PedidoDetalleMedida',
                esquema: 'Op',
                tabla: 'PedidoDetalleMedida',
                filtroFecha: `EXISTS (
                    SELECT 1 FROM Op.Pedido p 
                    INNER JOIN Op.PedidoDetalle pd ON pd.CodigoPedido = p.CodigoPedido
                    WHERE pd.CodigoPedidoDetalle = [Op].[PedidoDetalleMedida].CodigoPedidoDetalle 
                    AND YEAR(p.FechaCreacion) = ${anio} AND MONTH(p.FechaCreacion) = ${mes}
                )`
            }
        ];

        for (const nombreCompleto of TABLAS_MAESTRAS) {
            const [Esquema, Tabla] = nombreCompleto.split('.');
            const columnas = await BaseDatos.query(`
                SELECT COLUMN_NAME, COLUMNPROPERTY(OBJECT_ID('[${Esquema}].[${Tabla}]'), COLUMN_NAME, 'IsIdentity') AS EsIdentity
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = '${Esquema}' AND TABLE_NAME = '${Tabla}'
                ORDER BY ORDINAL_POSITION
            `, { type: Sequelize.QueryTypes.SELECT });

            const tieneIdentity = columnas.some(c => c.EsIdentity === 1);
            const registros = await BaseDatos.query(`SELECT * FROM [${Esquema}].[${Tabla}]`, { type: Sequelize.QueryTypes.SELECT });

            if (registros.length === 0) continue;

            resumen.tablas_maestras++;
            resumen.total_registros += registros.length;
            const nombresCols = columnas.map(c => `[${c.COLUMN_NAME}]`).join(', ');

            if (tieneIdentity) sql += `SET IDENTITY_INSERT [${Esquema}].[${Tabla}] ON;\n`;
            for (let i = 0; i < registros.length; i += 100) {
                const lote = registros.slice(i, i + 100);
                const valores = lote.map(reg => `(${columnas.map(c => EscaparValor(reg[c.COLUMN_NAME])).join(', ')})`);
                sql += `INSERT INTO [${Esquema}].[${Tabla}] (${nombresCols}) VALUES\n${valores.join(',\n')};\n`;
            }
            if (tieneIdentity) sql += `SET IDENTITY_INSERT [${Esquema}].[${Tabla}] OFF;\n`;
            sql += `GO\n\n`;
        }

        for (const tablaTrans of TABLAS_TRANSACCIONALES) {
            const { esquema, tabla, filtroFecha } = tablaTrans;
            const columnas = await BaseDatos.query(`
                SELECT COLUMN_NAME, COLUMNPROPERTY(OBJECT_ID('[${esquema}].[${tabla}]'), COLUMN_NAME, 'IsIdentity') AS EsIdentity
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = '${esquema}' AND TABLE_NAME = '${tabla}'
                ORDER BY ORDINAL_POSITION
            `, { type: Sequelize.QueryTypes.SELECT });

            const tieneIdentity = columnas.some(c => c.EsIdentity === 1);
            const registros = await BaseDatos.query(`
                SELECT * FROM [${esquema}].[${tabla}] WHERE ${filtroFecha}
            `, { type: Sequelize.QueryTypes.SELECT });

            if (registros.length === 0) continue;

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

        const nombreMesLargo = DateTime.fromObject({ year: anio, month: mes }).setZone('America/Guatemala').toFormat('MMMM');
        const nombreArchivo = `${process.env.NOMBRE_EMPRESA || 'EMPRESA'} - Respaldo Mensual - ${anio}-${mes.toString().padStart(2, '0')} (${nombreMesLargo}) - ${DateTime.now().setZone('America/Guatemala').toFormat('yyyy-MM-dd HH.mm')}.sql`;

        return { contenidoSQL: sql, nombreArchivo, resumen };

    } catch (error) {
        throw new Error(`ERROR AL GENERAR RESPALDO MENSUAL: ${error.message}`);
    }
};

const BorrarDatosPorMes = async (anio, mes) => {
    try {
        if (!anio || !mes || mes < 1 || mes > 12) {
            LanzarError('Año y Mes inválidos para borrar', 400);
        }

        const conexion = await BaseDatos.connectionManager.getConnection();
        const { Request } = require('tedious');
        let registrosBorrados = 0;

        const ORDEN_BORRADO = [
            {
                nombre: 'Op.PedidoDetalleMedida',
                query: `
                    DELETE pdm 
                    FROM Op.PedidoDetalleMedida pdm
                    INNER JOIN Op.PedidoDetalle pd ON pd.CodigoPedidoDetalle = pdm.CodigoPedidoDetalle
                    INNER JOIN Op.Pedido p ON p.CodigoPedido = pd.CodigoPedido
                    WHERE YEAR(p.FechaCreacion) = ${anio} AND MONTH(p.FechaCreacion) = ${mes}
                `
            },
            {
                nombre: 'Op.PedidoDetalle',
                query: `
                    DELETE pd 
                    FROM Op.PedidoDetalle pd
                    INNER JOIN Op.Pedido p ON p.CodigoPedido = pd.CodigoPedido
                    WHERE YEAR(p.FechaCreacion) = ${anio} AND MONTH(p.FechaCreacion) = ${mes}
                `
            },
            {
                nombre: 'Fn.PagoAplicacion',
                query: `
                    DELETE pa 
                    FROM Fn.PagoAplicacion pa
                    INNER JOIN Op.Pedido p ON p.CodigoPedido = pa.CodigoDocumento
                    WHERE YEAR(p.FechaCreacion) = ${anio} AND MONTH(p.FechaCreacion) = ${mes}
                `
            },
            {
                nombre: 'Inv.MovimientoInventario',
                query: `DELETE FROM Inv.MovimientoInventario WHERE YEAR(FechaMovimiento) = ${anio} AND MONTH(FechaMovimiento) = ${mes}`
            },
            {
                nombre: 'Fn.Pago',
                query: `DELETE FROM Fn.Pago WHERE YEAR(FechaPago) = ${anio} AND MONTH(FechaPago) = ${mes}`
            },
            {
                nombre: 'Ad.Pagos',
                query: `DELETE FROM Ad.Pagos WHERE YEAR(FechaDeposito) = ${anio} AND MONTH(FechaDeposito) = ${mes}`
            },
            {
                nombre: 'Op.Pedido',
                query: `DELETE FROM Op.Pedido WHERE YEAR(FechaCreacion) = ${anio} AND MONTH(FechaCreacion) = ${mes}`
            }
        ];

        for (const tabla of ORDEN_BORRADO) {
            await new Promise((resolve, reject) => {
                const req = new Request(tabla.query, (err, rowCount) => {
                    if (err) return reject(new Error(`Error borrando ${tabla.nombre}: ${err.message}`));
                    const cantidad = rowCount || 0;
                    console.log(`🗑️ Borrados ${cantidad} registros de ${tabla.nombre}`);
                    registrosBorrados += cantidad;
                    resolve();
                });
                conexion.execSql(req);
            });
        }

        BaseDatos.connectionManager.releaseConnection(conexion);

        if (registrosBorrados === 0) {
            throw new Error(`No se encontraron registros para borrar en ${mes}/${anio}`);
        }

        return {
            mensaje: `✅ Borrado completado. Total registros eliminados: ${registrosBorrados}`,
            registrosBorrados
        };

    } catch (error) {
        throw error;
    }
};

const ExistenRegistrosPorMes = async (anio, mes) => {
    try {
        if (!anio || !mes || mes < 1 || mes > 12) {
            LanzarError('Año y mes inválidos para verificar', 400);
        }

        const TABLAS_TRANSACCIONALES = [
            {
                esquema: 'Ad', tabla: 'Pagos',
                filtro: `YEAR(FechaDeposito) = ${anio} AND MONTH(FechaDeposito) = ${mes}`
            },
            {
                esquema: 'Fn', tabla: 'Pago',
                filtro: `YEAR(FechaPago) = ${anio} AND MONTH(FechaPago) = ${mes}`
            },
            {
                esquema: 'Fn', tabla: 'PagoAplicacion',
                filtro: `EXISTS (
                    SELECT 1 FROM Op.Pedido p 
                    WHERE p.CodigoPedido = [Fn].[PagoAplicacion].CodigoDocumento 
                    AND YEAR(p.FechaCreacion) = ${anio} AND MONTH(p.FechaCreacion) = ${mes}
                )`
            },
            {
                esquema: 'Inv', tabla: 'MovimientoInventario',
                filtro: `YEAR(FechaMovimiento) = ${anio} AND MONTH(FechaMovimiento) = ${mes}`
            },
            {
                esquema: 'Op', tabla: 'Pedido',
                filtro: `YEAR(FechaCreacion) = ${anio} AND MONTH(FechaCreacion) = ${mes}`
            },
            {
                esquema: 'Op', tabla: 'PedidoDetalle',
                filtro: `EXISTS (
                    SELECT 1 FROM Op.Pedido p 
                    JOIN Op.PedidoDetalle pd ON pd.CodigoPedido = p.CodigoPedido
                    WHERE YEAR(p.FechaCreacion) = ${anio} AND MONTH(p.FechaCreacion) = ${mes}
                )`
            },
            {
                esquema: 'Op', tabla: 'PedidoDetalleMedida',
                filtro: `EXISTS (
                    SELECT 1 FROM Op.Pedido p 
                    JOIN Op.PedidoDetalle pd ON pd.CodigoPedido = p.CodigoPedido
                    JOIN Op.PedidoDetalleMedida pdm ON pdm.CodigoPedidoDetalle = pd.CodigoPedidoDetalle
                    WHERE YEAR(p.FechaCreacion) = ${anio} AND MONTH(p.FechaCreacion) = ${mes}
                )`
            }
        ];

        for (const tabla of TABLAS_TRANSACCIONALES) {
            const resultado = await BaseDatos.query(`
                SELECT TOP 1 1 AS Existe 
                FROM [${tabla.esquema}].[${tabla.tabla}] 
                WHERE ${tabla.filtro}
            `, { type: Sequelize.QueryTypes.SELECT });

            if (resultado.length > 0) {
                console.log(`✅ Encontrados registros en ${tabla.nombre || tabla.esquema + '.' + tabla.tabla}`);
                return true;
            }
        }

        console.log(`ℹ️ No hay registros transaccionales para ${mes}/${anio} → no se genera respaldo`);
        return false;

    } catch (error) {
        throw new Error(`Error al verificar registros del mes ${mes}/${anio}: ${error.message}`);
    }
};


module.exports = {
    RespaldoCompleto,
    RestaurarRespaldoCompleto,
    RespaldoPorMes,
    BorrarDatosPorMes,
    ExistenRegistrosPorMes 
};
