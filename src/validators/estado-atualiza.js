export default {
    estadoId: {
        in: 'params',
        isInt: true,
        isEmpty: false,
    },
    nome: {
        in: 'body',
        optional: true,
        isString: true,
        isLength: {
            options: [{ min: 3 }],
        },
    },
    pais_id: {
        in: 'body',
        optional: true,
        isInt: true,
    },
};
