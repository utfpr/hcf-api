export default {
    nome: {
        in: 'body',
        isString: true,
        isEmpty: false,
        isLength: {
            options: [{ min: 3 }],
        },
    },
    especie_id: {
        in: 'body',
        isInt: true,
        isEmpty: false,
    },
    autor_id: {
        in: 'body',
        isInt: true,
        optional: true,
    },
};
