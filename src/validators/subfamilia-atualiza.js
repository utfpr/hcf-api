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
    subfamilia_id: {
        in: 'params',
        isInt: true,
        isEmpty: false,
    },
};
