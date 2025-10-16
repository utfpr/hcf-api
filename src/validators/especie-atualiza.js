<<<<<<< HEAD
export default {
    nome: {
        in: 'body',
        isString: true,
        isEmpty: false,
        isLength: {
            options: [{ min: 3 }],
        },
    },
    genero_id: {
        in: 'body',
        isInt: true,
        isEmpty: false,
    },
    autor_id: {
        in: 'body',
        isInt: true,
        optional: true,
    },
    especie_id: {
        in: 'params',
        isInt: true,
        isEmpty: false,
    },
};
=======
export default {
    nome: {
        in: 'body',
        isString: true,
        isEmpty: false,
        isLength: {
            options: [{ min: 3 }],
        },
    },
    genero_id: {
        in: 'body',
        isInt: true,
        isEmpty: false,
    },
    autor_id: {
        in: 'body',
        isInt: true,
        optional: {
            options: { nullable: true },
        },
    },
    especie_id: {
        in: 'params',
        isInt: true,
        isEmpty: false,
    },
};
>>>>>>> origin/development
