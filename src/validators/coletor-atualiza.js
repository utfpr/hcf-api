export default {
    nome: {
        in: 'body',
        isString: true,
        isEmpty: false,
        isLength: {
            options: [{ min: 3 }],
        },
    },
    email: {
        in: 'body',
        isString: true,
        optional: true,
        isLength: {
            options: [{ min: 5 }],
        },
    },
    numero: {
        in: 'body',
        isInt: true,
        optional: true,
    },
    id: {
        in: 'params',
        isInt: true,
        isEmpty: false,
    },
};
