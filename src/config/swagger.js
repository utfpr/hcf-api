import swaggerJSDoc from 'swagger-jsdoc';

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'API Herbário UTFPR',
            version: '1.0.0',
            description: 'Documentação da API do Herbário da UTFPR',
        },
        servers: [
            {
                url: 'http://localhost:3000/api',
                description: 'Servidor local',
            },
        ],
    },
    apis: [
        './src/routes/*.js',
    ],
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;
