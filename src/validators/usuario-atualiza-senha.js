export default {
    senhaAtual: {
        isEmpty: false,
        isString: true,
    },
    novaSenha: {
        isEmpty: false,
        isString: true,
        isLength: {
            options: { min: 6 },
            errorMessage: 'A nova senha deve ter pelo menos 6 caracteres.',
        },
    },
};
