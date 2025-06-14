import * as coletoresController from '../controllers/coletor-controller';
import listagensMiddleware from '../middlewares/listagens-middleware';
import tokensMiddleware from '../middlewares/tokens-middleware';
import validacoesMiddleware from '../middlewares/validacoes-middleware';
import atualizarColetorEsquema from '../validators/coletor-atualiza';
import cadastrarColetorEsquema from '../validators/coletor-cadastro';
import desativarColetorEsquema from '../validators/coletor-desativa';
import listarColetoresEsquema from '../validators/coletor-listagem';

/**
 * @swagger
 * tags:
 *   name: Coletores
 *   description: Operações relacionadas aos coletores
 */

export default app => {
    /**
     * @swagger
     * /coletores:
     *   post:
     *     summary: Cadastra um novo coletor
     *     tags: [Coletores]
     *     description: Cria um novo coletor no sistema.
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               nome:
     *                 type: string
     *                 minLength: 3
     *                 description: Nome do coletor
     *               email:
     *                 type: string
     *                 minLength: 5
     *                 description: Email do coletor (opcional)
     *               numero:
     *                 type: integer
     *                 description: Número do coletor
     *             required:
     *               - nome
     *               - numero
     *     responses:
     *       201:
     *         description: Coletor cadastrado com sucesso
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 id:
     *                   type: integer
     *                 nome:
     *                   type: string
     *                 email:
     *                   type: string
     *                 numero:
     *                   type: integer
     *                 updated_at:
     *                   type: string
     *                   format: date-time
     *                 created_at:
     *                   type: string
     *                   format: date-time
     *       400:
     *         description: Dados inválidos
     */
    app.route('/coletores').post([
        tokensMiddleware(['CURADOR']),
        validacoesMiddleware(cadastrarColetorEsquema),
        coletoresController.cadastraColetor,
    ]);

    /**
     * @swagger
     * /coletores/{id}:
     *   get:
     *     summary: Busca um coletor pelo ID
     *     tags: [Coletores]
     *     description: Retorna os dados de um coletor específico.
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
     *         description: ID do coletor
     *     responses:
     *       200:
     *         description: Dados do coletor encontrados
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 id:
     *                   type: integer
     *                 nome:
     *                   type: string
     *                 email:
     *                   type: string
     *                   nullable: true
     *                 numero:
     *                   type: integer
     *       404:
     *         description: Coletor não encontrado
     */
    app.route('/coletores/:id').get([
        tokensMiddleware(['CURADOR']),
        coletoresController.encontraColetor,
    ]);

    /**
     * @swagger
     * /coletores:
     *   get:
     *     summary: Lista todos os coletores
     *     tags: [Coletores]
     *     description: Retorna uma lista de coletores cadastrados.
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
     *         description: Filtrar por nome do coletor
     *       - in: query
     *         name: email
     *         schema:
     *           type: string
     *         description: Filtrar por email do coletor
     *       - in: query
     *         name: numero
     *         schema:
     *           type: integer
     *         description: Filtrar por número do coletor
     *     responses:
     *       200:
     *         description: Lista de coletores
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
     *                 coletores:
     *                   type: array
     *                   items:
     *                     type: object
     *                     properties:
     *                       id:
     *                         type: integer
     *                       nome:
     *                         type: string
     *                       email:
     *                         type: string
     *                         nullable: true
     *                       numero:
     *                         type: integer
     */
    app.route('/coletores').get([
        tokensMiddleware(['CURADOR']),
        validacoesMiddleware(listarColetoresEsquema),
        listagensMiddleware,
        coletoresController.listaColetores,
    ]);

    /**
     * @swagger
     * /coletores/{id}:
     *   put:
     *     summary: Atualiza um coletor
     *     tags: [Coletores]
     *     description: Atualiza os dados de um coletor existente.
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
     *         description: ID do coletor
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               nome:
     *                 type: string
     *                 minLength: 3
     *                 description: Nome do coletor
     *               email:
     *                 type: string
     *                 minLength: 5
     *                 description: Email do coletor (opcional)
     *               numero:
     *                 type: integer
     *                 description: Número do coletor (opcional)
     *             required:
     *               - nome
     *     responses:
     *       200:
     *         description: Coletor atualizado com sucesso
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 id:
     *                   type: integer
     *                 nome:
     *                   type: string
     *                 email:
     *                   type: string
     *                 numero:
     *                   type: integer
     *       400:
     *         description: Dados inválidos
     *       404:
     *         description: Coletor não encontrado
     */
    app.route('/coletores/:id').put([
        tokensMiddleware(['CURADOR']),
        validacoesMiddleware(atualizarColetorEsquema),
        coletoresController.atualizaColetor,
    ]);

    /**
     * @swagger
     * /coletores/{id}:
     *   delete:
     *     summary: Desativa um coletor
     *     tags: [Coletores]
     *     description: Desativa um coletor pelo ID.
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
     *         description: ID do coletor
     *     responses:
     *       204:
     *         description: Coletor desativado com sucesso
     *       404:
     *         description: Coletor não encontrado
     */
    app.route('/coletores/:id').delete([
        tokensMiddleware(['CURADOR']),
        validacoesMiddleware(desativarColetorEsquema),
        coletoresController.desativaColetor,
    ]);
};
