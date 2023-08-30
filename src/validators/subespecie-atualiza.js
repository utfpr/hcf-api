export default {
    nome: {
        in: 'body',
        isString: true,
        isEmpty: false,
        isLength: {
            options: [{ min: 3 }],
        },
    },
    familia_id: {
        in: 'body',
        isInt: true,
        isEmpty: false,
    },
    genero_id: {
        in: 'body',
        isInt: true,
        isEmpty: false,
    },
    especie_id: {
        in: 'body',
        isInt: true,
        isEmpty: false,
    },
    subespecie_id: {
        in: 'params',
        isInt: true,
        isEmpty: false,
    },
    autor_id: {
        in: 'body',
        isInt: true,
        optional: true,
    },
};
