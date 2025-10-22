export default {
    senha_atual: {
        isEmpty: false,
        isString: true,
    },
    nova_senha: {
        isEmpty: false,
        isString: true,
        isLength: {
            options: { min: 6 },
            errorMessage: 'A nova senha deve ter pelo menos 6 caracteres.',
        },
    },
};
