export default {
    nome: {
        in: 'body',
        isString: true,
        isEmpty: false,
        isLength: {
            options: [{ min: 3 }],
        },
    },
    observacao: {
        in: 'body',
        isString: true,
        optional: true,
    },
};