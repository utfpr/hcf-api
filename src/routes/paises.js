const controller = require('../controllers/paises-controller');

/**
 * @swagger
 * tags:
 *   name: Países
 *   description: Operações relacionadas aos países
 */
export default app => {

    /**
     * @swagger
     * /paises:
     *   get:
     *     summary: Lista todos os países
     *     tags: [Países]
     *     description: Retorna uma lista de países.
     *     responses:
     *       200:
     *         description: Lista de países retornada com sucesso
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
     *                   sigla:
     *                     type: string
     *       '401':
     *         $ref: '#/components/responses/Unauthorized'
     *       '403':
     *         $ref: '#/components/responses/Forbidden'
     *       '500':
     *         $ref: '#/components/responses/InternalServerError'
     */
    app.route('/paises')
        .get([
            controller.listagem,
        ]);

    /**
     * @swagger
     * /paises/{pais_sigla}/estados:
     *   get:
     *     summary: Lista os estados de um país
     *     tags: [Países]
     *     description: Retorna uma lista de estados de um país específico.
     *     parameters:
     *       - in: path
     *         name: pais_sigla
     *         required: true
     *         schema:
     *           type: string
     *         description: 'Sigla do país (ex: BRA)'
     *     responses:
     *       200:
     *         description: Lista de estados do país retornada com sucesso
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
     *                   sigla:
     *                     type: string
     *       '401':
     *         $ref: '#/components/responses/Unauthorized'
     *       '403':
     *         $ref: '#/components/responses/Forbidden'
     *       '404':
     *         $ref: '#/components/responses/NotFound'
     *       '500':
     *         $ref: '#/components/responses/InternalServerError'
     */
    app.route('/paises/:pais_sigla/estados')
        .get([
            controller.listaEstadoPais,
        ]);
};
