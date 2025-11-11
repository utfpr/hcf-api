import {
    ListaTodosOsTombosComLocalizacao, buscarHcfEspecifico,
    buscarHcfsPorFaixaDeAltitude, buscarPontosTaxonomiaComFiltros, buscarPontosPorNomePopular, buscarPontosPorNomeCientifico,
} from '../controllers/cidades-controller';
import fichaTomboController from '../controllers/fichas-tombos-controller';
import {
    getDadosCadTombo, getNumeroTombo, cadastro, listagem,
    desativar, obterTombo, cadastrarTipo, buscarTipos, cadastrarColetores, buscarColetores,
    alteracao, getNumeroColetor, getUltimoNumeroTombo, getCodigoBarraTombo,
    editarCodigoBarra, getUltimoNumeroCodigoBarras, postCodigoBarraTombo,
    getUltimoCodigoBarra, deletarCodigoBarras,
    verificarCoordenada,
} from '../controllers/tombos-controller';
import exportarTombosController from '../controllers/tombos-exportacoes-controller';
import criaJsonMiddleware from '../middlewares/json-middleware';
import listagensMiddleware from '../middlewares/listagens-middleware';
import tokensMiddleware, { TIPOS_USUARIOS } from '../middlewares/tokens-middleware';
import validacoesMiddleware from '../middlewares/validacoes-middleware';
import cadastrarCodigoBarrasEsquema from '../validators/codigo-barras-cadastro';
import coletorCadastro from '../validators/coletor-cadastro';
import cadastrarTipoEsquema from '../validators/tipo-cadastro';
import cadastrarTomboEsquema from '../validators/tombo-cadastro';
import listagemTombo from '../validators/tombo-listagem';

/**
 * @swagger
 * tags:
 *   name: Tombos
 *   description: Operações relacionadas aos tombos
 */
export default app => {
    /**
     * @swagger
     * /tombos/dados:
     *   get:
     *     summary: Obtém dados para cadastro de tombo
     *     tags: [Tombos]
     *     responses:
     *       200:
     *         description: Dados retornados com sucesso
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 numero_coleta:
     *                   type: integer
     *                 herbarios:
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
     *       '401':
     *         $ref: '#/components/responses/Unauthorized'
     *       '403':
     *         $ref: '#/components/responses/Forbidden'
     *       '500':
     *         $ref: '#/components/responses/InternalServerError'
     */
    app.route('/tombos/dados')
        .get([
            tokensMiddleware([
                TIPOS_USUARIOS.CURADOR,
                TIPOS_USUARIOS.OPERADOR,
                TIPOS_USUARIOS.IDENTIFICADOR,
            ]),
            getDadosCadTombo,
        ]);

    /**
     * @swagger
     * /tombos/numeroColetor/{idColetor}:
     *   get:
     *     summary: Obtém o número do coletor pelo ID
     *     tags: [Tombos]
     *     parameters:
     *       - in: path
     *         name: idColetor
     *         required: true
     *         schema:
     *           type: integer
     *         description: ID do coletor
     *     responses:
     *       200:
     *         description: Lista de HCF e números de coleta retornada com sucesso
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 type: object
     *                 properties:
     *                   hcf:
     *                     type: integer
     *                   numero_coleta:
     *                     type: integer
     *                     nullable: true
     *       '404':
     *         $ref: '#/components/responses/NotFound'
     *       '500':
     *         $ref: '#/components/responses/InternalServerError'
     */
    app.route('/tombos/numeroColetor/:idColetor')
        .get([
            getNumeroColetor,
        ]);

    /**
     * @swagger
     * /tombos/codigo_barras/{idTombo}:
     *   get:
     *     summary: Obtém o código de barras de um tombo
     *     tags: [Tombos]
     *     parameters:
     *       - in: path
     *         name: idTombo
     *         required: true
     *         schema:
     *           type: integer
     *         description: ID do tombo
     *     responses:
     *       200:
     *         description: Código de barras retornado com sucesso
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 type: object
     *                 properties:
     *                   id:
     *                     type: integer
     *                   codigo_barra:
     *                     type: string
     *                   num_barra:
     *                     type: string
     *                   caminho_foto:
     *                     type: string
     *       '404':
     *         $ref: '#/components/responses/NotFound'
     *       '500':
     *         $ref: '#/components/responses/InternalServerError'
     */
    app.route('/tombos/codigo_barras/:idTombo')
        .get([
            getCodigoBarraTombo,
        ]);

    /**
     * @swagger
     * /tombos/codBarras:
     *   put:
     *     summary: Edita o código de barras de um tombo
     *     tags: [Tombos]
     *     responses:
     *       200:
     *         description: Código de barras editado com sucesso
     *       '400':
     *         $ref: '#/components/responses/BadRequest'
     *       '401':
     *         $ref: '#/components/responses/Unauthorized'
     *       '403':
     *         $ref: '#/components/responses/Forbidden'
     *       '500':
     *         $ref: '#/components/responses/InternalServerError'
     */
    app.route('/tombos/codBarras')
        .put([
            tokensMiddleware([
                TIPOS_USUARIOS.CURADOR,
                TIPOS_USUARIOS.OPERADOR,
                TIPOS_USUARIOS.IDENTIFICADOR,
            ]),
            editarCodigoBarra,
        ]);

    /**
     * @swagger
     * /tombos/MaxcodBarras/{emVivo}:
     *   put:
     *     summary: Obtém o último número de código de barras
     *     tags: [Tombos]
     *     parameters:
     *       - in: path
     *         name: emVivo
     *         required: true
     *         schema:
     *           type: boolean
     *         description: Se é em vivo
     *     responses:
     *       200:
     *         description: Último número retornado com sucesso
     *       '401':
     *         $ref: '#/components/responses/Unauthorized'
     *       '403':
     *         $ref: '#/components/responses/Forbidden'
     *       '500':
     *         $ref: '#/components/responses/InternalServerError'
     */
    app.route('/tombos/MaxcodBarras/:emVivo')
        .put([
            tokensMiddleware([
                TIPOS_USUARIOS.CURADOR,
                TIPOS_USUARIOS.OPERADOR,
                TIPOS_USUARIOS.IDENTIFICADOR,
            ]),
            getUltimoNumeroCodigoBarras,
        ]);

    /**
     * @swagger
     * /tombos/exportar:
     *   get:
     *     summary: Exporta tombos em JSON
     *     tags: [Tombos]
     *     responses:
     *       200:
     *         description: Exportação realizada com sucesso
     *         content:
     *           application/json:
     *             schema:
     *               type: string
     *               format: binary
     *       '400':
     *         $ref: '#/components/responses/BadRequest'
     *       '401':
     *         $ref: '#/components/responses/Unauthorized'
     *       '403':
     *         $ref: '#/components/responses/Forbidden'
     *       '500':
     *         $ref: '#/components/responses/InternalServerError'
     */
    app.route('/tombos/exportar')
        .get([
            listagensMiddleware,
            criaJsonMiddleware([
                'campos',
                'filtros',
            ]),
            exportarTombosController,
        ]);

    /**
     * @swagger
     * /tombos/filtrar_numero/{id}:
     *   get:
     *     summary: Filtra tombo pelo número
     *     tags: [Tombos]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
     *         description: Número do tombo
     *     responses:
     *       200:
     *         description: Lista de HCFs retornada com sucesso
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 type: object
     *                 properties:
     *                   hcf:
     *                     type: integer
     *       '404':
     *         $ref: '#/components/responses/NotFound'
     *       '500':
     *         $ref: '#/components/responses/InternalServerError'
     */
    app.route('/tombos/filtrar_numero/:id')
        .get([
            getNumeroTombo,
        ]);

    /**
     * @swagger
     * /tombos/filtrar_ultimo_numero:
     *   get:
     *     summary: Obtém o último número de tombo cadastrado
     *     tags: [Tombos]
     *     responses:
     *       200:
     *         description: Último número retornado com sucesso
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 hcf:
     *                   type: integer
     *                 data_tombo:
     *                   type: string
     *                   format: date-time
     *       '500':
     *         $ref: '#/components/responses/InternalServerError'
     */
    app.route('/tombos/filtrar_ultimo_numero')
        .get([
            getUltimoNumeroTombo,
        ]);

    /**
     * @swagger
     * /tombos/ultimo_codigo_barra:
     *   get:
     *     summary: Obtém o último codigo de barras
     *     tags: [Tombos]
     *     responses:
     *       200:
     *         description: Último número retornado com sucesso
     *       '500':
     *         $ref: '#/components/responses/InternalServerError'
     */
    app.route('/tombos/ultimo_codigo_barra')
        .get([
            getUltimoCodigoBarra,
        ]);

    /**
     * @swagger
     * /tombos/codigo_barras:
     *   post:
     *     summary: Cadastra um código de barra a um tombo
     *     tags: [Tombos]
     *     responses:
     *       200:
     *         description: Último número retornado com sucesso
     *       '500':
     *         $ref: '#/components/responses/InternalServerError'
     */
    app.route('/tombos/codigo_barras')
        .post([
            validacoesMiddleware(cadastrarCodigoBarrasEsquema),
            postCodigoBarraTombo,
        ]);

    /**
     * @swagger
     * /tombos/codigo_barras/{codigo}:
     *   delete:
     *     summary: Exclui um código de barras
     *     tags: [Tombos]
     *     parameters:
     *       - in: path
     *         name: codigo
     *         required: true
     *         schema:
     *           type: integer
     *         description: codigo de barras
     *     responses:
     *       204:
     *         description: Código de barras removido com sucesso
     *       '401':
     *         $ref: '#/components/responses/Unauthorized'
     *       '403':
     *         $ref: '#/components/responses/Forbidden'
     *       '404':
     *         $ref: '#/components/responses/NotFound'
     *       '500':
     *         $ref: '#/components/responses/InternalServerError'
     */
    app.route('/tombos/codigo_barras/:codigo')
        .delete([
            deletarCodigoBarras,
        ]);

    /**
     * @swagger
     * /tombos:
     *   post:
     *     summary: Cadastra um novo tombo
     *     tags: [Tombos]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               numero:
     *                 type: string
     *               coletor:
     *                 type: string
     *               data_coleta:
     *                 type: string
     *                 format: date
     *               local:
     *                 type: string
     *             required:
     *               - numero
     *               - coletor
     *               - data_coleta
     *               - local
     *           example:
     *             numero: "12345"
     *             coletor: "João"
     *             data_coleta: "2025-06-05"
     *             local: "Parque Estadual"
     *     responses:
     *       201:
     *         description: Tombo cadastrado com sucesso
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               example:
     *                 id: 1
     *                 numero: "12345"
     *                 coletor: "João"
     *                 data_coleta: "2025-06-05"
     *                 local: "Parque Estadual"
     *       '400':
     *         $ref: '#/components/responses/BadRequest'
     *       '401':
     *         $ref: '#/components/responses/Unauthorized'
     *       '403':
     *         $ref: '#/components/responses/Forbidden'
     *       '500':
     *         $ref: '#/components/responses/InternalServerError'
     *   get:
     *     summary: Lista todos os tombos
     *     tags: [Tombos]
     *     responses:
     *       200:
     *         description: Lista de tombos retornada com sucesso
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
     *                 tombos:
     *                   type: array
     *                   items:
     *                     type: object
     *                     properties:
     *                       hcf:
     *                         type: integer
     *                       nomes_populares:
     *                         type: string
     *                       nome_cientifico:
     *                         type: string
     *                       data_coleta_dia:
     *                         type: integer
     *                       data_coleta_mes:
     *                         type: integer
     *                       data_coleta_ano:
     *                         type: integer
     *                       created_at:
     *                         type: string
     *                         format: date-time
     *                       coletore:
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
    app.route('/tombos')
        .post([
            tokensMiddleware([
                TIPOS_USUARIOS.CURADOR,
                TIPOS_USUARIOS.OPERADOR,
            ]),
            validacoesMiddleware(cadastrarTomboEsquema),
            cadastro,
        ])
        .get([
            listagensMiddleware,
            validacoesMiddleware(listagemTombo),
            listagem,
        ]);

    /**
     * @swagger
     * /tombos/{tombo_id}:
     *   put:
     *     summary: Edita um tombo
     *     tags: [Tombos]
     *     parameters:
     *       - in: path
     *         name: tombo_id
     *         required: true
     *         schema:
     *           type: integer
     *         description: ID do tombo
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               numero:
     *                 type: string
     *               coletor:
     *                 type: string
     *               data_coleta:
     *                 type: string
     *                 format: date
     *               local:
     *                 type: string
     *           example:
     *             numero: "54321"
     *             coletor: "Maria"
     *             data_coleta: "2025-06-06"
     *             local: "Reserva Biológica"
     *     responses:
     *       200:
     *         description: Tombo editado com sucesso
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               example:
     *                 id: 1
     *                 numero: "54321"
     *                 coletor: "Maria"
     *                 data_coleta: "2025-06-06"
     *                 local: "Reserva Biológica"
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
     *     summary: Remove um tombo
     *     tags: [Tombos]
     *     parameters:
     *       - in: path
     *         name: tombo_id
     *         required: true
     *         schema:
     *           type: integer
     *         description: ID do tombo
     *     responses:
     *       204:
     *         description: Tombo removido com sucesso
     *       '401':
     *         $ref: '#/components/responses/Unauthorized'
     *       '403':
     *         $ref: '#/components/responses/Forbidden'
     *       '404':
     *         $ref: '#/components/responses/NotFound'
     *       '500':
     *         $ref: '#/components/responses/InternalServerError'
     *   get:
     *     summary: Busca um tombo pelo ID
     *     tags: [Tombos]
     *     parameters:
     *       - in: path
     *         name: tombo_id
     *         required: true
     *         schema:
     *           type: integer
     *         description: ID do tombo
     *     responses:
     *       200:
     *         description: Dados do tombo encontrados
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 herbarioInicial:
     *                   type: integer
     *                 localidadeInicial:
     *                   type: string
     *                 tipoInicial:
     *                   type: string
     *                 cidadeInicial:
     *                   type: string
     *                 familiaInicial:
     *                   type: integer
     *                 subfamiliaInicial:
     *                   type: string
     *                 generoInicial:
     *                   type: integer
     *                 especieInicial:
     *                   type: integer
     *                 subespecieInicial:
     *                   type: string
     *                 variedadeInicial:
     *                   type: string
     *                 soloInicial:
     *                   type: string
     *                 relevoInicial:
     *                   type: string
     *                 vegetacaoInicial:
     *                   type: string
     *                 faseInicial:
     *                   type: string
     *                 coletor:
     *                   type: object
     *                   properties:
     *                     id:
     *                       type: integer
     *                     nome:
     *                       type: string
     *                 colecaoInicial:
     *                   type: string
     *                 complementoInicial:
     *                   type: string
     *                 hcf:
     *                   type: integer
     *                 situacao:
     *                   type: string
     *                 data_tombo:
     *                   type: string
     *                   format: date-time
     *                 observacao:
     *                   type: string
     *                 tipo:
     *                   type: string
     *                 numero_coleta:
     *                   type: integer
     *                   nullable: true
     *                 herbario:
     *                   type: string
     *                 localizacao:
     *                   type: object
     *                 local_coleta:
     *                   type: object
     *                 taxonomia:
     *                   type: object
     *                 colecao_anexa:
     *                   type: object
     *                 data_identificacao_dia:
     *                   type: integer
     *                 data_identificacao_mes:
     *                   type: integer
     *                 data_identificacao_ano:
     *                   type: integer
     *                 identificador_nome:
     *                   type: string
     *                 identificadorInicial:
     *                   type: string
     *                 data_coleta_dia:
     *                   type: integer
     *                 data_coleta_mes:
     *                   type: integer
     *                 data_coleta_ano:
     *                   type: integer
     *                 data_coleta:
     *                   type: string
     *                 data_identificacao:
     *                   type: string
     *                 retorno:
     *                   type: object
     *                 estados:
     *                   type: array
     *                   items: {}
     *                 cidades:
     *                   type: array
     *                   items: {}
     *                 familias:
     *                   type: array
     *                   items: {}
     *                 subfamilias:
     *                   type: array
     *                   items: {}
     *                 generos:
     *                   type: array
     *                   items:
     *                     type: object
     *                 especies:
     *                   type: array
     *                   items:
     *                     type: object
     *                 subespecies:
     *                   type: array
     *                   items: {}
     *                 variedades:
     *                   type: array
     *                   items: {}
     *                 fotos_exsicata:
     *                   type: array
     *                   items: {}
     *                 fotos_vivo:
     *                   type: array
     *                   items:
     *                     type: object
     *                 fotos:
     *                   type: array
     *                   items:
     *                     type: object
     *       '404':
     *         $ref: '#/components/responses/NotFound'
     *       '500':
     *         $ref: '#/components/responses/InternalServerError'
     */
    app.route('/tombos/:tombo_id')
        .put([
            tokensMiddleware([
                TIPOS_USUARIOS.CURADOR,
                TIPOS_USUARIOS.OPERADOR,
                TIPOS_USUARIOS.IDENTIFICADOR,
            ]),
            alteracao,
        ])
        .delete([
            tokensMiddleware([
                TIPOS_USUARIOS.CURADOR,
                TIPOS_USUARIOS.OPERADOR,
            ]),
            desativar,
        ])
        .get([
            listagensMiddleware,
            obterTombo,
        ]);

    /**
     * @swagger
     * /tipos:
     *   post:
     *     summary: Cadastra um novo tipo de tombo
     *     tags: [Tombos]
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
     *             nome: "Herbário"
     *     responses:
     *       201:
     *         description: Tipo cadastrado com sucesso
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               example:
     *                 id: 1
     *                 nome: "Herbário"
     *       '400':
     *         $ref: '#/components/responses/BadRequest'
     *       '401':
     *         $ref: '#/components/responses/Unauthorized'
     *       '403':
     *         $ref: '#/components/responses/Forbidden'
     *       '500':
     *         $ref: '#/components/responses/InternalServerError'
     *   get:
     *     summary: Lista todos os tipos de tombo
     *     tags: [Tombos]
     *     responses:
     *       200:
     *         description: Lista de tipos retornada com sucesso
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
     *               example:
     *                 - id: 1
     *                   nome: "Herbário"
     *       '401':
     *         $ref: '#/components/responses/Unauthorized'
     *       '403':
     *         $ref: '#/components/responses/Forbidden'
     *       '500':
     *         $ref: '#/components/responses/InternalServerError'
     */
    app.route('/tipos')
        .post([
            tokensMiddleware([
                TIPOS_USUARIOS.CURADOR, TIPOS_USUARIOS.OPERADOR,
            ]),
            validacoesMiddleware(cadastrarTipoEsquema),
            cadastrarTipo,
        ])
        .get([
            buscarTipos,
        ]);

    /**
     * @swagger
     * /coletores:
     *   post:
     *     summary: Cadastra um novo coletor
     *     tags: [Tombos]
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
     *             nome: "João"
     *     responses:
     *       201:
     *         description: Coletor cadastrado com sucesso
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               example:
     *                 id: 1
     *                 nome: "João"
     *       '400':
     *         $ref: '#/components/responses/BadRequest'
     *       '401':
     *         $ref: '#/components/responses/Unauthorized'
     *       '403':
     *         $ref: '#/components/responses/Forbidden'
     *       '500':
     *         $ref: '#/components/responses/InternalServerError'
     *   get:
     *     summary: Lista todos os coletores
     *     tags: [Tombos]
     *     responses:
     *       200:
     *         description: Lista de coletores retornada com sucesso
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
     *             example:
     *               metadados:
     *                 total: 1926
     *                 pagina: 1
     *                 limite: 20
     *               coletores:
     *                 - id: 1
     *                   nome: "M.G. Caxambú"
     *                   email: null
     *                   numero: 11798
     *       '401':
     *         $ref: '#/components/responses/Unauthorized'
     *       '403':
     *         $ref: '#/components/responses/Forbidden'
     *       '500':
     *         $ref: '#/components/responses/InternalServerError'
     */
    app.route('/coletores')
        .post([
            tokensMiddleware([
                TIPOS_USUARIOS.CURADOR, TIPOS_USUARIOS.OPERADOR,
            ]),
            validacoesMiddleware(coletorCadastro),
            cadastrarColetores,
        ])
        .get([
            buscarColetores,
        ]);

    /**
     * @swagger
     * /fichas/tombos/{tombo_id}/{imprimir_cod}:
     *   get:
     *     summary: Gera ficha do tombo
     *     tags: [Tombos]
     *     parameters:
     *       - in: path
     *         name: tombo_id
     *         required: true
     *         schema:
     *           type: integer
     *         description: ID do tombo
     *       - in: path
     *         name: imprimir_cod
     *         required: true
     *         schema:
     *           type: boolean
     *         description: Se deve imprimir o código
     *     responses:
     *       200:
     *         description: Ficha gerada com sucesso em formato PDF.
     *         content:
     *           application/pdf:
     *             schema:
     *               type: string
     *               format: binary
     *       '404':
     *         $ref: '#/components/responses/NotFound'
     *       '500':
     *         $ref: '#/components/responses/InternalServerError'
     */
    app.route('/fichas/tombos/:tombo_id/:imprimir_cod')
        .get(fichaTomboController);

    /**
     * @swagger
     * /pontos:
     *   get:
     *     summary: Lista todos os tombos com localização
     *     tags: [Tombos]
     *     responses:
     *       200:
     *         description: Lista de tombos com localização retornada com sucesso
     *       '500':
     *         $ref: '#/components/responses/InternalServerError'
     */
    app.route('/pontos')
        .get([listagensMiddleware, ListaTodosOsTombosComLocalizacao]);

    /**
     * @swagger
     * /buscaHCF/{hcf}:
     *   get:
     *     summary: Busca um HCF específico
     *     tags: [Tombos]
     *     parameters:
     *       - in: path
     *         name: hcf
     *         required: true
     *         schema:
     *           type: string
     *         description: Código HCF
     *     responses:
     *       200:
     *         description: HCF retornado com sucesso
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 hcf:
     *                   type: integer
     *                 latitude:
     *                   type: number
     *                   nullable: true
     *                 longitude:
     *                   type: number
     *                   nullable: true
     *                 cidade:
     *                   type: object
     *                   properties:
     *                     nome:
     *                       type: string
     *                       nullable: true
     *       '404':
     *         $ref: '#/components/responses/NotFound'
     *       '500':
     *         $ref: '#/components/responses/InternalServerError'
     */
    app.route('/buscaHCF/:hcf')
        .get(buscarHcfEspecifico);

    /**
     * @swagger
     * /buscaHcfsPorAltitude/{minAltitude}/{maxAltitude}:
     *   get:
     *     summary: Busca HCFs por faixa de altitude
     *     tags: [Tombos]
     *     parameters:
     *       - in: path
     *         name: minAltitude
     *         required: true
     *         schema:
     *           type: number
     *         description: Altitude mínima
     *       - in: path
     *         name: maxAltitude
     *         required: true
     *         schema:
     *           type: number
     *         description: Altitude máxima
     *     responses:
     *       200:
     *         description: HCFs retornados com sucesso
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 total:
     *                   type: integer
     *                 resultados:
     *                   type: array
     *                   items:
     *                     type: object
     *                     properties:
     *                       hcf:
     *                         type: integer
     *                       altitude:
     *                         type: number
     *                       latitude:
     *                         type: number
     *                       longitude:
     *                         type: number
     *                       cidade:
     *                         type: object
     *                         properties:
     *                           nome:
     *                             type: string
     *                             nullable: true
     *       '500':
     *         $ref: '#/components/responses/InternalServerError'
     */
    app.route('/buscaHcfsPorAltitude/:minAltitude/:maxAltitude')
        .get(buscarHcfsPorFaixaDeAltitude);

    /**
     * @swagger
     * /pontosTaxonomiaComFiltros:
     *   get:
     *     summary: Lista pontos por taxonomia com filtros
     *     tags: [Tombos]
     *     parameters:
     *       - in: query
     *         name: nomeReino
     *         schema:
     *           type: string
     *         description: Filtrar por nome do reino
     *       - in: query
     *         name: nomeFamilia
     *         schema:
     *           type: string
     *         description: Filtrar por nome da família
     *       - in: query
     *         name: nomeSubFamilia
     *         schema:
     *           type: string
     *         description: Filtrar por nome da subfamília
     *       - in: query
     *         name: nomeGenero
     *         schema:
     *           type: string
     *         description: Filtrar por nome do gênero
     *       - in: query
     *         name: nomeEspecie
     *         schema:
     *           type: string
     *         description: Filtrar por nome da espécie
     *       - in: query
     *         name: nomeSubEspecie
     *         schema:
     *           type: string
     *         description: Filtrar por nome da subespécie
     *       - in: query
     *         name: nomeVariedade
     *         schema:
     *           type: string
     *         description: Filtrar por nome da variedade
     *     responses:
     *       200:
     *         description: Pontos retornados com sucesso
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 total:
     *                   type: integer
     *                 resultados:
     *                   type: array
     *                   items:
     *                     type: object
     *                     properties:
     *                       hcf:
     *                         type: integer
     *                       latitude:
     *                         type: number
     *                       longitude:
     *                         type: number
     *                       reino:
     *                         type: string
     *                         nullable: true
     *                       familia:
     *                         type: string
     *                         nullable: true
     *                       subFamilia:
     *                         type: string
     *                         nullable: true
     *                       genero:
     *                         type: string
     *                         nullable: true
     *                       especie:
     *                         type: string
     *                         nullable: true
     *                       subEspecie:
     *                         type: string
     *                         nullable: true
     *                       variedade:
     *                         type: string
     *                         nullable: true
     *       '500':
     *         $ref: '#/components/responses/InternalServerError'
     */
    app.route('/pontosTaxonomiaComFiltros')
        .get(buscarPontosTaxonomiaComFiltros);

    /**
     * @swagger
     * /pontosPorNomePopular:
     *   get:
     *     summary: Lista pontos por nome popular
     *     tags: [Tombos]
     *     parameters:
     *       - in: query
     *         name: nomePopular
     *         schema:
     *           type: string
     *         description: Filtrar por nome popular
     *     responses:
     *       200:
     *         description: Pontos retornados com sucesso
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 total:
     *                   type: integer
     *                 resultados:
     *                   type: array
     *                   items:
     *                     type: object
     *                     properties:
     *                       hcf:
     *                         type: integer
     *                       latitude:
     *                         type: number
     *                       longitude:
     *                         type: number
     *                       reino:
     *                         type: string
     *                         nullable: true
     *                       familia:
     *                         type: string
     *                         nullable: true
     *                       subFamilia:
     *                         type: string
     *                         nullable: true
     *                       genero:
     *                         type: string
     *                         nullable: true
     *                       especie:
     *                         type: string
     *                         nullable: true
     *                       subEspecie:
     *                         type: string
     *                         nullable: true
     *                       variedade:
     *                         type: string
     *                         nullable: true
     *       '500':
     *         $ref: '#/components/responses/InternalServerError'
     */
    app.route('/pontosPorNomePopular')
        .get(buscarPontosPorNomePopular);

    /**
     * @swagger
     * /pontosPorNomeCientifico:
     *   get:
     *     summary: Lista pontos por nome científico
     *     tags: [Tombos]
     *     parameters:
     *       - in: query
     *         name: nomeCientifico
     *         schema:
     *           type: string
     *         description: Filtrar por nome científico
     *     responses:
     *       200:
     *         description: Pontos retornados com sucesso
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 total:
     *                   type: integer
     *                 resultados:
     *                   type: array
     *                   items:
     *                     type: object
     *                     properties:
     *                       hcf:
     *                         type: integer
     *                       latitude:
     *                         type: number
     *                       longitude:
     *                         type: number
     *                       reino:
     *                         type: string
     *                         nullable: true
     *                       familia:
     *                         type: string
     *                         nullable: true
     *                       subFamilia:
     *                         type: string
     *                         nullable: true
     *                       genero:
     *                         type: string
     *                         nullable: true
     *                       especie:
     *                         type: string
     *                         nullable: true
     *                       subEspecie:
     *                         type: string
     *                         nullable: true
     *                       variedade:
     *                         type: string
     *                         nullable: true
     *       '500':
     *         $ref: '#/components/responses/InternalServerError'
     */
    app.route('/pontosPorNomeCientifico')
        .get(buscarPontosPorNomeCientifico);
    /**
     * @swagger
     * /tombos/verificarCoordenada:
     *   post:
     *     summary: Verifica se a coordenada (latitude/longitude) está dentro do polígono da cidade informada
     *     tags: [Tombos]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               cidade_id:
     *                 type: integer
     *                 description: ID da cidade a ser verificada
     *               latitude:
     *                 type: number
     *                 format: float
     *                 description: Latitude em coordenadas decimais
     *               longitude:
     *                 type: number
     *                 format: float
     *                 description: Longitude em coordenadas decimais
     *             required:
     *               - cidade_id
     *               - latitude
     *               - longitude
     *     responses:
     *       200:
     *         description: Retorna objeto com campo "dentro" indicando se o ponto está dentro do polígono
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 dentro:
     *                   type: boolean
     *       '400':
     *         $ref: '#/components/responses/BadRequest'
     *       '401':
     *         $ref: '#/components/responses/Unauthorized'
     *       '403':
     *         $ref: '#/components/responses/Forbidden'
     *       '500':
     *         $ref: '#/components/responses/InternalServerError'
     */
    app.route('/tombos/verificarCoordenada')
        .post([
            //tokensMiddleware([
             //   TIPOS_USUARIOS.CURADOR,
               // TIPOS_USUARIOS.OPERADOR,
            //]),
            verificarCoordenada,
        ]);
    };
