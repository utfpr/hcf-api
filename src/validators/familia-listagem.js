export default {
    familia: {
        in: 'query',
        isString: true,
        optional: true,
        isLength: {
            options: [{ min: 1 }],
        },
    },
    limite: {
        in: 'query',
        isInt: true,
        optional: true,
    },
    pagina: {
        in: 'query',
        isInt: true,
        optional: true,
    },
};
