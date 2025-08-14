export default {
    cidadeId: {
        in: ['query'],
        isInt: true,
        optional: true,
        errorMessage: 'ID da cidade deve ser um número inteiro.',
    },
};
