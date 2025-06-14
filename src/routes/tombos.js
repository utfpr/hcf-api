import {
    ListaTodosOsTombosComLocalizacao, buscarHcfEspecifico,
    buscarHcfsPorFaixaDeAltitude, buscarPontosTaxonomiaComFiltros, buscarPontosPorNomePopular, buscarPontosPorNomeCientifico,
} from '../controllers/cidades-controller';
import fichaTomboController from '../controllers/fichas-tombos-controller';
import {
    getDadosCadTombo, getNumeroTombo, cadastro, listagem,
    desativar, obterTombo, cadastrarTipo, buscarTipos, cadastrarColetores, buscarColetores,
    buscarProximoNumeroColetor, alteracao, getNumeroColetor, getUltimoNumeroTombo, getCodigoBarraTombo,
    editarCodigoBarra, deletarCodigoBarra, getUltimoNumeroCodigoBarras,
} from '../controllers/tombos-controller';
import exportarTombosController from '../controllers/tombos-exportacoes-controller';
import criaJsonMiddleware from '../middlewares/json-middleware';
import listagensMiddleware from '../middlewares/listagens-middleware';
import tokensMiddleware, { TIPOS_USUARIOS } from '../middlewares/tokens-middleware';
import validacoesMiddleware from '../middlewares/validacoes-middleware';
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
     *         description: Número do coletor retornado com sucesso
     */
    app.route('/tombos/numeroColetor/:idColetor')
        .get([
            getNumeroColetor,
        ]);

    /**
     * @swagger
     * /tombos/codBarras/{idTombo}:
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
     *   delete:
     *     summary: Remove o código de barras de um tombo
     *     tags: [Tombos]
     *     parameters:
     *       - in: path
     *         name: idTombo
     *         required: true
     *         schema:
     *           type: integer
     *         description: ID do tombo
     *     responses:
     *       204:
     *         description: Código de barras removido com sucesso
     */
    app.route('/tombos/codBarras/:idTombo')
        .get([
            getCodigoBarraTombo,
        ])
        .delete([
            tokensMiddleware([
                TIPOS_USUARIOS.CURADOR,
                TIPOS_USUARIOS.OPERADOR,
                TIPOS_USUARIOS.IDENTIFICADOR,
            ]),
            deletarCodigoBarra,
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
     *         description: Tombo retornado com sucesso
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
     */
    app.route('/tombos/filtrar_ultimo_numero')
        .get([
            getUltimoNumeroTombo,
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
     *       400:
     *         description: Dados inválidos
     *   get:
     *     summary: Lista todos os tombos
     *     tags: [Tombos]
     *     responses:
     *       200:
     *         description: Lista de tombos retornada com sucesso
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 type: object
     *                 properties:
     *                   id:
     *                     type: integer
     *                   numero:
     *                     type: string
     *                   coletor:
     *                     type: string
     *                   data_coleta:
     *                     type: string
     *                     format: date
     *                   local:
     *                     type: string
     *               example:
     *                 - id: 1
     *                   numero: "12345"
     *                   coletor: "João"
     *                   data_coleta: "2025-06-05"
     *                   local: "Parque Estadual"
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
     *       400:
     *         description: Dados inválidos
     *       404:
     *         description: Tombo não encontrado
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
     *       404:
     *         description: Tombo não encontrado
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
     *               example:
     *                 id: 1
     *                 numero: "12345"
     *                 coletor: "João"
     *                 data_coleta: "2025-06-05"
     *                 local: "Parque Estadual"
     *       404:
     *         description: Tombo não encontrado
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
     *       400:
     *         description: Dados inválidos
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
     *       400:
     *         description: Dados inválidos
     *   get:
     *     summary: Lista todos os coletores
     *     tags: [Tombos]
     *     responses:
     *       200:
     *         description: Lista de coletores retornada com sucesso
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
     *                   nome: "João"
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
     * /numero-coletores:
     *   get:
     *     summary: Obtém o próximo número de coletor
     *     tags: [Tombos]
     *     responses:
     *       200:
     *         description: Próximo número retornado com sucesso
     */
    app.route('/numero-coletores')
        .get([
            tokensMiddleware([
                TIPOS_USUARIOS.CURADOR, TIPOS_USUARIOS.OPERADOR,
            ]),
            buscarProximoNumeroColetor,
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
     *         description: Ficha gerada com sucesso
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
     */
    app.route('/pontos')
        .get([listagensMiddleware, ListaTodosOsTombosComLocalizacao]);

    /**
     * @swagger
     * /buscaHCF/{hcf}:
     *   get:
     *     summary: Busca HCF específico
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
     */
    app.route('/buscaHcfsPorAltitude/:minAltitude/:maxAltitude')
        .get(buscarHcfsPorFaixaDeAltitude);

    /**
     * @swagger
     * /pontosTaxonomiaComFiltros:
     *   get:
     *     summary: Lista pontos por taxonomia com filtros
     *     tags: [Tombos]
     *     responses:
     *       200:
     *         description: Pontos retornados com sucesso
     */
    app.route('/pontosTaxonomiaComFiltros')
        .get(buscarPontosTaxonomiaComFiltros);

    /**
     * @swagger
     * /pontosPorNomePopular:
     *   get:
     *     summary: Lista pontos por nome popular
     *     tags: [Tombos]
     *     responses:
     *       200:
     *         description: Pontos retornados com sucesso
     */
    app.route('/pontosPorNomePopular')
        .get(buscarPontosPorNomePopular);

    /**
     * @swagger
     * /pontosPorNomeCientifico:
     *   get:
     *     summary: Lista pontos por nome científico
     *     tags: [Tombos]
     *     responses:
     *       200:
     *         description: Pontos retornados com sucesso
     */
    app.route('/pontosPorNomeCientifico')
        .get(buscarPontosPorNomeCientifico);
};
