export default {
    nome: {
        in: 'body',
        isString: true,
        notEmpty: true,
        isLength: {
            options: [{ min: 3 }],
        },
    },
    observacao: {
        in: 'body',
        isString: true,
        optional: true,
        isLength: {
            options: [{ max: 500 }],
        },
    },
    autor_id: {
        in: 'params',
        isInt: true,
        notEmpty: true,
    },
};