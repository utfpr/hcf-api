export default {
    pagina: {
        in: 'query',
        optional: true,
        isInt: true,
    },
    limite: {
        in: 'query',
        optional: true,
        isInt: true,
    },
    pais_id: {
        in: 'query',
        optional: true,
        isInt: true,
        errorMessage: 'ID do país deve ser um número inteiro.',
    },
};
