import * as controller from '../controllers/herbarios-controller';
import listagensMiddleware from '../middlewares/listagens-middleware';
import tokensMiddleware, { TIPOS_USUARIOS } from '../middlewares/tokens-middleware';
import validacoesMiddleware from '../middlewares/validacoes-middleware';
import atualizarHerbarioEsquema from '../validators/herbario-atualiza';
import cadastrarHerbarioEsquema from '../validators/herbario-cadastro';
import desativarHerbarioEsquema from '../validators/herbario-desativa';
import listagemHerbarioEsquema from '../validators/herbario-listagem';

/**
 * @swagger
 * tags:
 *   name: Herbários
 *   description: Operações relacionadas aos herbários
 */
export default app => {
    /**
     * @swagger
     * /herbarios:
     *   post:
     *     summary: Cadastra um novo herbário
     *     tags: [Herbários]
     *     description: Cria um novo herbário no sistema.
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               herbario:
     *                 type: object
     *                 properties:
     *                   nome:
     *                     type: string
     *                     description: Nome do herbário
     *                   sigla:
     *                     type: string
     *                     description: Sigla do herbário
     *                   email:
     *                     type: string
     *                     description: Email do herbário
     *                 required:
     *                   - nome
     *                   - sigla
     *                   - email
     *               endereco:
     *                 type: object
     *                 properties:
     *                   cidade_id:
     *                     type: integer
     *                     description: ID da cidade
     *                   logradouro:
     *                     type: string
     *                     description: Logradouro do endereço
     *                   numero:
     *                     type: integer
     *                     description: Número do endereço
     *                 required:
     *                   - cidade_id
     *                   - logradouro
     *                   - numero
     *     responses:
     *       201:
     *         description: Herbário cadastrado com sucesso
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 id:
     *                   type: integer
     *                 nome:
     *                   type: string
     *                 caminho_logotipo:
     *                   type: string
     *                   nullable: true
     *                 sigla:
     *                   type: string
     *                 email:
     *                   type: string
     *                 endereco:
     *                   type: object
     *                   properties:
     *                     id:
     *                       type: integer
     *                     numero:
     *                       type: string
     *                     logradouro:
     *                       type: string
     *                     complemento:
     *                       type: string
     *                       nullable: true
     *       '400':
     *         $ref: '#/components/responses/BadRequest'
     *       '401':
     *         $ref: '#/components/responses/Unauthorized'
     *       '403':
     *         $ref: '#/components/responses/Forbidden'
     *       '500':
     *         $ref: '#/components/responses/InternalServerError'
     */
    app.route('/herbarios')
        .post([
            tokensMiddleware([
                TIPOS_USUARIOS.CURADOR, TIPOS_USUARIOS.OPERADOR,
            ]),
            validacoesMiddleware(cadastrarHerbarioEsquema),
            controller.cadastro,
        ])
        /**
         * @swagger
         * /herbarios:
         *   get:
         *     summary: Lista todos os herbários
         *     tags: [Herbários]
         *     description: Retorna uma lista de herbários cadastrados.
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
         *       200:
         *         description: Lista de herbários
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
         *                 herbarios:
         *                   type: array
         *                   items:
         *                     type: object
         *                     properties:
         *                       id:
         *                         type: integer
         *                       nome:
         *                         type: string
         *                       caminho_logotipo:
         *                         type: string
         *                         nullable: true
         *                       sigla:
         *                         type: string
         *                       email:
         *                         type: string
         *                         nullable: true
         *                       endereco:
         *                         type: object
         *                         nullable: true
         *                         properties:
         *                           id:
         *                             type: integer
         *                           numero:
         *                             type: string
         *                           logradouro:
         *                             type: string
         *                           complemento:
         *                             type: string
         *                             nullable: true
         *                           cidade:
         *                             type: object
         *                             properties:
         *                               id:
         *                                 type: integer
         *                               nome:
         *                                 type: string
         *                               latitude:
         *                                 type: number
         *                               longitude:
         *                                 type: number
         *                               estado:
         *                                 type: object
         *                                 properties:
         *                                   id:
         *                                     type: integer
         *                                   nome:
         *                                     type: string
         *                                   paise:
         *                                     type: object
         *                                     properties:
         *                                       id:
         *                                         type: integer
         *                                       nome:
         *                                         type: string
         *                                       sigla:
         *                                         type: string
         *       '400':
         *         $ref: '#/components/responses/BadRequest'
         *       '401':
         *         $ref: '#/components/responses/Unauthorized'
         *       '403':
         *         $ref: '#/components/responses/Forbidden'
         *       '500':
         *         $ref: '#/components/responses/InternalServerError'
         */
        .get([
            tokensMiddleware([
                TIPOS_USUARIOS.CURADOR, TIPOS_USUARIOS.OPERADOR, TIPOS_USUARIOS.IDENTIFICADOR,
            ]),
            listagensMiddleware,
            validacoesMiddleware(listagemHerbarioEsquema),
            controller.listagem,
        ]);

    /**
     * @swagger
     * /herbarios/{herbario_id}:
     *   put:
     *     summary: Atualiza um herbário
     *     tags: [Herbários]
     *     description: Atualiza os dados de um herbário existente.
     *     parameters:
     *       - in: path
     *         name: herbario_id
     *         required: true
     *         schema:
     *           type: integer
     *         description: ID do herbário
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               herbario:
     *                 type: object
     *                 properties:
     *                   nome:
     *                     type: string
     *                     description: Nome do herbário
     *                   sigla:
     *                     type: string
     *                     description: Sigla do herbário
     *                   email:
     *                     type: string
     *                     description: Email do herbário
     *               endereco:
     *                 type: object
     *                 properties:
     *                   cidade_id:
     *                     type: integer
     *                     description: ID da cidade
     *                   logradouro:
     *                     type: string
     *                     description: Logradouro do endereço
     *                   numero:
     *                     type: integer
     *                     description: Número do endereço
     *     responses:
     *       200:
     *         description: Herbário atualizado com sucesso
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 id:
     *                   type: integer
     *                 nome:
     *                   type: string
     *                 caminho_logotipo:
     *                   type: string
     *                   nullable: true
     *                 sigla:
     *                   type: string
     *                 email:
     *                   type: string
     *                 endereco:
     *                   type: object
     *                   properties:
     *                     id:
     *                       type: integer
     *                     numero:
     *                       type: string
     *                     logradouro:
     *                       type: string
     *                     complemento:
     *                       type: string
     *                       nullable: true
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
    app.route('/herbarios/:herbario_id')
        .put([
            tokensMiddleware([
                TIPOS_USUARIOS.CURADOR, TIPOS_USUARIOS.OPERADOR,
            ]),
            validacoesMiddleware(atualizarHerbarioEsquema),
            controller.editar,
        ])
        /**
         * @swagger
         * /herbarios/{herbario_id}:
         *   delete:
         *     summary: Desativa um herbário
         *     tags: [Herbários]
         *     description: Desativa um herbário pelo ID.
         *     parameters:
         *       - in: path
         *         name: herbario_id
         *         required: true
         *         schema:
         *           type: integer
         *         description: ID do herbário
         *     responses:
         *       204:
         *         description: Herbário desativado com sucesso
         *       '401':
         *         $ref: '#/components/responses/Unauthorized'
         *       '403':
         *         $ref: '#/components/responses/Forbidden'
         *       '404':
         *         $ref: '#/components/responses/NotFound'
         *       '500':
         *         $ref: '#/components/responses/InternalServerError'
         */
        .delete([
            tokensMiddleware([
                TIPOS_USUARIOS.CURADOR, TIPOS_USUARIOS.OPERADOR,
            ]),
            validacoesMiddleware(desativarHerbarioEsquema),
            controller.desativar,
        ])
        /**
         * @swagger
         * /herbarios/{herbario_id}:
         *   get:
         *     summary: Busca um herbário pelo ID
         *     tags: [Herbários]
         *     description: Retorna os dados de um herbário específico.
         *     parameters:
         *       - in: path
         *         name: herbario_id
         *         required: true
         *         schema:
         *           type: integer
         *         description: ID do herbário
         *     responses:
         *       200:
         *         description: Dados do herbário encontrados
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               properties:
         *                 herbario:
         *                   type: object
         *                   properties:
         *                     id:
         *                       type: integer
         *                     nome:
         *                       type: string
         *                     caminho_logotipo:
         *                       type: string
         *                       nullable: true
         *                     sigla:
         *                       type: string
         *                     email:
         *                       type: string
         *                       nullable: true
         *                     endereco:
         *                       type: object
         *                       nullable: true
         *                 paises:
         *                   type: array
         *                   items:
         *                     type: object
         *                     properties:
         *                       id:
         *                         type: integer
         *                       nome:
         *                         type: string
         *                       sigla:
         *                         type: string
         *                 estados:
         *                   type: array
         *                   items:
         *                     type: object
         *                     properties:
         *                       id:
         *                          type: integer
         *                       nome:
         *                         type: string
         *                 cidades:
         *                   type: array
         *                   items:
         *                     type: object
         *                     properties:
         *                       id:
         *                         type: integer
         *                       nome:
         *                         type: string
         *       '401':
         *         $ref: '#/components/responses/Unauthorized'
         *       '403':
         *         $ref: '#/components/responses/Forbidden'
         *       '404':
         *         $ref: '#/components/responses/NotFound'
         *       '500':
         *         $ref: '#/components/responses/InternalServerError'
         */
        .get([
            tokensMiddleware([
                TIPOS_USUARIOS.CURADOR, TIPOS_USUARIOS.OPERADOR, TIPOS_USUARIOS.IDENTIFICADOR,
            ]),
            validacoesMiddleware(desativarHerbarioEsquema),
            controller.buscarHerbario,
        ]);
};
