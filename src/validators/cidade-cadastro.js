export default {
    nome: {
        in: ['body'],
        isString: true,
        isEmpty: false,
        isLength: {
            options: [{ min: 3 }],
        },
    },
    estado_id: {
        in: ['body'],
        isInt: true,
        isEmpty: false,
    },
};
