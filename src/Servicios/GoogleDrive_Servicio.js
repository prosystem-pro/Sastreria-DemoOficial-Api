const { google } = require('googleapis');

// =====================================================
// GOOGLE DRIVE / GOOGLE OAUTH
// =====================================================

const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_DRIVE_CLIENT_ID,
    process.env.GOOGLE_DRIVE_CLIENT_SECRET,
    process.env.GOOGLE_DRIVE_REDIRECT_URI
);

oAuth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_DRIVE_REFRESH_TOKEN
});

// =====================================================
// CONFIGURACIÓN
// =====================================================

const ID_CARPETA_RAIZ = process.env.ID_CARPETA_DRIVE_RAIZ;
const CARPETA_GRUPO = process.env.CARPETA_GRUPO || 'Sastrerias';

if (!ID_CARPETA_RAIZ) {
    throw new Error('❌ FALTA ID_CARPETA_DRIVE_RAIZ EN EL .env');
}

// =====================================================
// BUSCAR O CREAR CARPETA
// =====================================================

const ObtenerOCrearCarpeta = async (drive, nombre, padreId) => {
    try {
        const nombreEscapado = nombre.replace(/'/g, "\\'");
        const q = `name='${nombreEscapado}' and '${padreId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;

        const res = await drive.files.list({
            q,
            fields: 'files(id)',
            supportsAllDrives: true,
            includeItemsFromAllDrives: true
        });

        if (res.data.files.length > 0) {
            return res.data.files[0].id;
        }

        const nuevaCarpeta = await drive.files.create({
            requestBody: {
                name: nombre,
                mimeType: 'application/vnd.google-apps.folder',
                parents: [padreId]
            },
            fields: 'id',
            supportsAllDrives: true
        });

        return nuevaCarpeta.data.id;
    } catch (error) {
        throw error;
    }
};

// =====================================================
// CREAR RUTA COMPLETA
// =====================================================
const ObtenerOCrearRutaCarpeta = async (ruta) => {
    try {
        const drive = google.drive({ version: 'v3', auth: oAuth2Client });
        const partes = ruta.split('/').filter(parte => parte.trim() !== '');
        let idPadreActual = ID_CARPETA_RAIZ;

        for (const nombreCarpeta of partes) {
            idPadreActual = await ObtenerOCrearCarpeta(drive, nombreCarpeta, idPadreActual);
        }

        return idPadreActual;
    } catch (error) {
        throw error;
    }
};

// =====================================================
// SUBIR ARCHIVO A CARPETA ESPECÍFICA
// =====================================================
const SubirArchivoEnCarpeta = async (nombreArchivo, contenidoSQL, idCarpetaDestino) => {
    try {
        const drive = google.drive({ version: 'v3', auth: oAuth2Client });

        const respuesta = await drive.files.create({
            requestBody: {
                name: nombreArchivo,
                parents: [idCarpetaDestino]
            },
            media: {
                mimeType: 'text/plain',
                body: contenidoSQL
            },
            fields: 'id,name',
            supportsAllDrives: true
        });

        return { exito: true, id: respuesta.data.id, nombre: respuesta.data.name };

    } catch (error) {
        throw error;
    }
};

// =====================================================
// SUBIR RESPALDO DIARIO
// =====================================================
const SubirArchivoRespaldo = async (nombreArchivo, contenidoSQL) => {
    try {
        const drive = google.drive({ version: 'v3', auth: oAuth2Client });

        const nombreEmpresa = process.env.NOMBRE_EMPRESA || 'EMPRESA_SIN_NOMBRE';
        const fecha = new Date();
        const nombreMes = fecha.toLocaleString('es-ES', { month: 'long', year: 'numeric' });

        // 📁 RUTA NUEVA: Grupo → Empresa → Respaldos Diarios → Mes
        const idGrupo = await ObtenerOCrearCarpeta(drive, CARPETA_GRUPO, ID_CARPETA_RAIZ);
        const idEmpresa = await ObtenerOCrearCarpeta(drive, nombreEmpresa, idGrupo);
        const idRespaldosDiarios = await ObtenerOCrearCarpeta(drive, 'Respaldos Completos Diarios', idEmpresa);
        const idMes = await ObtenerOCrearCarpeta(drive, nombreMes, idRespaldosDiarios);

        const respuesta = await drive.files.create({
            requestBody: { name: nombreArchivo, parents: [idMes] },
            media: { mimeType: 'text/plain', body: contenidoSQL },
            fields: 'id,name',
            supportsAllDrives: true
        });

        return { exito: true, id: respuesta.data.id, nombre: respuesta.data.name };

    } catch (error) {
        throw error;
    }
};

// =====================================================
// EXPORTACIÓN
// =====================================================
module.exports = {
    SubirArchivoRespaldo,
    ObtenerOCrearRutaCarpeta,
    SubirArchivoEnCarpeta
};
