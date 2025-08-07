import listagensMiddleware from '../middlewares/listagens-middleware';
import tokensMiddleware, { TIPOS_USUARIOS } from '../middlewares/tokens-middleware';

const controller = require('../controllers/pendencias-controller');

/**
 * @swagger
 * tags:
 *   name: Pendências
 *   description: Operações relacionadas às pendências
 */
export default app => {
    /**
     * @swagger
     * /pendencias/TomboId/{tombo_id}:
     *   get:
     *     summary: Verifica pendência por Tombo ID
     *     tags: [Pendências]
     *     parameters:
     *       - in: path
     *         name: tombo_id
     *         required: true
     *         schema:
     *           type: integer
     *         description: 'ID do tombo'
     *     responses:
     *       200:
     *         description: Pendência encontrada
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               example:
     *                 pendente: true
     *                 pendencia_id: 123
     *       '401':
     *         $ref: '#/components/responses/Unauthorized'
     *       '403':
     *         $ref: '#/components/responses/Forbidden'
     *       '404':
     *         $ref: '#/components/responses/NotFound'
     *       '500':
     *         $ref: '#/components/responses/InternalServerError'
     */
    app.route('/pendencias/TomboId/:tombo_id')
        .get([
            tokensMiddleware([
                TIPOS_USUARIOS.CURADOR,
                TIPOS_USUARIOS.OPERADOR,
                TIPOS_USUARIOS.IDENTIFICADOR,
            ]),
            controller.verificaAlteracao,
        ]);

    /**
     * @swagger
     * /pendencias:
     *   get:
     *     summary: Lista todas as pendências
     *     tags: [Pendências]
     *     responses:
     *       200:
     *         description: Lista de pendências
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 type: object
     *                 properties:
     *                   id:
     *                     type: integer
     *                   descricao:
     *                     type: string
     *                   status:
     *                     type: string
     *               example:
     *                 - id: 1
     *                   descricao: "Pendência de atualização"
     *                   status: "pendente"
     *       '400':
     *         $ref: '#/components/responses/BadRequest'
     *       '401':
     *         $ref: '#/components/responses/Unauthorized'
     *       '403':
     *         $ref: '#/components/responses/Forbidden'
     *       '500':
     *         $ref: '#/components/responses/InternalServerError'
     */
    app.route('/pendencias')
        .get([
            tokensMiddleware([
                TIPOS_USUARIOS.CURADOR,
            ]),
            listagensMiddleware,
            controller.listagem,
        ]);

    /**
     * @swagger
     * /pendencias/{pendencia_id}:
     *   delete:
     *     summary: Remove uma pendência
     *     tags: [Pendências]
     *     parameters:
     *       - in: path
     *         name: pendencia_id
     *         required: true
     *         schema:
     *           type: integer
     *         description: 'ID da pendência'
     *     responses:
     *       204:
     *         description: Pendência removida com sucesso
     *       '401':
     *         $ref: '#/components/responses/Unauthorized'
     *       '403':
     *         $ref: '#/components/responses/Forbidden'
     *       '404':
     *         $ref: '#/components/responses/NotFound'
     *       '500':
     *         $ref: '#/components/responses/InternalServerError'
     *   get:
     *     summary: Visualiza uma pendência
     *     tags: [Pendências]
     *     parameters:
     *       - in: path
     *         name: pendencia_id
     *         required: true
     *         schema:
     *           type: integer
     *         description: 'ID da pendência'
     *     responses:
     *       200:
     *         description: Dados da pendência
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               example:
     *                 id: 1
     *                 descricao: "Pendência de atualização"
     *                 status: "pendente"
     *       '401':
     *         $ref: '#/components/responses/Unauthorized'
     *       '403':
     *         $ref: '#/components/responses/Forbidden'
     *       '404':
     *         $ref: '#/components/responses/NotFound'
     *       '500':
     *         $ref: '#/components/responses/InternalServerError'
     *   post:
     *     summary: Aceita uma pendência
     *     tags: [Pendências]
     *     parameters:
     *       - in: path
     *         name: pendencia_id
     *         required: true
     *         schema:
     *           type: integer
     *         description: 'ID da pendência'
     *     responses:
     *       200:
     *         description: Pendência aceita com sucesso
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               example:
     *                 sucesso: true
     *       '401':
     *         $ref: '#/components/responses/Unauthorized'
     *       '403':
     *         $ref: '#/components/responses/Forbidden'
     *       '404':
     *         $ref: '#/components/responses/NotFound'
     *       '500':
     *         $ref: '#/components/responses/InternalServerError'
     *   put:
     *     summary: Avalia uma pendência
     *     tags: [Pendências]
     *     parameters:
     *       - in: path
     *         name: pendencia_id
     *         required: true
     *         schema:
     *           type: integer
     *         description: 'ID da pendência'
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               avaliacao:
     *                 type: string
     *                 description: Avaliação da pendência
     *             required:
     *               - avaliacao
     *           example:
     *             avaliacao: "Aprovada"
     *     responses:
     *       200:
     *         description: Pendência avaliada com sucesso
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               example:
     *                 sucesso: true
     *       '400':
     *         $ref: '#/components/responses/BadRequest'
     *       '401':
     *         $ref: '#/components/responses/Unauthorized'
     *       '403':
     *         $ref: '#/components/responses/Forbidden'
     *       '404':
     *         $ref: '#/components/responses/NotFound'
     *       '500':
     *         $ref: '#/components/responses/InternalServerError'
     */
    app.route('/pendencias/:pendencia_id')
        .delete([
            tokensMiddleware([
                TIPOS_USUARIOS.CURADOR,
            ]),
            controller.desativar,
        ])
        .get([
            tokensMiddleware([
                TIPOS_USUARIOS.CURADOR,
            ]),
            controller.visualizar,
        ])
        .post([
            tokensMiddleware([
                TIPOS_USUARIOS.CURADOR,
                TIPOS_USUARIOS.OPERADOR,
                TIPOS_USUARIOS.IDENTIFICADOR,
            ]),
            controller.aceitarPendencia,
        ])
        .put([
            tokensMiddleware([
                TIPOS_USUARIOS.CURADOR,
            ]),
            controller.avaliaPendencia,
        ]);
};
