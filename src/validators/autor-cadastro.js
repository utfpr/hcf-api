export default {
    nome: {
        in: 'body',
        isString: true,
        isEmpty: false,
        isLength: {
            options: [{ min: 3 }],
        },
    },
    iniciais: {
        in: 'body',
        isString: true,
        optional: true,
        isLength: {
            options: [{ min: 3 }],
        },
    },
};
