export default {
    nome: {
        in: 'body',
        isString: true,
        isEmpty: false,
        isLength: {
            options: { min: 3 },
        },
    },
    id: {
        in: 'params',
        isInt: true,
        isEmpty: false,
    },
};
