export default {
    nome: {
        in: 'body', // Verifica o campo no corpo da requisição
        isString: true,
        isEmpty: false,
        isLength: {
            options: { min: 3 }, // Define o comprimento mínimo do nome
        },
    },
};
