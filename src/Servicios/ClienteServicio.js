// Servicios/ClienteServicio.js

const Sequelize = require('sequelize');
const BaseDatos = require('../BaseDatos/ConexionBaseDatos');
const Modelo = require('../Modelos/Cliente')(BaseDatos, Sequelize.DataTypes);
const { LanzarError } = require('../Utilidades/ErrorServicios');

const NombreModelo = 'NombreCliente';
const CodigoModelo = 'CodigoCliente';

const Listado = async (CodigoEmpresa, SuperAdmin) => {

    let where = {
        Estatus: [1, 2]
    };

    if (!SuperAdmin) {
        where.CodigoEmpresa = CodigoEmpresa;
    }

    return await Modelo.findAll({
        where,
        order: [[NombreModelo, 'ASC']]
    });
};
const Crear = async (datos, CodigoEmpresa) => {
    try {

        const camposRequeridos = ['NombreCliente', 'Celular', 'Direccion'];
        const faltantes = [];

        for (const campo of camposRequeridos) {
            if (!datos[campo] || String(datos[campo]).trim() === '') {
                faltantes.push(campo);
            }
        }

        if (faltantes.length > 0) {
            LanzarError(`Faltan campos obligatorios: ${faltantes.join(', ')}`, 400);
        }

        const celular = datos.Celular.trim();

        if (!/^\d+$/.test(celular)) {
            LanzarError('El campo Celular debe contener solo números', 400);
        }

        if (celular.length !== 8) {
            LanzarError('El campo Celular debe tener exactamente 8 dígitos', 400);
        }

        const nombreNormalizado = validarNombreCliente(datos.NombreCliente);

        const nit = normalizarNIT(datos.NIT);

        const payload = {
            NombreCliente: nombreNormalizado,
            NIT: nit,
            Celular: celular,
            Direccion: datos.Direccion.trim(),
            Correo: datos.Correo ? datos.Correo.trim() : null,
            Estatus: 1,
            CodigoEmpresa
        };

        const registro = await Modelo.create(payload);

        return registro;

    } catch (error) {

        if (error.name === 'SequelizeUniqueConstraintError') {

            const campo = error.errors?.[0]?.path;

            if (campo === 'NombreCliente') {
                LanzarError('Ya existe un cliente con ese nombre en esta empresa', 400);
            }

            LanzarError('Cliente duplicado', 400);
        }

        if (error.name === 'SequelizeValidationError') {
            const errores = error.errors.map(e => e.message);
            LanzarError(errores.join(', '), 400);
        }

        if (error.name === 'SequelizeDatabaseError') {
            if (error.parent?.message.includes('NULL')) {
                LanzarError('Faltan campos obligatorios', 400);
            }
        }

        throw error;
    }
};
const Editar = async (codigo, datos, CodigoEmpresa) => {
    try {

        const registro = await Modelo.findOne({
            where: {
                [CodigoModelo]: codigo,
                CodigoEmpresa
            }
        });

        if (!registro) {
            LanzarError('Cliente no encontrado o no pertenece a la empresa', 404);
        }

        const camposRequeridos = ['NombreCliente', 'Celular', 'Direccion'];
        const faltantes = [];

        for (const campo of camposRequeridos) {
            if (!datos[campo] || String(datos[campo]).trim() === '') {
                faltantes.push(campo);
            }
        }

        if (faltantes.length > 0) {
            LanzarError(`Faltan campos obligatorios: ${faltantes.join(', ')}`, 400);
        }

        const celular = datos.Celular.trim();

        if (!/^\d+$/.test(celular)) {
            LanzarError('El campo Celular debe contener solo números', 400);
        }

        if (celular.length !== 8) {
            LanzarError('El campo Celular debe tener exactamente 8 dígitos', 400);
        }

        const nombreNormalizado = validarNombreCliente(datos.NombreCliente);

        const nit = datos.NIT && datos.NIT.toString().trim() !== ''
            ? normalizarNIT(datos.NIT)
            : 'C/F';

        const payload = {
            NombreCliente: nombreNormalizado,
            NIT: nit,
            Celular: celular,
            Direccion: datos.Direccion.trim(),
            Correo: datos.Correo ? datos.Correo.trim() : null
        };

        await registro.update(payload);

        return registro;

    } catch (error) {

        if (error.name === 'SequelizeUniqueConstraintError') {

            const campo = error.errors?.[0]?.path;

            if (campo === 'NombreCliente') {
                LanzarError('Ya existe un cliente con ese nombre en esta empresa', 400);
            }

            LanzarError('Cliente duplicado', 400);
        }

        if (error.name === 'SequelizeValidationError') {
            const errores = error.errors.map(e => e.message);
            LanzarError(errores.join(', '), 400);
        }

        if (error.name === 'SequelizeDatabaseError') {
            if (error.parent?.message.includes('NULL')) {
                LanzarError('Faltan campos obligatorios', 400);
            }
        }

        if (error.statusCode) throw error;

        throw error;
    }
};
const Obtener = async (codigo, CodigoEmpresa, SuperAdmin) => {
    try {

        let where = {
            [CodigoModelo]: codigo,
            Estatus: [1, 2]
        };

        if (!SuperAdmin) {
            where.CodigoEmpresa = CodigoEmpresa;
        }

        const registro = await Modelo.findOne({ where });

        if (!registro) {
            LanzarError('Cliente no encontrado', 404, 'Alerta');
        }

        return registro;

    } catch (error) {
        if (error.statusCode) throw error;

        throw error;
    }
};
const Eliminar = async (codigo, CodigoEmpresa, SuperAdmin) => {
    try {

        let where = {
            [CodigoModelo]: codigo
        };

        if (!SuperAdmin) {
            where.CodigoEmpresa = CodigoEmpresa;
        }

        const registro = await Modelo.findOne({ where });

        if (!registro) {
            LanzarError('Cliente no encontrado o no autorizado', 404);
        }

        await registro.destroy();

        return true;

    } catch (error) {

        if (error.name === 'SequelizeForeignKeyConstraintError') {
            LanzarError('No se puede eliminar el cliente porque tiene registros asociados', 400);
        }

        if (error.statusCode) throw error;

        throw error;
    }
};
const QuitarTildes = (texto) => {
    return texto
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
};
const normalizarNIT = (nit) => {
    if (!nit || nit.toString().trim() === '') return 'C/F';

    const valor = nit.toString().trim();

    // Permitir valor especial del sistema
    if (valor === 'C/F') return 'C/F';

    // Solo números y guiones
    if (!/^[\d-]+$/.test(valor)) {
        LanzarError('El NIT solo puede contener números o guiones', 400);
    }

    // quitar guiones
    const soloNumeros = valor.replace(/-/g, '');

    // validar que quede solo números
    if (!/^\d+$/.test(soloNumeros)) {
        LanzarError('El NIT contiene caracteres inválidos', 400);
    }

    return soloNumeros;
};
const validarNombreCliente = (nombre) => {
    if (!nombre || nombre.toString().trim() === '') {
        LanzarError('El nombre del cliente es obligatorio', 400);
    }

    const valor = nombre.toString().trim();

    // Permite letras, espacios y tildes
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(valor)) {
        LanzarError('El nombre solo puede contener letras (sin números ni caracteres especiales)', 400);
    }

    // 🔥 Quitar tildes primero
    const sinTildes = QuitarTildes(valor);

    // 🔥 Formatear: Primera letra mayúscula, resto minúscula por palabra
    const formateado = sinTildes
        .toLowerCase()
        .split(' ')
        .filter(w => w.length > 0)
        .map(p => p.charAt(0).toUpperCase() + p.slice(1))
        .join(' ');

    return formateado;
};
module.exports = {
    Listado, Crear, Editar, Eliminar, Obtener
};