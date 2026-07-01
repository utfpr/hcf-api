import * as controller from '../controllers/dashboard-controller';

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Rotas para o dashboard do painel
 */
export default app => {
    /**
     * @swagger
     * /analise/tombo:
     *   get:
     *     summary: Retorna indicadores gerais dos tombos
     *     tags: [Dashboard]
     *     description: Retorna métricas consolidadas, totais e rankings utilizados no dashboard.
     *     responses:
     *       200:
     *         description: Indicadores retornados com sucesso
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 dados:
     *                   type: object
     *                   properties:
     *                     tombos:
     *                       type: object
     *                       properties:
     *                         total:
     *                           type: integer
     *                         internos:
     *                           type: integer
     *                         externos:
     *                           type: integer
     *                         fotos:
     *                           type: integer
     *                     taxonomia:
     *                       type: object
     *                       properties:
     *                         familias:
     *                           type: object
     *                           properties:
     *                             total:
     *                               type: integer
     *                             ranking:
     *                               type: array
     *                               items:
     *                                 type: object
     *                                 properties:
     *                                   nome:
     *                                     type: string
     *                                   total:
     *                                     type: integer
     *                         generos:
     *                           type: object
     *                           properties:
     *                             total:
     *                               type: integer
     *                             ranking:
     *                               type: array
     *                               items:
     *                                 type: object
     *                                 properties:
     *                                   nome:
     *                                     type: string
     *                                   total:
     *                                     type: integer
     *                         especies:
     *                           type: object
     *                           properties:
     *                             total:
     *                               type: integer
     *                             ranking:
     *                               type: array
     *                               items:
     *                                 type: object
     *                                 properties:
     *                                   nome:
     *                                     type: string
     *                                   total:
     *                                     type: integer
     *                     municipios:
     *                       type: object
     *                       properties:
     *                         total:
     *                           type: integer
     *                         ranking:
     *                           type: array
     *                           items:
     *                             type: object
     *                             properties:
     *                               nome:
     *                                 type: string
     *                               total:
     *                                 type: integer
     *                     coletores:
     *                       type: object
     *                       properties:
     *                         total:
     *                           type: integer
     *                         ranking:
     *                           type: array
     *                           items:
     *                             type: object
     *                             properties:
     *                               nome:
     *                                 type: string
     *                               total:
     *                                 type: integer
     *                     herbarios:
     *                       type: object
     *                       properties:
     *                         total:
     *                           type: integer
     *                         ranking:
     *                           type: array
     *                           items:
     *                             type: object
     *                             properties:
     *                               nome:
     *                                 type: string
     *                               total:
     *                                 type: integer
     *             example:
     *               dados:
     *                 tombos:
     *                   total: 15423
     *                   internos: 13211
     *                   externos: 2212
     *                   fotos: 48721
     *                 taxonomia:
     *                   familias:
     *                     total: 120
     *                     ranking:
     *                       - nome: Asteraceae
     *                         total: 2500
     *                 generos:
     *                   total: 540
     *                   ranking:
     *                     - nome: Solanum
     *                       total: 800
     *                 especies:
     *                   total: 1800
     *                   ranking:
     *                     - nome: amalago
     *                       total: 120
     *                 municipios:
     *                   total: 150
     *                   ranking:
     *                     - nome: Campo Mourao
     *                       total: 392
     *                 coletores:
     *                   total: 75
     *                   ranking:
     *                     - nome: Coletor #1
     *                       total: 123
     *                 herbarios:
     *                   total: 18
     *                   ranking:
     *                     - nome: Herbario da Universidade Tecnologica Federal do Parana Campus Campo Mourao
     *                       total: 567
     *       '500':
     *         $ref: '#/components/responses/InternalServerError'
     */
    app.route('/analise/tombo')
        .get([
            controller.tomboInfo,
        ]);

    /**
     * @swagger
     * /analise/temporal:
     *   get:
     *     summary: Retorna série temporal de tombos
     *     tags: [Dashboard]
     *     description: Retorna dados mensais comparando o ano informado com o ano anterior.
     *     parameters:
     *       - in: query
     *         name: ano
     *         required: false
     *         schema:
     *           type: integer
     *         description: Ano de referência para comparação. Quando não informado utiliza o ano atual.
     *     responses:
     *       200:
     *         description: Série temporal retornada com sucesso
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 meta:
     *                   type: object
     *                   properties:
     *                     ano_referencia:
     *                       type: integer
     *                     ano_comparacao:
     *                       type: integer
     *                 serie_temporal:
     *                   type: object
     *                   properties:
     *                     dados:
     *                       type: object
     *                       properties:
     *                         atual:
     *                           type: array
     *                           items:
     *                             type: object
     *                             properties:
     *                               mes:
     *                                 type: string
     *                               total:
     *                                 type: integer
     *                         passado:
     *                           type: array
     *                           items:
     *                             type: object
     *                             properties:
     *                               mes:
     *                                 type: string
     *                               total:
     *                                 type: integer
     *                     totais:
     *                       type: object
     *                       properties:
     *                         atual:
     *                           type: integer
     *                         passado:
     *                           type: integer
     *                         porcentagem:
     *                           type: number
     *                           format: float
     *             example:
     *               meta:
     *                 ano_referencia: 2026
     *                 ano_comparacao: 2025
     *               serie_temporal:
     *                 dados:
     *                   atual:
     *                     - mes: Janeiro
     *                       total: 120
     *                     - mes: Fevereiro
     *                       total: 95
     *                   passado:
     *                     - mes: Janeiro
     *                       total: 100
     *                     - mes: Fevereiro
     *                       total: 90
     *                 totais:
     *                   atual: 1250
     *                   passado: 980
     *                   porcentagem: 27.6
     *       '500':
     *         $ref: '#/components/responses/InternalServerError'
     */
    app.route('/analise/temporal')
        .get([
            controller.tomboSerieTemporal,
        ]);
};
