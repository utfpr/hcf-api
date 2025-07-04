import tokensMiddleware, { TIPOS_USUARIOS } from '../middlewares/tokens-middleware';
import validacoesMiddleware from '../middlewares/validacoes-middleware';
import nomeEsquema from '../validators/nome-obrigatorio';

const controller = require('../controllers/locais-coleta-controller');

/**
 * @swagger
 * tags:
 *   name: Locais
 *   description: Operações relacionadas aos locais de coleta
 */
export default app => {

    /**
     * @swagger
     * /solos:
     *   post:
     *     summary: Cadastra um novo solo
     *     tags: [Locais]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               nome:
     *                 type: string
     *                 description: Nome do solo
     *             required:
     *               - nome
     *     responses:
     *       201:
     *         description: Solo cadastrado com sucesso
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                   id:
     *                     type: integer
     *                   nome:
     *                     type: string
     *       '400':
     *         $ref: '#/components/responses/BadRequest'
     *       '401':
     *         $ref: '#/components/responses/Unauthorized'
     *       '403':
     *         $ref: '#/components/responses/Forbidden'
     *       '500':
     *         $ref: '#/components/responses/InternalServerError'
     *   get:
     *     summary: Lista todos os solos
     *     tags: [Locais]
     *     responses:
     *       200:
     *         description: Lista de solos
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 type: object
     *                 properties:
     *                   id:
     *                     type: integer
     *                   nome:
     *                     type: string
     *       '401':
     *         $ref: '#/components/responses/Unauthorized'
     *       '403':
     *         $ref: '#/components/responses/Forbidden'
     *       '500':
     *         $ref: '#/components/responses/InternalServerError'
     */
    app.route('/solos')
        .post([
            tokensMiddleware([
                TIPOS_USUARIOS.CURADOR, TIPOS_USUARIOS.OPERADOR,
            ]),
            validacoesMiddleware(nomeEsquema),
            controller.cadastrarSolo,
        ])
        .get([
            controller.buscarSolos,
        ]);

    /**
     * @swagger
     * /relevos:
     *   post:
     *     summary: Cadastra um novo relevo
     *     tags: [Locais]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               nome:
     *                 type: string
     *                 description: Nome do relevo
     *             required:
     *               - nome
     *     responses:
     *       201:
     *         description: Relevo cadastrado com sucesso
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                   id:
     *                     type: integer
     *                   nome:
     *                     type: string
     *       '400':
     *         $ref: '#/components/responses/BadRequest'
     *       '401':
     *         $ref: '#/components/responses/Unauthorized'
     *       '403':
     *         $ref: '#/components/responses/Forbidden'
     *       '500':
     *         $ref: '#/components/responses/InternalServerError'
     *   get:
     *     summary: Lista todos os relevos
     *     tags: [Locais]
     *     responses:
     *       200:
     *         description: Lista de relevos
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 type: object
     *                 properties:
     *                   id:
     *                     type: integer
     *                   nome:
     *                     type: string
     *       '401':
     *         $ref: '#/components/responses/Unauthorized'
     *       '403':
     *         $ref: '#/components/responses/Forbidden'
     *       '500':
     *         $ref: '#/components/responses/InternalServerError'
     */
    app.route('/relevos')
        .post([
            tokensMiddleware([
                TIPOS_USUARIOS.CURADOR, TIPOS_USUARIOS.OPERADOR,
            ]),
            validacoesMiddleware(nomeEsquema),
            controller.cadastrarRelevo,
        ])
        .get([
            controller.buscarRelevos,
        ]);

    /**
     * @swagger
     * /vegetacoes:
     *   post:
     *     summary: Cadastra uma nova vegetação
     *     tags: [Locais]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               nome:
     *                 type: string
     *                 description: Nome da vegetação
     *             required:
     *               - nome
     *     responses:
     *       201:
     *         description: Vegetação cadastrada com sucesso
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                   id:
     *                     type: integer
     *                   nome:
     *                     type: string
     *       '400':
     *         $ref: '#/components/responses/BadRequest'
     *       '401':
     *         $ref: '#/components/responses/Unauthorized'
     *       '403':
     *         $ref: '#/components/responses/Forbidden'
     *       '500':
     *         $ref: '#/components/responses/InternalServerError'
     *   get:
     *     summary: Lista todas as vegetações
     *     tags: [Locais]
     *     responses:
     *       200:
     *         description: Lista de vegetações
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 type: object
     *                 properties:
     *                   id:
     *                     type: integer
     *                   nome:
     *                     type: string
     *       '401':
     *         $ref: '#/components/responses/Unauthorized'
     *       '403':
     *         $ref: '#/components/responses/Forbidden'
     *       '500':
     *         $ref: '#/components/responses/InternalServerError'
     */
    app.route('/vegetacoes')
        .post([
            tokensMiddleware([
                TIPOS_USUARIOS.CURADOR, TIPOS_USUARIOS.OPERADOR,
            ]),
            validacoesMiddleware(nomeEsquema),
            controller.cadastrarVegetacao,
        ])
        .get([
            controller.buscarVegetacoes,
        ]);
};
