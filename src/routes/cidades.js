const controller = require('../controllers/cidades-controller');

/**
 * @swagger
 * tags:
 *   name: Cidades
 *   description: Operações relacionadas às cidades
 */

/**
 * @swagger
 * /cidades:
 *   get:
 *     summary: Lista todas as cidades
 *     tags: [Cidades]
 *     responses:
 *       200:
 *         description: Lista de cidades retornada com sucesso
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
 *                   estado_id:
 *                     type: integer
 *                   latitude:
 *                     type: number
 *                   longitude:
 *                     type: number
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '403':
 *         $ref: '#/components/responses/Forbidden'
 *       '500':
 *         $ref: '#/components/responses/InternalServerError'
 */
export default app => {
    app.route('/cidades').get(controller.listagem);
};
