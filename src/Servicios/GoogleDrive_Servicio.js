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

if (!ID_CARPETA_RAIZ) {
    throw new Error('❌ FALTA ID_CARPETA_DRIVE_RAIZ EN EL .env');
}

// =====================================================
// BUSCAR O CREAR CARPETA
// =====================================================

const ObtenerOCrearCarpeta = async (drive, nombre, padreId) => {
    const q = `name='${nombre}' and '${padreId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;

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
};

// =====================================================
// SUBIR RESPALDO
// =====================================================

const SubirArchivoRespaldo = async (nombreArchivo, contenidoSQL) => {
    try {
        const drive = google.drive({
            version: 'v3',
            auth: oAuth2Client
        });

        const nombreEmpresa =
            process.env.NOMBRE_EMPRESA || 'EMPRESA_SIN_NOMBRE';

        const fecha = new Date();

        const nombreMes = fecha.toLocaleString('es-ES', {
            month: 'long',
            year: 'numeric'
        });

        const idEmpresa = await ObtenerOCrearCarpeta(
            drive,
            nombreEmpresa,
            ID_CARPETA_RAIZ
        );

        const idMes = await ObtenerOCrearCarpeta(
            drive,
            nombreMes,
            idEmpresa
        );

        const respuesta = await drive.files.create({
            requestBody: {
                name: nombreArchivo,
                parents: [idMes]
            },
            media: {
                mimeType: 'text/plain',
                body: contenidoSQL
            },
            fields: 'id,name',
            supportsAllDrives: true
        });

        console.log(
            `✅ RESPALDO SUBIDO CORRECTAMENTE | Archivo: ${respuesta.data.name} | ID: ${respuesta.data.id}`
        );

        return true;

    } catch (error) {
        console.error(
            '❌ ERROR AL SUBIR RESPALDO A GOOGLE DRIVE:',
            error.response?.data || error.message
        );

        return false;
    }
};

module.exports = {
    SubirArchivoRespaldo
};