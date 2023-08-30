const validaSituacao = situacao => {
    if (situacao === 'REGULAR' || situacao === 'PERMUTADO' || situacao === 'EMPRESTADO' || situacao === 'DOADO') {
        return true;
    }

    return false;
};

export default {
    nome_cientifico: {
        in: 'body',
        isString: true,
        optional: true,
        isLength: {
            options: [{ min: 3 }],
        },
    },
    nome_popular: {
        in: 'body',
        isString: true,
        optional: true,
        isLength: {
            options: [{ min: 3 }],
        },
    },
    tipo: {
        in: 'body',
        optional: true,
        isInt: true,
    },
    situacao: {
        in: 'body',
        optional: true,
        custom: {
            options: validaSituacao,
        },
    },
    hcf: {
        in: 'body',
        isInt: true,
        optional: true,
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
