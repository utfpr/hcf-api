import * as controller from '../controllers/estados-controller';
import tokensMiddleware, { TIPOS_USUARIOS } from '../middlewares/tokens-middleware';
import validacoesMiddleware from '../middlewares/validacoes-middleware';
import atualizarEstadoEsquema from '../validators/estado-atualiza';
import cadastrarEstadoEsquema from '../validators/estado-cadastro';
import desativarEstadoEsquema from '../validators/estado-desativa';

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
     *   post:
     *     summary: Cadastra um novo estado
     *     tags: [Estados]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               nome:
     *                 type: string
     *               codigo_telefone:
     *                 type: string
     *               pais_id:
     *                 type: integer
     *             required:
     *               - nome
     *               - pais_id
     *     responses:
     *       201:
     *         description: Estado cadastrado com sucesso
     *       400:
     *         $ref: '#/components/responses/BadRequest'
     *   get:
     *     summary: Lista todos os estados
     *     tags: [Estados]
     *     responses:
     *       200:
     *         description: Lista de estados retornada com sucesso
     */
    app.route('/estados')
        .post([
            tokensMiddleware([TIPOS_USUARIOS.CURADOR, TIPOS_USUARIOS.OPERADOR]),
            validacoesMiddleware(cadastrarEstadoEsquema),
            controller.cadastrarEstado,
        ])
        .get([
            controller.listagem,
        ]);

    /**
     * @swagger
     * /estados/{estadoId}:
     *   get:
     *     summary: Busca um estado pelo ID
     *     tags: [Estados]
     *     parameters:
     *       - in: path
     *         name: estadoId
     *         required: true
     *         schema:
     *           type: integer
     *     responses:
     *       200:
     *         description: Estado encontrado
     *       404:
     *         $ref: '#/components/responses/NotFound'
     *   put:
     *     summary: Atualiza um estado
     *     tags: [Estados]
     *     parameters:
     *       - in: path
     *         name: estadoId
     *         required: true
     *         schema:
     *           type: integer
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               nome:
     *                 type: string
     *               codigo_telefone:
     *                 type: string
     *               pais_id:
     *                 type: integer
     *   delete:
     *     summary: Desativa um estado
     *     tags: [Estados]
     *     parameters:
     *       - in: path
     *         name: estadoId
     *         required: true
     *         schema:
     *           type: integer
     *     responses:
     *       204:
     *         description: Estado desativado com sucesso
     */
    app.route('/estados/:estadoId')
        .get([
            controller.encontrarEstado,
        ])
        .put([
            tokensMiddleware([TIPOS_USUARIOS.CURADOR, TIPOS_USUARIOS.OPERADOR]),
            validacoesMiddleware(atualizarEstadoEsquema),
            controller.atualizarEstado,
        ])
        .delete([
            tokensMiddleware([TIPOS_USUARIOS.CURADOR, TIPOS_USUARIOS.OPERADOR]),
            validacoesMiddleware(desativarEstadoEsquema),
            controller.desativarEstado,
        ]);
};
