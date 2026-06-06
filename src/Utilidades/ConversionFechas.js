const { DateTime } = require('luxon');

const ZONA_GUATEMALA = 'America/Guatemala';

/**
 * 🔽 GUARDAR DATETIME (Guatemala → UTC)
 */
const GuatemalaAUTC = (fechaISO) => {
    if (!fechaISO) return null;

    return DateTime.fromISO(fechaISO, { zone: ZONA_GUATEMALA })
        .toUTC()
        .toJSDate();
};

/**
 * 🔼 MOSTRAR DATETIME (UTC → Guatemala)
 */
const UTCAGuatemala_FechaHora = (fecha) => {
    if (!fecha) return null;

    return DateTime.fromJSDate(new Date(fecha), { zone: 'utc' })
        .setZone(ZONA_GUATEMALA)
        .toFormat('dd/MM/yyyy HH:mm');
};

/**
 * 🎨 FORMATEAR DATE (SIN CONVERSIÓN)
 */
const FormatoFecha = (fecha) => {
    if (!fecha) return null;

    return DateTime.fromJSDate(new Date(fecha))
        .toFormat('dd/MM/yyyy');
};

/**
 * 🎨 FORMATEAR DATETIME → SOLO FECHA (SIN CONVERSIÓN)
 * Ej: 2026-04-30 15:30 → 30/04/2026
 */
const FormatoFechaDesdeDateTime = (fecha) => {
    if (!fecha) return null;

    return DateTime.fromJSDate(new Date(fecha))
        .toFormat('dd/MM/yyyy');
};

const RangoGuatemalaAUTC = (fechaInicio, fechaFin) => {

    if (!fechaInicio || !fechaFin) {
        return null;
    }

    const inicioUTC = DateTime
        .fromISO(`${fechaInicio}T00:00:00`, {
            zone: ZONA_GUATEMALA
        })
        .toUTC()
        .toFormat('yyyy-MM-dd HH:mm:ss');

    const finUTC = DateTime
        .fromISO(`${fechaFin}T23:59:59`, {
            zone: ZONA_GUATEMALA
        })
        .toUTC()
        .toFormat('yyyy-MM-dd HH:mm:ss');

    return {
        inicioUTC,
        finUTC
    };
};

module.exports = {
    GuatemalaAUTC,
    UTCAGuatemala_FechaHora,
    FormatoFecha,
    FormatoFechaDesdeDateTime,
    RangoGuatemalaAUTC
};