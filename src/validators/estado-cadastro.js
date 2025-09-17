export default {
    nome: {
        in: 'body',
        isString: true,
        isEmpty: false,
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
        isInt: true,
        isEmpty: false,
    },
};
