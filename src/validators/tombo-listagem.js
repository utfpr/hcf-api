const validaSituacao = situacao => {
    if (situacao === 'REGULAR' || situacao === 'PERMUTADO' || situacao === 'EMPRESTADO' || situacao === 'DOADO') {
        return true;
    }

    return false;
};

export default {
    nome_cientifico: {
        in: 'query',
        isString: true,
        optional: true,
        isLength: {
            options: [{ min: 3 }],
        },
    },
    nome_popular: {
        in: 'query',
        isString: true,
        optional: true,
        isLength: {
            options: [{ min: 3 }],
        },
    },
    tipo: {
        in: 'query',
        optional: true,
        isInt: true,
    },
    situacao: {
        in: 'query',
        optional: true,
        custom: {
            options: validaSituacao,
        },
    },
    hcf: {
        in: 'query',
        isInt: true,
        optional: true,
    },
    codigo_barra_foto: {
        in: 'query',
        isString: true,
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
    coletor_id: {
        in: 'query',
        isInt: true,
        optional: true,
    },
    numero_coleta: {
        in: 'query',
        isInt: true,
        optional: true,
    },
};
