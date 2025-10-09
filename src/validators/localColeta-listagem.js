export default {
    cidade_id: {
        in: ['query'],
        isInt: true,
        optional: true,
        errorMessage: 'ID da cidade deve ser um número inteiro.',
    },
    estado_id: {
        in: ['query'],
        isInt: true,
        optional: true,
        errorMessage: 'ID do estado deve ser um número inteiro.',
    },
    pais_id: {
        in: ['query'],
        isInt: true,
        optional: true,
        errorMessage: 'ID do país deve ser um número inteiro.',
    },
};
