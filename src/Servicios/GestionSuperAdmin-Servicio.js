const Sequelize = require('sequelize');
const BaseDatos = require('../BaseDatos/ConexionBaseDatos');
const { LanzarError } = require('../Utilidades/ErrorServicios');
// 0. LIMPIEZA PARA REPLICA Y DEJEAR VACÍO PARA NUEVO CLIENTE
const LimpiarBaseDatosReplicaCliente = async (SuperAdmin) => {

    const transaction = await BaseDatos.transaction();

    try {

        const deletes = [

            'DELETE FROM Op.PedidoDetalleMedida',
            'DELETE FROM Op.PedidoDetalle',
            'DELETE FROM Op.Pedido',

            'DELETE FROM Inv.MovimientoInventario',
            'DELETE FROM Inv.Inventario',

            'DELETE FROM Fn.PagoAplicacion',
            'DELETE FROM Fn.Pago',

            'DELETE FROM Ca.Cliente',
            'DELETE FROM Ca.Producto',
            'DELETE FROM Ca.Tela',
            'DELETE FROM Ca.TipoTela',

            'DELETE FROM Ca.Estilo',
            'DELETE FROM Ca.Marca',
            'DELETE FROM Ca.Color',
            'DELETE FROM Ca.Talla',

            'DELETE FROM Ca.TipoSolapa',
            'DELETE FROM Ca.Tamano',
            'DELETE FROM Ca.TipoCorte',
            'DELETE FROM Ca.TipoCuello',
            'DELETE FROM Ca.Abertura',
            'DELETE FROM Ca.Boton',
            'DELETE FROM Ca.Categoria'
        ];

        const reseeds = [

            'DBCC CHECKIDENT (\'Op.PedidoDetalleMedida\', RESEED, 0)',
            'DBCC CHECKIDENT (\'Op.PedidoDetalle\', RESEED, 0)',
            'DBCC CHECKIDENT (\'Op.Pedido\', RESEED, 0)',

            'DBCC CHECKIDENT (\'Inv.MovimientoInventario\', RESEED, 0)',
            'DBCC CHECKIDENT (\'Inv.Inventario\', RESEED, 0)',

            'DBCC CHECKIDENT (\'Fn.PagoAplicacion\', RESEED, 0)',
            'DBCC CHECKIDENT (\'Fn.Pago\', RESEED, 0)',

            'DBCC CHECKIDENT (\'Ca.Cliente\', RESEED, 0)',
            'DBCC CHECKIDENT (\'Ca.Producto\', RESEED, 0)',
            'DBCC CHECKIDENT (\'Ca.Tela\', RESEED, 0)',
            'DBCC CHECKIDENT (\'Ca.TipoTela\', RESEED, 0)',

            'DBCC CHECKIDENT (\'Ca.Estilo\', RESEED, 0)',
            'DBCC CHECKIDENT (\'Ca.Marca\', RESEED, 0)',
            'DBCC CHECKIDENT (\'Ca.Color\', RESEED, 0)',
            'DBCC CHECKIDENT (\'Ca.Talla\', RESEED, 0)',

            'DBCC CHECKIDENT (\'Ca.TipoSolapa\', RESEED, 0)',
            'DBCC CHECKIDENT (\'Ca.Tamano\', RESEED, 0)',
            'DBCC CHECKIDENT (\'Ca.TipoCorte\', RESEED, 0)',
            'DBCC CHECKIDENT (\'Ca.TipoCuello\', RESEED, 0)',
            'DBCC CHECKIDENT (\'Ca.Abertura\', RESEED, 0)',
            'DBCC CHECKIDENT (\'Ca.Boton\', RESEED, 0)',
            'DBCC CHECKIDENT (\'Ca.Categoria\', RESEED, 0)'
        ];

        for (const query of deletes) {
            await BaseDatos.query(query, { transaction });
        }

        for (const query of reseeds) {
            await BaseDatos.query(query, { transaction });
        }

        await transaction.commit();

        return {
            mensaje: 'Base de datos limpiada y contadores reiniciados correctamente'
        };

    } catch (error) {

        await transaction.rollback();

        throw error;
    }
};

// 1. LIMPIEZA TOTAL DE REGISTROS - VERSIÓN AUTOMÁTICA INTELIGENTE
const LimpiarSoloRegistrosTotal = async (SuperAdmin) => {
    try {
        // ------------------------------------------------------------------
        // PASO 1: DESACTIVAR TODAS LAS RESTRICCIONES DE CLAVES FORÁNEAS
        // ------------------------------------------------------------------
        await BaseDatos.query(`
            DECLARE @sql NVARCHAR(MAX) = N'';
            SELECT @sql += N'ALTER TABLE ' + QUOTENAME(TABLE_SCHEMA) + '.' + QUOTENAME(TABLE_NAME) + ' NOCHECK CONSTRAINT ALL;'
            FROM INFORMATION_SCHEMA.TABLES
            WHERE TABLE_TYPE = 'BASE TABLE' 
              AND TABLE_SCHEMA IN ('Ad', 'Op', 'Inv', 'Fn', 'Ca');
            IF @sql <> N'' EXEC sp_executesql @sql;
        `);

        // ------------------------------------------------------------------
        // PASO 2: OBTENER TODAS LAS TABLAS Y ORDENARLAS POR DEPENDENCIA
        // (Esto es lo importante: las tablas hijas van primero, las padres al final)
        // ------------------------------------------------------------------
        const [tablasOrdenadas] = await BaseDatos.query(`
            -- Obtenemos todas las tablas de los esquemas
            SELECT 
                TABLE_SCHEMA + '.' + TABLE_NAME AS NombreCompleto,
                TABLE_NAME,
                -- Nivel de profundidad: 0 = tabla principal, >0 = tabla que depende de otra
                CASE 
                    WHEN EXISTS (
                        SELECT * FROM INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS rc 
                        JOIN INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc ON rc.CONSTRAINT_NAME = tc.CONSTRAINT_NAME
                        WHERE tc.TABLE_SCHEMA = t.TABLE_SCHEMA AND tc.TABLE_NAME = t.TABLE_NAME
                    ) THEN 1 
                    ELSE 0 
                END AS Nivel
            FROM INFORMATION_SCHEMA.TABLES t
            WHERE TABLE_TYPE = 'BASE TABLE' 
              AND TABLE_SCHEMA IN ('Ad', 'Op', 'Inv', 'Fn', 'Ca')
            -- Ordenamos: primero las que tienen dependencias (Nivel 1), luego las principales (Nivel 0)
            ORDER BY Nivel DESC, TABLE_SCHEMA, TABLE_NAME;
        `);

        // ------------------------------------------------------------------
        // PASO 3: RECORRER Y VACIAR CADA TABLA AUTOMÁTICAMENTE
        // ------------------------------------------------------------------
        for (const tabla of tablasOrdenadas) {
            const nombre = tabla.NombreCompleto;
            try {
                // Intento 1: TRUNCATE (es la forma limpia, rápida y reinicia ID)
                await BaseDatos.query(`TRUNCATE TABLE ${nombre}`);
            } 
            catch (errorTruncate) {
                // Intento 2: Si TRUNCATE falla por alguna regla, usamos DELETE + RESEED
                await BaseDatos.query(`DELETE FROM ${nombre}`);
                await BaseDatos.query(`DBCC CHECKIDENT ('${nombre}', RESEED, 0) WITH NO_INFOMSGS`);
            }
        }

        // ------------------------------------------------------------------
        // PASO 4: VOLVER A ACTIVAR LAS RESTRICCIONES
        // ------------------------------------------------------------------
        await BaseDatos.query(`
            DECLARE @sql2 NVARCHAR(MAX) = N'';
            SELECT @sql2 += N'ALTER TABLE ' + QUOTENAME(TABLE_SCHEMA) + '.' + QUOTENAME(TABLE_NAME) + ' CHECK CONSTRAINT ALL;'
            FROM INFORMATION_SCHEMA.TABLES
            WHERE TABLE_TYPE = 'BASE TABLE' 
              AND TABLE_SCHEMA IN ('Ad', 'Op', 'Inv', 'Fn', 'Ca');
            IF @sql2 <> N'' EXEC sp_executesql @sql2;
        `);

        return {
            mensaje: '✅ LIMPIEZA COMPLETA: Se recorrieron todas las tablas de Ad, Op, Inv, Fn y Ca. Todo vacío.'
        };

    } catch (error) {
        console.error('Error general:', error.message);
        throw new Error(`Proceso fallido: ${error.message}`);
    }
};

// 2. VACÍO TOTAL DE BD
const VaciarTotalBaseDatos = async (SuperAdmin) => {
    try {

        await BaseDatos.query(`
            DECLARE @sqlFK NVARCHAR(MAX) = N'';
            SELECT @sqlFK += N'ALTER TABLE ' + QUOTENAME(FK.TABLE_SCHEMA) + '.' + QUOTENAME(FK.TABLE_NAME) + 
                             ' DROP CONSTRAINT ' + QUOTENAME(RC.CONSTRAINT_NAME) + ';'
            FROM INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS RC
            JOIN INFORMATION_SCHEMA.TABLE_CONSTRAINTS FK 
              ON RC.CONSTRAINT_NAME = FK.CONSTRAINT_NAME
            WHERE FK.TABLE_SCHEMA IN ('Ad', 'Op', 'Inv', 'Fn', 'Ca');
            
            IF @sqlFK <> N'' EXEC sp_executesql @sqlFK;
        `);

       
        await BaseDatos.query(`
            DECLARE @sqlAll NVARCHAR(MAX) = N'';
            -- Restricciones de tipo DEFAULT (DF__)
            SELECT @sqlAll += N'ALTER TABLE ' + QUOTENAME(OBJECT_SCHEMA_NAME(dc.parent_object_id)) + '.' + QUOTENAME(OBJECT_NAME(dc.parent_object_id)) + 
                             ' DROP CONSTRAINT ' + QUOTENAME(dc.name) + ';'
            FROM sys.default_constraints dc
            WHERE OBJECT_SCHEMA_NAME(dc.parent_object_id) IN ('Ad', 'Op', 'Inv', 'Fn', 'Ca');

            -- Restricciones CHECK, UNIQUE, PRIMARY KEY que hayan quedado
            SELECT @sqlAll += N'ALTER TABLE ' + QUOTENAME(OBJECT_SCHEMA_NAME(kc.parent_object_id)) + '.' + QUOTENAME(OBJECT_NAME(kc.parent_object_id)) + 
                             ' DROP CONSTRAINT ' + QUOTENAME(kc.name) + ';'
            FROM sys.key_constraints kc
            WHERE OBJECT_SCHEMA_NAME(kc.parent_object_id) IN ('Ad', 'Op', 'Inv', 'Fn', 'Ca');

            IF @sqlAll <> N'' EXEC sp_executesql @sqlAll;
        `);


        const tablas = await BaseDatos.query(`
            SELECT 
                TABLE_SCHEMA + '.' + TABLE_NAME AS NombreTabla
            FROM INFORMATION_SCHEMA.TABLES
            WHERE TABLE_TYPE = 'BASE TABLE' 
              AND TABLE_SCHEMA IN ('Ad', 'Op', 'Inv', 'Fn', 'Ca')
            ORDER BY TABLE_SCHEMA, TABLE_NAME DESC
        `, { type: Sequelize.QueryTypes.SELECT });

        if (tablas.length === 0) LanzarError('No hay tablas para eliminar', 404);

        for (const tabla of tablas) {
            try {
               
                await BaseDatos.query(`DROP TABLE ${tabla.NombreTabla};`);
            } catch (errInterno) {
               
            }
        }

        await BaseDatos.query(`
            DROP SCHEMA IF EXISTS Ad;
            DROP SCHEMA IF EXISTS Op;
            DROP SCHEMA IF EXISTS Inv;
            DROP SCHEMA IF EXISTS Fn;
            DROP SCHEMA IF EXISTS Ca;
        `);

        return { mensaje: 'Base de datos totalmente vacía: todas las tablas, restricciones y esquemas eliminados.' };

    } catch (error) {
        console.error('❌ ERROR EN VACIADO TOTAL:', error.message);
        throw error;
    }
};

module.exports = {
    LimpiarBaseDatosReplicaCliente,
    LimpiarSoloRegistrosTotal,
    VaciarTotalBaseDatos
};