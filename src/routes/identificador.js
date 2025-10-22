import * as identificadoresController from '../controllers/identificador-controller';
import listagensMiddleware from '../middlewares/listagens-middleware';
import tokensMiddleware, { TIPOS_USUARIOS } from '../middlewares/tokens-middleware';
import validacoesMiddleware from '../middlewares/validacoes-middleware';
import atualizarIdentificadorEsquema from '../validators/identificador-atualiza';
import cadastrarIdentificadorEsquema from '../validators/identificador-cadastro';
import listarIdentificadoresEsquema from '../validators/identificador-listagem';

/**
 * @swagger
 * tags:
 *   name: Identificadores
 *   description: Operações relacionadas aos identificadores
 */
export default app => {
    /**
     * @swagger
     * /identificadores:
     *   post:
     *     summary: Cadastra um novo identificador
     *     tags: [Identificadores]
     *     description: Cria um novo identificador no sistema.
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               nome:
     *                 type: string
     *                 description: Nome do identificador
     *             required:
     *               - nome
     *           example:
     *             nome: "Identificador Exemplo"
     *     responses:
     *       201:
     *         description: Identificador cadastrado com sucesso
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 id:
     *                   type: integer
     *                 nome:
     *                   type: string
     *                 updated_at:
     *                   type: string
     *                   format: date-time
     *                 created_at:
     *                   type: string
     *                   format: date-time
     *       '400':
     *         $ref: '#/components/responses/BadRequest'
     *       '401':
     *         $ref: '#/components/responses/Unauthorized'
     *       '403':
     *         $ref: '#/components/responses/Forbidden'
     *       '500':
     *         $ref: '#/components/responses/InternalServerError'
     */
    app.route('/identificadores').post([
        tokensMiddleware([TIPOS_USUARIOS.CURADOR]),
        validacoesMiddleware(cadastrarIdentificadorEsquema),
        identificadoresController.cadastraIdentificador,
    ]);

    /**
     * @swagger
     * /identificadores/{id}:
     *   get:
     *     summary: Busca um identificador pelo ID
     *     tags: [Identificadores]
     *     description: Retorna os dados de um identificador específico.
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
     *         description: ID do identificador
     *     responses:
     *       200:
     *         description: Dados do identificador encontrados
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 id:
     *                   type: integer
     *                 nome:
     *                   type: string
     *       '401':
     *         $ref: '#/components/responses/Unauthorized'
     *       '403':
     *         $ref: '#/components/responses/Forbidden'
     *       '404':
     *         $ref: '#/components/responses/NotFound'
     *       '500':
     *         $ref: '#/components/responses/InternalServerError'
     */
    app.route('/identificadores/:id').get([
        tokensMiddleware([TIPOS_USUARIOS.CURADOR]),
        listagensMiddleware,
        identificadoresController.encontradaIdentificador,
    ]);

    /**
     * @swagger
     * /identificadores:
     *   get:
     *     summary: Lista todos os identificadores
     *     tags: [Identificadores]
     *     description: Retorna uma lista de identificadores cadastrados.
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
     *       - in: query
     *         name: nome
     *         schema:
     *           type: string
     *         description: Filtragem por nome
     *     responses:
     *       200:
     *         description: Lista de identificadores
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 metadados:
     *                   type: object
     *                   properties:
     *                     total:
     *                       type: integer
     *                     pagina:
     *                       type: integer
     *                     limite:
     *                       type: integer
     *                 identificadores:
     *                   type: array
     *                   items:
     *                     type: object
     *                     properties:
     *                       id:
     *                         type: integer
     *                       nome:
     *                         type: string
     *       '400':
     *         $ref: '#/components/responses/BadRequest'
     *       '401':
     *         $ref: '#/components/responses/Unauthorized'
     *       '403':
     *         $ref: '#/components/responses/Forbidden'
     *       '500':
     *         $ref: '#/components/responses/InternalServerError'
     */
    app.route('/identificadores').get([
        tokensMiddleware([TIPOS_USUARIOS.CURADOR]),
        validacoesMiddleware(listarIdentificadoresEsquema),
        listagensMiddleware,
        identificadoresController.listaIdentificadores,
    ]);

    /**
     * @swagger
     * /identificadores/{id}:
     *   put:
     *     summary: Atualiza um identificador
     *     tags: [Identificadores]
     *     description: Atualiza os dados de um identificador existente.
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
     *         description: ID do identificador
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               nome:
     *                 type: string
     *                 description: Nome do identificador
     *             required:
     *               - nome
     *           example:
     *             nome: "Identificador Atualizado"
     *     responses:
     *       200:
     *         description: Identificador atualizado com sucesso
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                       id:
     *                         type: integer
     *                       nome:
     *                         type: string
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
    app.route('/identificadores/:id').put([
        tokensMiddleware([TIPOS_USUARIOS.CURADOR]),
        validacoesMiddleware(atualizarIdentificadorEsquema),
        identificadoresController.atualizaIdentificador,
    ]);

    /**
     * @swagger
     * /identificadores/{id}:
     *   delete:
     *     summary: Remove um identificador
     *     tags: [Identificadores]
     *     description: Remove um identificador pelo ID. Verifica se não há tombos associados antes de remover.
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
     *         description: ID do identificador
     *     responses:
     *       204:
     *         description: Identificador removido com sucesso
     *       '400':
     *         description: Não é possível excluir - existem tombos associados
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 mensagem:
     *                   type: string
     *               example:
     *                 mensagem: "Não é possível excluir o identificador. Existem 5 tombo(s) associado(s) a este identificador."
     *       '401':
     *         $ref: '#/components/responses/Unauthorized'
     *       '403':
     *         $ref: '#/components/responses/Forbidden'
     *       '404':
     *         $ref: '#/components/responses/NotFound'
     *       '500':
     *         $ref: '#/components/responses/InternalServerError'
     */
    app.route('/identificadores/:id')
        .delete([
            tokensMiddleware([TIPOS_USUARIOS.CURADOR]),
            identificadoresController.excluirIdentificador,
        ]);
};
