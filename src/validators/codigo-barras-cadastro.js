export default {
    hcf: {
        in: 'body',
        isEmpty: false,
        isInt: true,
        errorMessage: 'HCF é obrigatório e deve ser um número inteiro'
    },
    codigo_barra: {
        in: 'body',
        isEmpty: false,
        isInt: true,
        errorMessage: 'Código de barras é obrigatório e deve ser um número inteiro'
    }
};
