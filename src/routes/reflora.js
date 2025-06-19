import tokensMiddleware, { TIPOS_USUARIOS } from '../middlewares/tokens-middleware';

const controllerComum = require('../controllers/herbariovirtual-controller');
const controller = require('../controllers/reflora-controller');

/**
 * Essa variável app, está relacionada as rotas que vem do front end. Então se no front end
 * é feito uma requisição que ao backend que é uma dessas requisições: /reflora,
 * /reflora-executando, /reflora-todoslogs, /reflora-log, ela irá chamar
 * a sua respectiva função, que no caso da URL /reflora é preparaRequisição, e assim
 * por diante.
 */
/**
 * @swagger
 * tags:
 *   name: Reflora
 *   description: Operações relacionadas ao Reflora
 */
export default app => {
    /**
     * @swagger
     * /reflora:
     *   get:
     *     summary: Inicia a preparação da requisição para o Reflora
     *     tags: [Reflora]
     *     responses:
     *       200:
     *         description: Requisição preparada com sucesso
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               example:
     *                 sucesso: true
     *                 mensagem: "Requisição preparada"
     *       '401':
     *         $ref: '#/components/responses/Unauthorized'
     *       '403':
     *         $ref: '#/components/responses/Forbidden'
     *       '500':
     *         $ref: '#/components/responses/InternalServerError'
     */
    app.route('/reflora').get([
        tokensMiddleware([
            TIPOS_USUARIOS.CURADOR,
            TIPOS_USUARIOS.OPERADOR,
            TIPOS_USUARIOS.IDENTIFICADOR,
        ]),
        controller.preparaRequisicao,
    ]);

    /**
     * @swagger
     * /reflora-executando:
     *   get:
     *     summary: Verifica se o processo do Reflora está em execução
     *     tags: [Reflora]
     *     responses:
     *       200:
     *         description: Status de execução retornado com sucesso
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               example:
     *                 executando: true
     *       '401':
     *         $ref: '#/components/responses/Unauthorized'
     *       '403':
     *         $ref: '#/components/responses/Forbidden'
     *       '500':
     *         $ref: '#/components/responses/InternalServerError'
     */
    app.route('/reflora-executando').get([
        tokensMiddleware([
            TIPOS_USUARIOS.CURADOR,
            TIPOS_USUARIOS.OPERADOR,
            TIPOS_USUARIOS.IDENTIFICADOR,
        ]),
        controller.estaExecutando,
    ]);

    /**
     * @swagger
     * /reflora-todoslogs:
     *   get:
     *     summary: Lista todos os logs do Reflora
     *     tags: [Reflora]
     *     responses:
     *       200:
     *         description: Lista de logs retornada com sucesso
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 type: object
     *                 properties:
     *                   data:
     *                     type: string
     *                   mensagem:
     *                     type: string
     *               example:
     *                 - data: "2025-06-05T12:00:00Z"
     *                   mensagem: "Log de execução"
     *       '401':
     *         $ref: '#/components/responses/Unauthorized'
     *       '403':
     *         $ref: '#/components/responses/Forbidden'
     *       '500':
     *         $ref: '#/components/responses/InternalServerError'
     */
    app.route('/reflora-todoslogs').get([
        tokensMiddleware([
            TIPOS_USUARIOS.CURADOR,
            TIPOS_USUARIOS.OPERADOR,
            TIPOS_USUARIOS.IDENTIFICADOR,
        ]),
        controllerComum.todosLogs,
    ]);

    /**
     * @swagger
     * /reflora-log:
     *   get:
     *     summary: Obtém o log atual do Reflora
     *     tags: [Reflora]
     *     responses:
     *       200:
     *         description: Log retornado com sucesso
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 log:
     *                   type: string
     *               example:
     *                 log: "Processo finalizado com sucesso"
     *       '401':
     *         $ref: '#/components/responses/Unauthorized'
     *       '403':
     *         $ref: '#/components/responses/Forbidden'
     *       '500':
     *         $ref: '#/components/responses/InternalServerError'
     */
    app.route('/reflora-log').get([
        tokensMiddleware([
            TIPOS_USUARIOS.CURADOR,
            TIPOS_USUARIOS.OPERADOR,
            TIPOS_USUARIOS.IDENTIFICADOR,
        ]),
        controllerComum.getLog,
    ]);
};
