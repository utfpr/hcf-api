import listagensMiddleware from '../middlewares/listagens-middleware';
import criaOrdenacaoMiddleware from '../middlewares/ordenacao-middleware';
import tokensMiddleware, { TIPOS_USUARIOS } from '../middlewares/tokens-middleware';
import validacoesMiddleware from '../middlewares/validacoes-middleware';
import autorAtualizaEsquema from '../validators/autor-atualiza';
import autorCadastroEsquema from '../validators/autor-cadastro';
import autorDesativaEsquema from '../validators/autor-desativa';
import autorListagemEsquema from '../validators/autor-listagem';
import desativarFamiliaEsquema from '../validators/desativar-familia';
import especieEsquema from '../validators/especie';
import especieAtualizaEsquema from '../validators/especie-atualiza';
import especieDesativaEsquema from '../validators/especie-desativa';
import especieListagemEsquema from '../validators/especie-listagem';
import atualizaFamiliaEsquema from '../validators/familia-atualiza';
import listagemFamiliaEsquema from '../validators/familia-listagem';
import generoEsquema from '../validators/genero';
import generoAtualizaEsquema from '../validators/genero-atualiza';
import generoDesativarEsquema from '../validators/genero-desativar';
import generoListagemEsquema from '../validators/genero-listagem';
import nomeEsquema from '../validators/nome-obrigatorio';
import atualizaReinoEsquema from '../validators/reino-atualiza';
import reinoListagemEsquema from '../validators/reino-listagem';
import subespecieEsquema from '../validators/subespecie';
import subespecieAtualizaEsquema from '../validators/subespecie-atualiza';
import subespecieListagemEsquema from '../validators/subespecie-listagem';
import subfamiliaAtualizaEsquema from '../validators/subfamilia-atualiza';
import subfamiliaDesativarEsquema from '../validators/subfamilia-desativar';
import subfamiliaListagemEsquema from '../validators/subfamilia-listagem';
import variedadeAtualizaEsquema from '../validators/variedade-atualiza';
import variedadeDesativaEsquema from '../validators/variedade-desativa';
import variedadeListagemEsquema from '../validators/variedade-listagem';

const controller = require('../controllers/taxonomias-controller');

const reinosOrdenacaoMiddleware = criaOrdenacaoMiddleware(['reino'], 'nome', 'asc');
const familiasOrdenacaoMiddleware = criaOrdenacaoMiddleware(['reino', 'familia'], 'nome', 'asc');
const subfamiliasOrdenacaoMiddleware = criaOrdenacaoMiddleware(['reino', 'subfamilia', 'familia', 'autor'], 'nome', 'asc');
const generosOrdenacaoMiddleware = criaOrdenacaoMiddleware(['genero', 'familia', 'reino'], 'nome', 'asc');
const especiesOrdenacaoMiddleware = criaOrdenacaoMiddleware(['especie', 'reino', 'familia', 'genero', 'familia'], 'nome', 'asc');
const subEspeciesOrdenacaoMiddleware = criaOrdenacaoMiddleware(['subespecie', 'reino', 'familia', 'genero', 'especie', 'autor'], 'nome', 'asc');
const variedadesOrdenacaoMiddleware = criaOrdenacaoMiddleware(['variedade', 'reino', 'familia', 'genero', 'especie', 'autor'], 'nome', 'asc');

/**
 * @swagger
 * tags:
 *   name: Taxonomias
 *   description: Operações relacionadas às taxonomias
 */
export default app => {

    /**
 * @swagger
 * /taxonomias:
 *   get:
 *     summary: Lista todas as taxonomias
 *     tags: [Taxonomias]
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
 *       # Adicionar outros parâmetros de filtro e ordenação conforme implementado no controller.listagem
 *     responses:
 *       200:
 *         description: Lista de taxonomias
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
 *                       description: Número total de registros encontrados.
 *                     pagina:
 *                       type: integer
 *                       description: Número da página atual.
 *                     limite:
 *                       type: integer
 *                       description: Número de registros por página.
 *                 resultado:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       familia:
 *                         type: string
 *                         nullable: true
 *                       genero:
 *                         type: string
 *                         nullable: true
 *                       especie:
 *                         type: string
 *                         nullable: true
 *                       variedade:
 *                         type: string
 *                         nullable: true
 *                       sub_especie:
 *                         type: string
 *                         nullable: true
 *                       sub_familia:
 *                         type: string
 *                         nullable: true
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '403':
 *         $ref: '#/components/responses/Forbidden'
 *       '500':
 *         $ref: '#/components/responses/InternalServerError'
 */
    app.route('/taxonomias')
        .get([
            listagensMiddleware,
            controller.listagem,
        ]);

    /**
 * @swagger
 * /reinos:
 *   post:
 *     summary: Cadastra um novo reino
 *     tags: [Taxonomias]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *             required:
 *               - nome
 *           example:
 *             nome: "Plantae"
 *     responses:
 *       201:
 *         description: Reino cadastrado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 id: 1
 *                 nome: "Plantae"
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '403':
 *         $ref: '#/components/responses/Forbidden'
 *       '500':
 *         $ref: '#/components/responses/InternalServerError'
 *   get:
 *     summary: Lista todos os reinos
 *     tags: [Taxonomias]
 *     parameters: # Adicione aqui os parâmetros de paginação e filtro se aplicável
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
 *       # Adicionar outros parâmetros de filtro e ordenação conforme implementado
 *     responses:
 *       200:
 *         description: Lista de reinos
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
 *                       description: Número total de registros encontrados.
 *                     pagina:
 *                       type: integer
 *                       description: Número da página atual.
 *                     limite:
 *                       type: integer
 *                       description: Número de registros por página.
 *                 resultado:
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
    app
        .route('/reinos')
        .post([
            tokensMiddleware([TIPOS_USUARIOS.CURADOR, TIPOS_USUARIOS.OPERADOR, TIPOS_USUARIOS.IDENTIFICADOR]),
            validacoesMiddleware(nomeEsquema),
            controller.cadastrarReino,
        ])
        .get([
            listagensMiddleware,
            reinosOrdenacaoMiddleware,
            validacoesMiddleware(reinoListagemEsquema),
            controller.buscarReinos,
        ]);

    /**
 * @swagger
 * /reinos/{reino_id}:
 *   put:
 *     summary: Edita um reino
 *     tags: [Taxonomias]
 *     parameters:
 *       - in: path
 *         name: reino_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do reino
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *             required:
 *               - nome
 *           example:
 *             nome: "Novo nome do reino"
 *     responses:
 *       200:
 *         description: Reino editado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 id: 1
 *                 nome: "Novo nome do reino"
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
    app
        .route('/reinos/:reino_id')
        .put([
            tokensMiddleware([
                TIPOS_USUARIOS.CURADOR, TIPOS_USUARIOS.OPERADOR, TIPOS_USUARIOS.IDENTIFICADOR,
            ]),
            validacoesMiddleware(atualizaReinoEsquema),
            controller.editarReino,
        ]);

    /**
 * @swagger
 * /familias:
 *   post:
 *     summary: Cadastra uma nova família
 *     tags: [Taxonomias]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *             required:
 *               - nome
 *           example:
 *             nome: "Fabaceae"
 *     responses:
 *       201:
 *         description: Família cadastrada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 id: 1
 *                 nome: "Fabaceae"
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '403':
 *         $ref: '#/components/responses/Forbidden'
 *       '500':
 *         $ref: '#/components/responses/InternalServerError'
 *   get:
 *     summary: Lista todas as famílias
 *     tags: [Taxonomias]
 *     parameters: # Adicione aqui os parâmetros de paginação e filtro se aplicável
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
 *       # Adicionar outros parâmetros de filtro e ordenação conforme implementado
 *     responses:
 *       200:
 *         description: Lista de famílias
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
 *                       description: Número total de registros encontrados.
 *                     pagina:
 *                       type: integer
 *                       description: Número da página atual.
 *                     limite:
 *                       type: integer
 *                       description: Número de registros por página.
 *                 resultado:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       nome:
 *                         type: string
 *                       reino:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           nome:
 *                             type: string
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '403':
 *         $ref: '#/components/responses/Forbidden'
 *       '500':
 *         $ref: '#/components/responses/InternalServerError'
 */
    app
        .route('/familias')
        .post([
            tokensMiddleware([TIPOS_USUARIOS.CURADOR, TIPOS_USUARIOS.OPERADOR, TIPOS_USUARIOS.IDENTIFICADOR]),
            validacoesMiddleware(nomeEsquema),
            controller.cadastrarFamilia,
        ])
        .get([
            listagensMiddleware,
            familiasOrdenacaoMiddleware,
            validacoesMiddleware(listagemFamiliaEsquema),
            controller.buscarFamilias,
        ]);

    /**
 * @swagger
 * /familias/{familia_id}:
 *   put:
 *     summary: Edita uma família
 *     tags: [Taxonomias]
 *     parameters:
 *       - in: path
 *         name: familia_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da família
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *             required:
 *               - nome
 *           example:
 *             nome: "Novo nome da família"
 *     responses:
 *       200:
 *         description: Família editada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 id: 1
 *                 nome: "Novo nome da família"
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
 *   delete:
 *     summary: Remove uma família
 *     tags: [Taxonomias]
 *     parameters:
 *       - in: path
 *         name: familia_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da família
 *     responses:
 *       204:
 *         description: Família removida com sucesso
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '403':
 *         $ref: '#/components/responses/Forbidden'
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 *       '500':
 *         $ref: '#/components/responses/InternalServerError'
 */
    app.route('/familias/:familia_id')
        .put([
            tokensMiddleware([
                TIPOS_USUARIOS.CURADOR, TIPOS_USUARIOS.OPERADOR, TIPOS_USUARIOS.IDENTIFICADOR,
            ]),
            validacoesMiddleware(atualizaFamiliaEsquema),
            controller.editarFamilia,
        ])
        .delete([
            tokensMiddleware([
                TIPOS_USUARIOS.CURADOR, TIPOS_USUARIOS.OPERADOR,
            ]),
            validacoesMiddleware(desativarFamiliaEsquema),
            controller.excluirFamilia,
        ]);

    /**
 * @swagger
 * /generos:
 *   post:
 *     summary: Cadastra um novo gênero
 *     tags: [Taxonomias]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *             required:
 *               - nome
 *           example:
 *             nome: "Myrtaceae"
 *     responses:
 *       201:
 *         description: Gênero cadastrado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 id: 1
 *                 nome: "Myrtaceae"
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '403':
 *         $ref: '#/components/responses/Forbidden'
 *       '500':
 *         $ref: '#/components/responses/InternalServerError'
 *   get:
 *     summary: Lista todos os gêneros
 *     tags: [Taxonomias]
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
 *         name: genero
 *         schema:
 *           type: string
 *         description: Filtrar por nome do gênero
 *       - in: query
 *         name: familia
 *         schema:
 *           type: string
 *         description: Filtrar por nome da família
 *     responses:
 *       200:
 *         description: Lista de gêneros
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
 *                 resultado:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       nome:
 *                         type: string
 *                       familia:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           nome:
 *                             type: string
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '403':
 *         $ref: '#/components/responses/Forbidden'
 *       '500':
 *         $ref: '#/components/responses/InternalServerError'
 */
    app.route('/generos')
        .post([
            tokensMiddleware([
                TIPOS_USUARIOS.CURADOR, TIPOS_USUARIOS.OPERADOR, TIPOS_USUARIOS.IDENTIFICADOR,
            ]),
            validacoesMiddleware(generoEsquema),
            controller.cadastrarGenero,
        ])
        .get([
            listagensMiddleware,
            generosOrdenacaoMiddleware,
            validacoesMiddleware(generoListagemEsquema),
            controller.buscarGeneros,
        ]);

    /**
 * @swagger
 * /generos/{genero_id}:
 *   put:
 *     summary: Edita um gênero
 *     tags: [Taxonomias]
 *     parameters:
 *       - in: path
 *         name: genero_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do gênero
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *             required:
 *               - nome
 *           example:
 *             nome: "Novo nome do gênero"
 *     responses:
 *       200:
 *         description: Gênero editado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 id: 1
 *                 nome: "Novo nome do gênero"
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
 *   delete:
 *     summary: Remove um gênero
 *     tags: [Taxonomias]
 *     parameters:
 *       - in: path
 *         name: genero_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do gênero
 *     responses:
 *       204:
 *         description: Gênero removido com sucesso
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '403':
 *         $ref: '#/components/responses/Forbidden'
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 *       '500':
 *         $ref: '#/components/responses/InternalServerError'
 */
    app.route('/generos/:genero_id')
        .put([
            tokensMiddleware([
                TIPOS_USUARIOS.CURADOR, TIPOS_USUARIOS.OPERADOR, TIPOS_USUARIOS.IDENTIFICADOR,
            ]),
            validacoesMiddleware(generoAtualizaEsquema),
            controller.editarGenero,
        ])
        .delete([
            tokensMiddleware([
                TIPOS_USUARIOS.CURADOR, TIPOS_USUARIOS.OPERADOR,
            ]),
            validacoesMiddleware(generoDesativarEsquema),
            controller.excluirGeneros,
        ]);

    /**
 * @swagger
 * /subfamilias:
 *   post:
 *     summary: Cadastra uma nova subfamília
 *     tags: [Taxonomias]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *             required:
 *               - nome
 *           example:
 *             nome: "Mimosoideae"
 *     responses:
 *       201:
 *         description: Subfamília cadastrada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 id: 1
 *                 nome: "Mimosoideae"
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '403':
 *         $ref: '#/components/responses/Forbidden'
 *       '500':
 *         $ref: '#/components/responses/InternalServerError'
 *   get:
 *     summary: Lista todas as subfamílias
 *     tags: [Taxonomias]
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
 *         name: subfamilia
 *         schema:
 *           type: string
 *         description: Filtrar por nome da subfamília
 *       - in: query
 *         name: familia
 *         schema:
 *           type: string
 *         description: Filtrar por nome da família
 *     responses:
 *       200:
 *         description: Lista de subfamílias
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
 *                 resultado:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       nome:
 *                         type: string
 *                       familia:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           nome:
 *                             type: string
 *                       autor:
 *                         type: object
 *                         nullable: true
 *                         properties:
 *                           id:
 *                             type: integer
 *                           nome:
 *                             type: string
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '403':
 *         $ref: '#/components/responses/Forbidden'
 *       '500':
 *         $ref: '#/components/responses/InternalServerError'
 */
    app.route('/subfamilias')
        .post([
            tokensMiddleware([
                TIPOS_USUARIOS.CURADOR, TIPOS_USUARIOS.OPERADOR, TIPOS_USUARIOS.IDENTIFICADOR,
            ]),
            validacoesMiddleware(generoEsquema),
            controller.cadastrarSubfamilia,
        ])
        .get([
            listagensMiddleware,
            subfamiliasOrdenacaoMiddleware,
            validacoesMiddleware(subfamiliaListagemEsquema),
            controller.buscarSubfamilia,
        ]);

    /**
 * @swagger
 * /subfamilias/{subfamilia_id}:
 *   put:
 *     summary: Edita uma subfamília
 *     tags: [Taxonomias]
 *     parameters:
 *       - in: path
 *         name: subfamilia_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da subfamília
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *             required:
 *               - nome
 *           example:
 *             nome: "Novo nome da subfamília"
 *     responses:
 *       200:
 *         description: Subfamília editada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 id: 1
 *                 nome: "Novo nome da subfamília"
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
 *   delete:
 *     summary: Remove uma subfamília
 *     tags: [Taxonomias]
 *     parameters:
 *       - in: path
 *         name: subfamilia_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da subfamília
 *     responses:
 *       204:
 *         description: Subfamília removida com sucesso
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '403':
 *         $ref: '#/components/responses/Forbidden'
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 *       '500':
 *         $ref: '#/components/responses/InternalServerError'
 */
    app.route('/subfamilias/:subfamilia_id')
        .put([
            tokensMiddleware([
                TIPOS_USUARIOS.CURADOR, TIPOS_USUARIOS.OPERADOR, TIPOS_USUARIOS.IDENTIFICADOR,
            ]),
            validacoesMiddleware(subfamiliaAtualizaEsquema),
            controller.editarSubfamilia,
        ])
        .delete([
            tokensMiddleware([
                TIPOS_USUARIOS.CURADOR, TIPOS_USUARIOS.OPERADOR,
            ]),
            validacoesMiddleware(subfamiliaDesativarEsquema),
            controller.excluirSubfamilia,
        ]);

    /**
 * @swagger
 * /especies:
 *   post:
 *     summary: Cadastra uma nova espécie
 *     tags: [Taxonomias]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *             required:
 *               - nome
 *           example:
 *             nome: "Eucalyptus grandis"
 *     responses:
 *       201:
 *         description: Espécie cadastrada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 id: 1
 *                 nome: "Eucalyptus grandis"
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '403':
 *         $ref: '#/components/responses/Forbidden'
 *       '500':
 *         $ref: '#/components/responses/InternalServerError'
 *   get:
 *     summary: Lista todas as espécies
 *     tags: [Taxonomias]
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
 *         name: especie
 *         schema:
 *           type: string
 *         description: Filtrar por nome da espécie
 *       - in: query
 *         name: genero
 *         schema:
 *           type: string
 *         description: Filtrar por nome do gênero
 *       - in: query
 *         name: familia
 *         schema:
 *           type: string
 *         description: Filtrar por nome da família
 *     responses:
 *       200:
 *         description: Lista de espécies
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
 *                 resultado:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       nome:
 *                         type: string
 *                       familia:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           nome:
 *                             type: string
 *                       genero:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           nome:
 *                             type: string
 *                       autor:
 *                         type: object
 *                         nullable: true
 *                         properties:
 *                           id:
 *                             type: integer
 *                           nome:
 *                             type: string
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '403':
 *         $ref: '#/components/responses/Forbidden'
 *       '500':
 *         $ref: '#/components/responses/InternalServerError'
 */
    app.route('/especies')
        .post([
            tokensMiddleware([
                TIPOS_USUARIOS.CURADOR, TIPOS_USUARIOS.OPERADOR, TIPOS_USUARIOS.IDENTIFICADOR,
            ]),
            validacoesMiddleware(especieEsquema),
            controller.cadastrarEspecie,
        ])
        .get([
            listagensMiddleware,
            especiesOrdenacaoMiddleware,
            validacoesMiddleware(especieListagemEsquema),
            controller.buscarEspecies,
        ]);

    /**
 * @swagger
 * /especies/{especie_id}:
 *   put:
 *     summary: Edita uma espécie
 *     tags: [Taxonomias]
 *     parameters:
 *       - in: path
 *         name: especie_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da espécie
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *             required:
 *               - nome
 *           example:
 *             nome: "Novo nome da espécie"
 *     responses:
 *       200:
 *         description: Espécie editada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 id: 1
 *                 nome: "Novo nome da espécie"
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
 *   delete:
 *     summary: Remove uma espécie
 *     tags: [Taxonomias]
 *     parameters:
 *       - in: path
 *         name: especie_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da espécie
 *     responses:
 *       204:
 *         description: Espécie removida com sucesso
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '403':
 *         $ref: '#/components/responses/Forbidden'
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 *       '500':
 *         $ref: '#/components/responses/InternalServerError'
 */
    app.route('/especies/:especie_id')
        .put([
            tokensMiddleware([
                TIPOS_USUARIOS.CURADOR, TIPOS_USUARIOS.OPERADOR, TIPOS_USUARIOS.IDENTIFICADOR,
            ]),
            validacoesMiddleware(especieAtualizaEsquema),
            controller.editarEspecie,
        ])
        .delete([
            tokensMiddleware([
                TIPOS_USUARIOS.CURADOR, TIPOS_USUARIOS.OPERADOR,
            ]),
            validacoesMiddleware(especieDesativaEsquema),
            controller.excluirEspecies,
        ]);

    /**
 * @swagger
 * /subespecies:
 *   post:
 *     summary: Cadastra uma nova subespécie
 *     tags: [Taxonomias]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *             required:
 *               - nome
 *           example:
 *             nome: "Eucalyptus grandis subsp. robusta"
 *     responses:
 *       201:
 *         description: Subespécie cadastrada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 id: 1
 *                 nome: "Eucalyptus grandis subsp. robusta"
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '403':
 *         $ref: '#/components/responses/Forbidden'
 *       '500':
 *         $ref: '#/components/responses/InternalServerError'
 *   get:
 *     summary: Lista todas as subespécies
 *     tags: [Taxonomias]
 *     responses:
 *       200:
 *         description: Lista de subespécies
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
 *                 resultado:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       nome:
 *                         type: string
 *                       familia:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           nome:
 *                             type: string
 *                       genero:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           nome:
 *                             type: string
 *                       especie:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           nome:
 *                             type: string
 *                       autor:
 *                         type: object
 *                         nullable: true
 *                         properties:
 *                           id:
 *                             type: integer
 *                           nome:
 *                             type: string
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '403':
 *         $ref: '#/components/responses/Forbidden'
 *       '500':
 *         $ref: '#/components/responses/InternalServerError'
 */
    app.route('/subespecies')
        .post([
            tokensMiddleware([
                TIPOS_USUARIOS.CURADOR, TIPOS_USUARIOS.OPERADOR, TIPOS_USUARIOS.IDENTIFICADOR,
            ]),
            validacoesMiddleware(subespecieEsquema),
            controller.cadastrarSubespecie,
        ])
        .get([
            listagensMiddleware,
            subEspeciesOrdenacaoMiddleware,
            validacoesMiddleware(subespecieListagemEsquema),
            controller.buscarSubespecies,
        ]);

    /**
 * @swagger
 * /subespecies/{subespecie_id}:
 *   put:
 *     summary: Edita uma subespécie
 *     tags: [Taxonomias]
 *     parameters:
 *       - in: path
 *         name: subespecie_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da subespécie
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *             required:
 *               - nome
 *           example:
 *             nome: "Novo nome da subespécie"
 *     responses:
 *       200:
 *         description: Subespécie editada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 id: 1
 *                 nome: "Novo nome da subespécie"
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
 *   delete:
 *     summary: Remove uma subespécie
 *     tags: [Taxonomias]
 *     parameters:
 *       - in: path
 *         name: subespecie_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da subespécie
 *     responses:
 *       204:
 *         description: Subespécie removida com sucesso
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '403':
 *         $ref: '#/components/responses/Forbidden'
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 *       '500':
 *         $ref: '#/components/responses/InternalServerError'
 */
    app.route('/subespecies/:subespecie_id')
        .put([
            tokensMiddleware([
                TIPOS_USUARIOS.CURADOR, TIPOS_USUARIOS.OPERADOR, TIPOS_USUARIOS.IDENTIFICADOR,
            ]),
            validacoesMiddleware(subespecieAtualizaEsquema),
            controller.editarSubespecie,
        ])
        .delete([
            tokensMiddleware([
                TIPOS_USUARIOS.CURADOR, TIPOS_USUARIOS.OPERADOR,
            ]),
            controller.excluirSubespecies,
        ]);

    /**
 * @swagger
 * /variedades:
 *   post:
 *     summary: Cadastra uma nova variedade
 *     tags: [Taxonomias]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *             required:
 *               - nome
 *           example:
 *             nome: "Eucalyptus grandis var. robusta"
 *     responses:
 *       201:
 *         description: Variedade cadastrada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 id: 1
 *                 nome: "Eucalyptus grandis var. robusta"
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '403':
 *         $ref: '#/components/responses/Forbidden'
 *       '500':
 *         $ref: '#/components/responses/InternalServerError'
 *   get:
 *     summary: Lista todas as variedades
 *     tags: [Taxonomias]
 *     responses:
 *       200:
 *         description: Lista de variedades
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
 *                 resultado:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       nome:
 *                         type: string
 *                       familia:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           nome:
 *                             type: string
 *                       genero:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           nome:
 *                             type: string
 *                       especie:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           nome:
 *                             type: string
 *                       autor:
 *                         type: object
 *                         nullable: true
 *                         properties:
 *                           id:
 *                             type: integer
 *                           nome:
 *                             type: string
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '403':
 *         $ref: '#/components/responses/Forbidden'
 *       '500':
 *         $ref: '#/components/responses/InternalServerError'
 */
    app.route('/variedades')
        .post([
            tokensMiddleware([
                TIPOS_USUARIOS.CURADOR, TIPOS_USUARIOS.OPERADOR, TIPOS_USUARIOS.IDENTIFICADOR,
            ]),
            validacoesMiddleware(subespecieEsquema),
            controller.cadastrarVariedade,
        ])
        .get([
            listagensMiddleware,
            variedadesOrdenacaoMiddleware,
            validacoesMiddleware(variedadeListagemEsquema),
            controller.buscarVariedades,
        ]);

    /**
 * @swagger
 * /variedades/{variedade_id}:
 *   put:
 *     summary: Edita uma variedade
 *     tags: [Taxonomias]
 *     parameters:
 *       - in: path
 *         name: variedade_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da variedade
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *             required:
 *               - nome
 *           example:
 *             nome: "Novo nome da variedade"
 *     responses:
 *       200:
 *         description: Variedade editada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 id: 1
 *                 nome: "Novo nome da variedade"
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
 *   delete:
 *     summary: Remove uma variedade
 *     tags: [Taxonomias]
 *     parameters:
 *       - in: path
 *         name: variedade_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da variedade
 *     responses:
 *       204:
 *         description: Variedade removida com sucesso
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '403':
 *         $ref: '#/components/responses/Forbidden'
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 *       '500':
 *         $ref: '#/components/responses/InternalServerError'
 */
    app.route('/variedades/:variedade_id')
        .put([
            tokensMiddleware([
                TIPOS_USUARIOS.CURADOR, TIPOS_USUARIOS.OPERADOR, TIPOS_USUARIOS.IDENTIFICADOR,
            ]),
            validacoesMiddleware(variedadeAtualizaEsquema),
            controller.editarVariedade,
        ])
        .delete([
            tokensMiddleware([
                TIPOS_USUARIOS.CURADOR, TIPOS_USUARIOS.OPERADOR,
            ]),
            validacoesMiddleware(variedadeDesativaEsquema),
            controller.excluirVariedades,
        ]);

    /**
 * @swagger
 * /autores:
 *   post:
 *     summary: Cadastra um novo autor
 *     tags: [Taxonomias]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *             required:
 *               - nome
 *           example:
 *             nome: "A. Author"
 *     responses:
 *       201:
 *         description: Autor cadastrado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 id: 1
 *                 nome: "A. Author"
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '403':
 *         $ref: '#/components/responses/Forbidden'
 *       '500':
 *         $ref: '#/components/responses/InternalServerError'
 *   get:
 *     summary: Lista todos os autores
 *     tags: [Taxonomias]
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
 *       # Adicionar outros parâmetros de filtro e ordenação conforme implementado
 *     responses:
 *       200:
 *         description: Lista de autores
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
 *                       description: Número total de registros encontrados.
 *                     pagina:
 *                       type: integer
 *                       description: Número da página atual.
 *                     limite:
 *                       type: integer
 *                       description: Número de registros por página.
 *                 resultado:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       nome:
 *                         type: string
 *                       iniciais:
 *                         type: string
 *                         nullable: true
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '403':
 *         $ref: '#/components/responses/Forbidden'
 *       '500':
 *         $ref: '#/components/responses/InternalServerError'
 */
    app.route('/autores')
        .post([
            tokensMiddleware([
                TIPOS_USUARIOS.CURADOR, TIPOS_USUARIOS.OPERADOR, TIPOS_USUARIOS.IDENTIFICADOR,
            ]),
            validacoesMiddleware(autorCadastroEsquema),
            controller.cadastrarAutores,
        ])
        .get([
            listagensMiddleware,
            validacoesMiddleware(autorListagemEsquema),
            controller.buscarAutores,
        ]);

    /**
 * @swagger
 * /autores/{autor_id}:
 *   put:
 *     summary: Edita um autor
 *     tags: [Taxonomias]
 *     parameters:
 *       - in: path
 *         name: autor_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do autor
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *             required:
 *               - nome
 *           example:
 *             nome: "Novo nome do autor"
 *     responses:
 *       200:
 *         description: Autor editado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 id: 1
 *                 nome: "Novo nome do autor"
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
 *   delete:
 *     summary: Remove um autor
 *     tags: [Taxonomias]
 *     parameters:
 *       - in: path
 *         name: autor_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do autor
 *     responses:
 *       204:
 *         description: Autor removido com sucesso
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '403':
 *         $ref: '#/components/responses/Forbidden'
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 *       '500':
 *         $ref: '#/components/responses/InternalServerError'
 */
    app.route('/autores/:autor_id')
        .put([
            tokensMiddleware([
                TIPOS_USUARIOS.CURADOR, TIPOS_USUARIOS.OPERADOR, TIPOS_USUARIOS.IDENTIFICADOR,
            ]),
            validacoesMiddleware(autorAtualizaEsquema),
            controller.editarAutores,
        ])
        .delete([
            tokensMiddleware([
                TIPOS_USUARIOS.CURADOR, TIPOS_USUARIOS.OPERADOR,
            ]),
            validacoesMiddleware(autorDesativaEsquema),
            controller.excluirAutores,
        ]);
};
