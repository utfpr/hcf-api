import tokensMiddleware, { TIPOS_USUARIOS } from '../middlewares/tokens-middleware';

const controllerComum = require('../controllers/herbariovirtual-controller');
const controller = require('../controllers/specieslink-controller');

/**
 * Essa variável app, está relacionada as rotas que vem do front end. Então se no front end
 * é feito uma requisição que ao backend que é uma dessas requisições: /specieslink,
 * /specieslink-executando, /specieslink-todoslogs, /specieslink-log, ela irá chamar
 * a sua respectiva função, que no caso da URL /specieslink é preparaRequisição, e assim
 * por diante.
 */
/**
* @swagger
* tags:
*   name: SpeciesLink
*   description: Operações relacionadas ao SpeciesLink
*/
export default app => {
    /**
     * @swagger
     * /specieslink:
     *   get:
     *     summary: Inicia a preparação da requisição para o SpeciesLink
     *     tags: [SpeciesLink]
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
    app.route('/specieslink').get([
        tokensMiddleware([
            TIPOS_USUARIOS.CURADOR,
            TIPOS_USUARIOS.OPERADOR,
            TIPOS_USUARIOS.IDENTIFICADOR,
        ]),
        controller.preparaRequisicao,
    ]);

    /**
     * @swagger
     * /specieslink-executando:
     *   get:
     *     summary: Verifica se o processo do SpeciesLink está em execução
     *     tags: [SpeciesLink]
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
    app.route('/specieslink-executando').get([
        tokensMiddleware([
            TIPOS_USUARIOS.CURADOR,
            TIPOS_USUARIOS.OPERADOR,
            TIPOS_USUARIOS.IDENTIFICADOR,
        ]),
        controller.estaExecutando,
    ]);

    /**
     * @swagger
     * /specieslink-todoslogs:
     *   get:
     *     summary: Lista todos os logs do SpeciesLink
     *     tags: [SpeciesLink]
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
    app.route('/specieslink-todoslogs').get([
        tokensMiddleware([
            TIPOS_USUARIOS.CURADOR,
            TIPOS_USUARIOS.OPERADOR,
            TIPOS_USUARIOS.IDENTIFICADOR,
        ]),
        controllerComum.todosLogs,
    ]);

    /**
     * @swagger
     * /specieslink-log:
     *   get:
     *     summary: Obtém o log atual do SpeciesLink
     *     tags: [SpeciesLink]
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
    app.route('/specieslink-log').get([
        tokensMiddleware([
            TIPOS_USUARIOS.CURADOR,
            TIPOS_USUARIOS.OPERADOR,
            TIPOS_USUARIOS.IDENTIFICADOR,
        ]),
        controllerComum.getLog,
    ]);
};
