export default {
    cidadeId: {
        in: ['params'],
        isInt: true,
        isEmpty: false,
    },
    nome: {
        in: ['body'],
        optional: true,
        isString: true,
        isLength: {
            options: [{ min: 3 }],
        },
    },
    estado_id: {
        in: ['body'],
        optional: true,
        isInt: true,
    },
    latitude: {
        in: ['body'],
        optional: true,
        isFloat: true,
    },
    longitude: {
        in: ['body'],
        optional: true,
        isFloat: true,
    },
};
