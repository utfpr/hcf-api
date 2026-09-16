import * as RfidsController from '../controllers/rfids-controller.js';
import tokensMiddleware, { TIPOS_USUARIOS } from '../middlewares/tokens-middleware';

/**
 * @swagger
 * tags:
 *   - name: RFIDs
 *     description: Operações de integração com RFID
 */
export default app => {
    const somenteCurador = tokensMiddleware([TIPOS_USUARIOS.CURADOR]);

    /**
     * @swagger
     * /rfids/iniciar-gravacao:
     *   post:
     *     summary: Inicia o fluxo de gravação
     *     tags: [RFIDs]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               tombo_foto_id:
     *                 type: integer
     *             required:
     *               - tombo_foto_id
     *           example:
     *             tombo_foto_id: 15
     *     responses:
     *       '201':
     *         description: Registro criado com status PENDENTE e EPC gerado.
     *       '401':
     *         $ref: '#/components/responses/Unauthorized'
     *       '403':
     *         $ref: '#/components/responses/Forbidden'
     *       '404':
     *         $ref: '#/components/responses/NotFound'
     *       '500':
     *         $ref: '#/components/responses/InternalServerError'
     */
    app.route('/rfids/iniciar-gravacao').post(somenteCurador, RfidsController.iniciarGravacao);

    /**
     * @swagger
     * /rfids/finalizar-gravacao/{id}:
     *   put:
     *     summary: Finaliza o fluxo atualizando o status do RFID
     *     tags: [RFIDs]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
     *         description: ID do registro RFID
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               status:
     *                 type: string
     *                 enum: [CONCLUIDO, FALHA]
     *               tid:
     *                 type: string
     *           example:
     *             status: CONCLUIDO
     *             tid: E200001B4413
     *     responses:
     *       '200':
     *         description: RFID atualizado com sucesso.
     *       '401':
     *         $ref: '#/components/responses/Unauthorized'
     *       '403':
     *         $ref: '#/components/responses/Forbidden'
     *       '404':
     *         $ref: '#/components/responses/NotFound'
     *       '500':
     *         $ref: '#/components/responses/InternalServerError'
     */
    app.route('/rfids/finalizar-gravacao/:id').put(somenteCurador, RfidsController.finalizarGravacao);

    /**
     * @swagger
     * /rfids:
     *   get:
     *     summary: Lista o status de todas as etiquetas e tombos atrelados
     *     tags: [RFIDs]
     *     parameters:
     *       - in: query
     *         name: pagina
     *         schema:
     *           type: integer
     *         description: Número da página para paginação
     *       - in: query
     *         name: limite
     *         schema:
     *           type: integer
     *         description: Quantidade de itens por página
     *     responses:
     *       '200':
     *         description: Lista retornada com sucesso
     *       '401':
     *         $ref: '#/components/responses/Unauthorized'
     *       '403':
     *         $ref: '#/components/responses/Forbidden'
     *       '500':
     *         $ref: '#/components/responses/InternalServerError'
     */
    app.route('/rfids').get(somenteCurador, RfidsController.listagem);

    /**
     * @swagger
     * /rfids/tombos-pendentes:
     *   get:
     *     summary: Lista tombos pendentes de gravação RFID
     *     tags: [RFIDs]
     *     responses:
     *       '200':
     *         description: Lista paginada de tombos/fotos pendentes.
     *       '401':
     *         $ref: '#/components/responses/Unauthorized'
     *       '403':
     *         $ref: '#/components/responses/Forbidden'
     *       '500':
     *         $ref: '#/components/responses/InternalServerError'
     */
    app.route('/rfids/tombos-pendentes').get(somenteCurador, RfidsController.listarPendentesRfid);

    /**
     * @swagger
     * /rfids/validar-tid/{tid}:
     *   get:
     *     summary: Valida uma tag RFID pelo TID
     *     tags: [RFIDs]
     *     parameters:
     *       - in: path
     *         name: tid
     *         required: true
     *         schema:
     *           type: string
     *         description: TID lido da tag física
     *     responses:
     *       '200':
     *         description: TID validado com sucesso.
     *       '401':
     *         $ref: '#/components/responses/Unauthorized'
     *       '403':
     *         $ref: '#/components/responses/Forbidden'
     *       '404':
     *         $ref: '#/components/responses/NotFound'
     *       '500':
     *         $ref: '#/components/responses/InternalServerError'
     */
    app.route('/rfids/validar-tid/:tid').get(somenteCurador, RfidsController.validarTid);
};
