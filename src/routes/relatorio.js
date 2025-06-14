import listagensMiddleware from '../middlewares/listagens-middleware';
import tokensMiddleware, { TIPOS_USUARIOS } from '../middlewares/tokens-middleware';

/// relatorio/inventario-especies
const controller = require('../controllers/relatorios-controller');

/**
* @swagger
* tags:
*   name: Relatórios
*   description: Operações relacionadas aos relatórios
*/
export default app => {
    /**
     * @swagger
     * /relatorio/inventario-especies:
     *   get:
     *     summary: Obtém o relatório de inventário de espécies
     *     tags: [Relatórios]
     *     responses:
     *       200:
     *         description: Relatório retornado com sucesso
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
     *                       familia:
     *                         type: string
     *                       especies:
     *                         type: array
     *                         items:
     *                           type: object
     *                           properties:
     *                             especie:
     *                               type: string
     *                             tombos:
     *                               type: string
     *                             quantidadeDeTombos:
     *                               type: integer
     */
    app.route('/relatorio/inventario-especies')
        .get([
            tokensMiddleware([
                TIPOS_USUARIOS.CURADOR,
                TIPOS_USUARIOS.OPERADOR,
                TIPOS_USUARIOS.IDENTIFICADOR,
            ]),
            listagensMiddleware,
            controller.obtemDadosDoRelatorioDeInventarioDeEspecies,
        ])
        /**
         * @swagger
         * /relatorio/inventario-especies:
         *   post:
         *     summary: Obtém o relatório de inventário de espécies (com filtros)
         *     tags: [Relatórios]
         *     requestBody:
         *       required: false
         *       content:
         *         application/json:
         *           schema:
         *             type: object
         *             properties:
         *               filtro:
         *                 type: string
         *                 description: Filtro opcional
         *           example:
         *             filtro: "Fabaceae"
         *     responses:
         *       200:
         *         description: Relatório retornado com sucesso
         *         content:
         *           application/json:
         *             schema:
         *               type: array
         *               items:
         *                 type: object
         *                 properties:
         *                   especie:
         *                     type: string
         *                   quantidade:
         *                     type: integer
         *               example:
         *                 - especie: "Fabaceae sp."
         *                   quantidade: 8
         */
        .post([
            tokensMiddleware([
                TIPOS_USUARIOS.CURADOR,
                TIPOS_USUARIOS.OPERADOR,
                TIPOS_USUARIOS.IDENTIFICADOR,
            ]),
            listagensMiddleware,
            controller.obtemDadosDoRelatorioDeInventarioDeEspecies,
        ]);

    /**
     * @swagger
     * /relatorio/coleta-por-local-intervalo-de-data:
     *   get:
     *     summary: Obtém relatório de coletas por local e intervalo de data
     *     tags: [Relatórios]
     *     responses:
     *       200:
     *         description: Relatório retornado com sucesso
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 type: object
     *                 properties:
     *                   local:
     *                     type: string
     *                   quantidade:
     *                     type: integer
     *               example:
     *                 - local: "Parque Estadual"
     *                   quantidade: 5
     */
    app.route('/relatorio/coleta-por-local-intervalo-de-data')
        .get([
            tokensMiddleware([
                TIPOS_USUARIOS.CURADOR,
                TIPOS_USUARIOS.OPERADOR,
                TIPOS_USUARIOS.IDENTIFICADOR,
            ]),
            listagensMiddleware,
            controller.obtemDadosDoRelatorioDeColetaPorLocalEIntervaloDeData,
        ])
        /**
         * @swagger
         * /relatorio/coleta-por-local-intervalo-de-data:
         *   post:
         *     summary: Obtém relatório de coletas por local e intervalo de data (com filtros)
         *     tags: [Relatórios]
         *     requestBody:
         *       required: false
         *       content:
         *         application/json:
         *           schema:
         *             type: object
         *             properties:
         *               data_inicio:
         *                 type: string
         *                 format: date
         *               data_fim:
         *                 type: string
         *                 format: date
         *           example:
         *             data_inicio: "2025-01-01"
         *             data_fim: "2025-06-01"
         *     responses:
         *       200:
         *         description: Relatório retornado com sucesso
         *         content:
         *           application/json:
         *             schema:
         *               type: array
         *               items:
         *                 type: object
         *                 properties:
         *                   local:
         *                     type: string
         *                   quantidade:
         *                     type: integer
         *               example:
         *                 - local: "Parque Estadual"
         *                   quantidade: 5
         */
        .post([
            listagensMiddleware,
            controller.obtemDadosDoRelatorioDeColetaPorLocalEIntervaloDeData,
        ]);

    /**
     * @swagger
     * /relatorio/coleta-por-intervalo-de-data:
     *   get:
     *     summary: Obtém relatório de coletas por intervalo de data
     *     tags: [Relatórios]
     *     responses:
     *       200:
     *         description: Relatório retornado com sucesso
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 type: object
     *                 properties:
     *                   data:
     *                     type: string
     *                     format: date
     *                   quantidade:
     *                     type: integer
     *               example:
     *                 - data: "2025-06-01"
     *                   quantidade: 2
     */
    app.route('/relatorio/coleta-por-intervalo-de-data')
        .get([
            listagensMiddleware,
            controller.obtemDadosDoRelatorioDeColetaIntervaloDeData,
        ])
        /**
         * @swagger
         * /relatorio/coleta-por-intervalo-de-data:
         *   post:
         *     summary: Obtém relatório de coletas por intervalo de data (com filtros)
         *     tags: [Relatórios]
         *     requestBody:
         *       required: false
         *       content:
         *         application/json:
         *           schema:
         *             type: object
         *             properties:
         *               data_inicio:
         *                 type: string
         *                 format: date
         *               data_fim:
         *                 type: string
         *                 format: date
         *           example:
         *             data_inicio: "2025-01-01"
         *             data_fim: "2025-06-01"
         *     responses:
         *       200:
         *         description: Relatório retornado com sucesso
         *         content:
         *           application/json:
         *             schema:
         *               type: array
         *               items:
         *                 type: object
         *                 properties:
         *                   data:
         *                     type: string
         *                     format: date
         *                   quantidade:
         *                     type: integer
         *               example:
         *                 - data: "2025-06-01"
         *                   quantidade: 2
         */
        .post([
            listagensMiddleware,
            controller.obtemDadosDoRelatorioDeColetaIntervaloDeData,
        ]);
};
