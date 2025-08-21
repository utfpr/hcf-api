export default {
    cidade_id: {
        in: ['query'],
        isInt: true,
        optional: true,
        errorMessage: 'ID da cidade deve ser um número inteiro.',
    },
};
