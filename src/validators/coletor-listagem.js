export default {
    coletor: {
        in: 'query',
        isString: true,
        optional: true,
        isLength: {
            options: [{ min: 1 }],
        },
    },
};
