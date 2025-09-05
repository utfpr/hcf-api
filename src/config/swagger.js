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
            {
                url: 'https://api.dev.hcf.cm.utfpr.edu.br',
                description: 'Servidor de Desenvolvimento',
            },
        ],
        components: {
            schemas: {
                ErrorObject: {
                    type: 'object',
                    properties: {
                        code: {
                            type: 'integer',
                            description: 'O código de erro específico da aplicação.',
                            example: 40001,
                        },
                        message: {
                            type: 'string',
                            description: 'Uma mensagem clara descrevendo o erro.',
                            example: "O campo 'xxx' é obrigatório.",
                        },
                    },
                    required: ['code', 'message'],
                },
                ErrorResponse: {
                    type: 'object',
                    properties: {
                        error: {
                            $ref: '#/components/schemas/ErrorObject',
                        },
                    },
                },
            },
            responses: {
                BadRequest: {
                    description: 'Requisição inválida (Erro 400).',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/ErrorResponse' },
                        },
                    },
                },
                Unauthorized: {
                    description: 'Não autorizado (Erro 401). Token ausente, inválido ou expirado.',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/ErrorResponse' },
                            example: { error: { code: 401, message: 'Token expirado' } },
                        },
                    },
                },
                Forbidden: {
                    description: 'Acesso negado (Erro 403).',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/ErrorResponse' },
                        },
                    },
                },
                NotFound: {
                    description: 'Recurso não encontrado (Erro 404).',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/ErrorResponse' },
                        },
                    },
                },
                InternalServerError: {
                    description: 'Erro interno do servidor (Erro 500).',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/ErrorResponse' },
                            example: { error: { code: 0, message: 'Internal Server Error' } },
                        },
                    },
                },
            },
            securitySchemes: {
                BearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
        security: [
            {
                BearerAuth: [],
            },
        ],
    },
    apis: [
        './src/routes/*.js',
        './dist/routes/*.js',
    ],
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;
