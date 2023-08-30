export default {
    'herbario.nome': {
        in: 'body',
        isString: true,
        isEmpty: false,
        isLength: {
            options: [{ min: 3 }],
        },
    },
    'herbario.sigla': {
        in: 'body',
        isString: true,
        optional: true,
    },
    'herbario.email': {
        in: 'body',
        isString: true,
        isEmpty: false,
        isLength: {
            options: [{ min: 3 }],
        },
    },
    'endereco.cidade_id': {
        in: 'body',
        isEmpty: false,
        isInt: true,
    },
    'endereco.logradouro': {
        in: 'body',
        isString: true,
        isEmpty: false,
        isLength: {
            options: [{ min: 3 }],
        },
    },
    'endereco.numero': {
        in: 'body',
        isEmpty: false,
        isInt: true,
    },
};
