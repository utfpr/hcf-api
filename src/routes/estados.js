const controller = require('../controllers/estados-controller');

/**
 * @swagger
 * tags:
 *   name: Estados
 *   description: Operações relacionadas aos estados
 */
export default app => {

    /**
     * @swagger
     * /estados:
     *   get:
     *     summary: Lista todos os estados
     *     tags: [Estados]
     *     description: Retorna uma lista de estados.
     *     responses:
     *       200:
     *         description: Lista de estados retornada com sucesso
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
     *                   codigo_telefone:
     *                     type: string
     *                     nullable: true
     *                   pais_id:
     *                     type: integer
     */
    app.route('/estados')
        .get([
            controller.listagem,
        ]);
};
