const validaTipo = tipo => {
    const tipoInt = parseInt(tipo);
    if (tipoInt === 1 || tipoInt === 2 || tipoInt === 3) {
        return true;
    }

    return false;
};

export default {
    nome: {
        in: 'query',
        isString: true,
        optional: true,
        isLength: {
            options: [{ min: 1 }],
        },
    },
    tipo: {
        in: 'query',
        optional: true,
        custom: {
            options: validaTipo,
        },
    },
    email: {
        in: 'query',
        isString: true,
        optional: true,
        isLength: {
            options: [{ min: 1 }],
        },
    },
    telefone: {
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
