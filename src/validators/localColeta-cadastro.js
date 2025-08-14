export default {
    descricao: {
        in: ['body'],
        isString: true,
        notEmpty: true,
        errorMessage: 'Descrição é obrigatória.',
    },
    complemento: {
        in: ['body'],
        isString: true,
        optional: true,
    },
    cidade_id: {
        in: ['body'],
        isInt: true,
        notEmpty: true,
        errorMessage: 'ID da cidade é obrigatório e deve ser um número inteiro.',
    },
    fase_sucessional_id: {
        in: ['body'],
        isInt: true,
        optional: true,
        errorMessage: 'ID da fase sucessional deve ser um número inteiro.',
    },
};
