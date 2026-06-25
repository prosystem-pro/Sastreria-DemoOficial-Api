const nodemailer = require('nodemailer');
const { DateTime } = require('luxon');
const dns = require('dns');

const transportadorCorreo = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true', 
    requireTLS: false, 
    family: 4,
    lookup: (hostname, options, callback) => {
        dns.lookup(hostname, { family: 4 }, callback);
    },
    auth: {
        user: process.env.SMTP_USUARIO,
        pass: process.env.SMTP_CLAVE
    },
    connectionTimeout: 30000,
    greetingTimeout: 20000,
    socketTimeout: 30000,
    tls: {
        rejectUnauthorized: false,
        minVersion: 'TLSv1.2'
    }
});


const Correo_Informe_respaldo = async (resumen) => {
    let asuntoCorreo, cuerpoHTML;

    const totalEncontradas = resumen.tablas_procesadas + resumen.tablas_vacias?.length;
    const hayAlerta = totalEncontradas < resumen.total_tablas_encontradas;
    const colorEstadoDiario = hayAlerta ? '#f59e0b' : '#059669';
    const tituloDiario = hayAlerta ? '⚠️ RESPALDO DIARIO<br>CON ADVERTENCIAS' : '✅ RESPALDO DIARIO<br>EXITOSO';

    let tituloMesesAntiguos = '';
    let colorEstadoMeses = '#9ca3af';
    if (resumen.revision_mes_antiguo) {
        if (resumen.revision_mes_antiguo.error) {
            tituloMesesAntiguos = '❌ MESES ANTIGUOS<br>ERROR';
            colorEstadoMeses = '#dc2626';
        } else if (resumen.revision_mes_antiguo.procesado) {
            tituloMesesAntiguos = '✅ MESES ANTIGUOS<br>RESPALDADO Y ELIMINADO';
            colorEstadoMeses = '#059669';
        } else {
            tituloMesesAntiguos = 'ℹ️ MESES ANTIGUOS<br>SIN DATOS';
            colorEstadoMeses = '#3b82f6';
        }
    } else {
        tituloMesesAntiguos = 'ℹ️ MESES ANTIGUOS<br>SIN REVISIÓN';
    }

    const nombreEmpresa = process.env.NOMBRE_EMPRESA || 'EMPRESA';
    asuntoCorreo = `${hayAlerta ? '⚠️' : '✅'} ${nombreEmpresa} | Respaldo Diario | ${resumen.fecha_inicio}`;

    if (resumen.estado === 'EXITOSO') {
        cuerpoHTML = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { font-family: 'Segoe UI', Roboto, Arial, sans-serif; background-color: #f3f4f6; padding: 30px 15px; }
                .contenedor { max-width: 680px; margin: 0 auto; background: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); overflow: hidden; }
                .encabezado { display: flex; flex-wrap: wrap; }
                .columna-estado { width: 50%; padding: 32px 20px; text-align: center; color: #ffffff; }
                .columna-diario { background: linear-gradient(135deg, ${colorEstadoDiario}, ${colorEstadoDiario}cc); }
                .columna-antiguos { background: linear-gradient(135deg, ${colorEstadoMeses}, ${colorEstadoMeses}cc); }
                .columna-estado h1 { font-size: 20px; font-weight: 600; line-height: 1.4; }
                .cuerpo { padding: 30px 28px; color: #1f2937; }
                .titulo-seccion { font-size: 18px; font-weight: 600; margin-bottom: 20px; color: #111827; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; }
                .fila { display: flex; justify-content: space-between; padding: 12px 14px; margin: 6px 0; background-color: #f9fafb; border-radius: 6px; }
                .etiqueta { font-weight: 500; color: #4b5563; }
                .valor { font-weight: 500; color: #111827; }
                .alerta { margin: 22px 0; padding: 14px 18px; background: #fffbeb; border-left: 5px solid #f59e0b; border-radius: 6px; color: #92400e; }
                .info { margin: 22px 0; padding: 16px 18px; background: #ecfccb; border-left: 5px solid #84cc16; border-radius: 6px; color: #3f6212; }
                .error { margin: 22px 0; padding: 16px 18px; background: #fef2f2; border-left: 5px solid #dc2626; border-radius: 6px; color: #7f1d1d; }
                .lista-contenedor { margin-top: 20px; padding: 16px; background: #f9fafb; border-radius: 8px; border-left: 4px solid #d1d5db; }
                .lista-titulo { font-weight: 600; margin-bottom: 10px; color: #374151; }
                .lista-item { margin: 5px 0; padding-left: 8px; color: #4b5563; }
                .pie { text-align: center; font-size: 12px; color: #9ca3af; padding: 18px; background: #f9fafb; border-top: 1px solid #e5e7eb; }
                @media only screen and (max-width: 480px) {
                    .columna-estado { width: 100%; }
                }
            </style>
        </head>
        <body>
            <div class="contenedor">
                <div class="encabezado">
                    <div class="columna-estado columna-diario">
                        <h1>${nombreEmpresa}<br>${tituloDiario}</h1>
                    </div>
                    <div class="columna-estado columna-antiguos">
                        <h1>${tituloMesesAntiguos}</h1>
                    </div>
                </div>

                <div class="cuerpo">
                    <h2 class="titulo-seccion">📋 Resumen del Respaldo Diario</h2>
                    <div class="fila"><span class="etiqueta">📅 Fecha y hora:</span><span class="valor">${resumen.fecha_inicio}</span></div>
                    <div class="fila"><span class="etiqueta">🗄️ Base de datos:</span><span class="valor">${resumen.base_datos}</span></div>
                    <div class="fila"><span class="etiqueta">📊 Total de tablas:</span><span class="valor">${resumen.total_tablas_encontradas}</span></div>
                    <div class="fila"><span class="etiqueta">✅ Tablas respaldadas:</span><span class="valor">${resumen.tablas_procesadas}</span></div>
                    <div class="fila"><span class="etiqueta">📭 Tablas vacías:</span><span class="valor">${resumen.tablas_vacias.length}</span></div>
                    <div class="fila"><span class="etiqueta">📈 Total de registros:</span><span class="valor">${resumen.total_registros.toLocaleString()}</span></div>
                    <div class="fila"><span class="etiqueta">⏱️ Duración:</span><span class="valor">${resumen.duracion_segundos} segundos</span></div>
                    <div class="fila"><span class="etiqueta">☁️ Subida a Google Drive:</span><span class="valor">${resumen.subida_drive || 'Pendiente'}</span></div>

                    ${hayAlerta ? `<div class="alerta"><strong>⚠️ Atención:</strong> Se encontraron ${resumen.total_tablas_encontradas} tablas, pero solo se procesaron ${totalEncontradas}.</div>` : ''}

                    <div class="lista-contenedor">
                        <h3 class="lista-titulo">📌 Tablas con datos respaldadas:</h3>
                        ${resumen.tablas_con_datos.length > 0 ? resumen.tablas_con_datos.map(t => `<div class="lista-item">• ${t}</div>`).join('') : `<div class="lista-item">Ninguna</div>`}
                    </div>

                    <div class="lista-contenedor" style="margin-top:15px;">
                        <h3 class="lista-titulo">📋 Tablas sin registros:</h3>
                        ${resumen.tablas_vacias.length > 0 ? resumen.tablas_vacias.map(t => `<div class="lista-item">• ${t}</div>`).join('') : `<div class="lista-item">Ninguna</div>`}
                    </div>

                    <div style="margin-top:30px; border-top:1px dashed #e5e7eb; padding-top:25px;">
                        <h2 class="titulo-seccion">🔍 Revisión de Meses Antiguos</h2>
                        ${resumen.revision_mes_antiguo?.error ? `<div class="error">${resumen.revision_mes_antiguo.mensaje}</div>` : resumen.revision_mes_antiguo?.procesado ? `<div class="info"><strong>${resumen.revision_mes_antiguo.mensaje}</strong><br><br>📆 Mes: ${resumen.revision_mes_antiguo.nombreMes} ${resumen.revision_mes_antiguo.anio}<br>📥 Registros respaldados: ${resumen.revision_mes_antiguo.registrosRespaldados.toLocaleString()}<br>🗑️ Registros eliminados: ${resumen.revision_mes_antiguo.registrosEliminados.toLocaleString()}<br>☁️ Archivo en Drive: ID ${resumen.revision_mes_antiguo.idArchivoDrive}</div>` : `<div class="info">${resumen.revision_mes_antiguo?.mensaje || 'No se realizó revisión'}</div>`}
                    </div>
                </div>
                <div class="pie">
                    Sistema de Respaldos Automáticos • ProSystem © ${DateTime.now().setZone('America/Guatemala').toFormat('yyyy')}
                </div>
            </div>
        </body>
        </html>
        `;
    } else {
        cuerpoHTML = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { font-family: 'Segoe UI', Roboto, Arial, sans-serif; background-color: #f3f4f6; padding: 30px 15px; }
                .contenedor { max-width: 680px; margin: 0 auto; background: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); overflow: hidden; }
                .encabezado { display: flex; flex-wrap: wrap; }
                .columna-estado { width: 50%; padding: 32px 20px; text-align: center; color: #ffffff; }
                .columna-diario { background: linear-gradient(135deg, #dc2626, #b91c1c); }
                .columna-antiguos { background: linear-gradient(135deg, #9ca3af, #6b7280); }
                .columna-estado h1 { font-size: 20px; font-weight: 600; line-height: 1.4; }
                .cuerpo { padding: 30px 28px; color: #1f2937; }
                .titulo-seccion { font-size: 18px; font-weight: 600; margin-bottom: 20px; color: #111827; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; }
                .fila { display: flex; justify-content: space-between; padding: 12px 14px; margin: 6px 0; background-color: #fef2f2; border-radius: 6px; }
                .etiqueta { font-weight: 500; color: #7f1d1d; }
                .valor { font-weight: 500; color: #991b1b; }
                .error { margin-top: 22px; padding: 16px; background: #fef2f2; border-left: 5px solid #dc2626; border-radius: 6px; font-family: Consolas, monospace; font-size: 14px; color: #7f1d1d; line-height: 1.5; }
                .pie { text-align: center; font-size: 12px; color: #9ca3af; padding: 18px; background: #f9fafb; border-top: 1px solid #e5e7eb; }
                @media only screen and (max-width: 480px) {
                    .columna-estado { width: 100%; }
                }
            </style>
        </head>
        <body>
            <div class="contenedor">
                <div class="encabezado">
                    <div class="columna-estado columna-diario">
                        <h1>${nombreEmpresa}<br>❌ PROCESO<br>CON ERROR</h1>
                    </div>
                    <div class="columna-estado columna-antiguos">
                        <h1>❌ NO EJECUTADO</h1>
                    </div>
                </div>
                <div class="cuerpo">
                    <h2 class="titulo-seccion">⚠️ Detalle del fallo</h2>
                    <div class="fila"><span class="etiqueta">📅 Fecha y hora:</span><span class="valor">${resumen.fecha || 'No disponible'}</span></div>
                    <div class="fila"><span class="etiqueta">🗄️ Base de datos:</span><span class="valor">${resumen.base_datos || 'No disponible'}</span></div>
                    <h3 style="margin-top:20px; font-weight:600;">Descripción del error:</h3>
                    <div class="error">${resumen.error || 'No se obtuvieron detalles'}</div>
                    <div style="margin-top:30px; border-top:1px dashed #e5e7eb; padding-top:25px;">
                        <h2 class="titulo-seccion">🔍 Revisión de Meses Antiguos</h2>
                        <div class="error">${resumen.revision_mes_antiguo?.mensaje || 'No se pudo realizar la revisión'}</div>
                    </div>
                </div>
                <div class="pie">
                    Sistema de Respaldos Automáticos • ProSystem © ${DateTime.now().setZone('America/Guatemala').toFormat('yyyy')}
                </div>
            </div>
        </body>
        </html>
        `;
    }

    // ✅ LÍNEA CORREGIDA: usa el correo verificado en Brevo
    await transportadorCorreo.sendMail({
        from: `"ProSystem" <${process.env.CORREO_DESTINO}>`,
        to: process.env.CORREO_DESTINO,
        subject: asuntoCorreo,
        html: cuerpoHTML
    });
};

module.exports = { Correo_Informe_respaldo };
