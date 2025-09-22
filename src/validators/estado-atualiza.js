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
    codigo_telefone: {
        in: 'body',
        optional: true,
        isString: true,
        isLength: {
            options: [{ min: 1, max: 5 }],
        },
    },
    pais_id: {
        in: 'body',
        optional: true,
        isInt: true,
    },
};
