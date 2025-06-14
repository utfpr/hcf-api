import listagensMiddleware from '../middlewares/listagens-middleware';
import tokensMiddleware, { TIPOS_USUARIOS } from '../middlewares/tokens-middleware';

const controller = require('../controllers/remessa-controller');

/**
* @swagger
* tags:
*   name: Remessas
*   description: Operações relacionadas às remessas
*/
export default app => {
    /**
     * @swagger
     * /remessas:
     *   post:
     *     summary: Cadastra uma nova remessa
     *     tags: [Remessas]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               remessa:
     *                 type: object
     *                 properties:
     *                   herbario_id:
     *                     type: integer
     *                     description: ID do herbário de origem da remessa
     *                   entidade_destino_id:
     *                     type: integer
     *                     description: ID do herbário de destino da remessa
     *                   observacao:
     *                     type: string
     *                     description: Observações sobre a remessa
     *                   data_envio:
     *                     type: string
     *                     format: date-time
     *                     description: Data de envio da remessa
     *                 required:
     *                   - herbario_id
     *                   - entidade_destino_id
     *               tombos:
     *                 type: array
     *                 items:
     *                   type: object
     *                   properties:
     *                     hcf:
     *                       type: string
     *                       description: Identificador HCF do tombo
     *                     tipo:
     *                       type: string
     *                       description: Tipo de movimentação do tomboa
     *                     data_vencimento:
     *                       type: string
     *                       format: date
     *                       description: Data de vencimento para o item da remessa (opcional)
     *                   required:
     *                     - hcf
     *                     - tipo
     *             required:
     *               - remessa
     *               - tombos
     *     responses:
     *       201:
     *         description: Remessa cadastrada com sucesso (sem corpo de resposta)
     *       400:
     *         description: Dados inválidos
     *   get:
     *     summary: Lista todas as remessas
     *     tags: [Remessas]
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
     *         name: numero_remessa
     *         schema:
     *           type: string
     *         description:
     *       - in: query
     *         name: numero_tombo
     *         schema:
     *           type: string
     *         description: Filtrar pelo número do tombo (HCF)
     *       - in: query
     *         name: numero_herbario
     *         schema:
     *           type: string
     *         description: Filtrar pelo nome ou sigla do herbário de origem ou destino
     *     responses:
     *       200:
     *         description: Lista de remessas
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
     *                   type: object
     *                   properties:
     *                     remessas:
     *                       type: array
     *                       items:
     *                         type: object
     *                         properties:
     *                           id:
     *                             type: integer
     *                           herbario_id:
     *                             type: integer
     *                           entidade_destino_id:
     *                             type: integer
     *                           observacao:
     *                             type: string
     *                           data_envio:
     *                             type: string
     *                             format: date-time
     *                           tombos:
     *                             type: array
     *                             items:
     *                               type: object
     *                               properties:
     *                                 hcf:
     *                                   type: string
     *                     herbarios:
     *                       type: array
     *                       items:
     *                         type: object
     *                         properties:
     *                           id:
     *                             type: integer
     *                           nome:
     *                             type: string
     *                           sigla:
     *                             type: string
     */
    app.route('/remessas')
        .post([
            tokensMiddleware([
                TIPOS_USUARIOS.CURADOR, TIPOS_USUARIOS.OPERADOR,
            ]),
            controller.cadastro,
        ])
        .get([
            listagensMiddleware,
            controller.listagem,
        ]);

    /**
     * @swagger
     * /remessas/{remessa_id}:
     *   put:
     *     summary: Altera uma remessa
     *     tags: [Remessas]
     *     parameters:
     *       - in: path
     *         name: remessa_id
     *         required: true
     *         schema:
     *           type: integer
     *         description: ID da remessa
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               remessa:
     *                 type: object
     *                 properties:
     *                   herbario_id:
     *                     type: integer
     *                     description: ID do herbário de origem da remessa
     *                   entidade_destino_id:
     *                     type: integer
     *                     description: ID do herbário de destino da remessa
     *                   observacao:
     *                     type: string
     *                     description: Observações sobre a remessa
     *                   data_envio:
     *                     type: string
     *                     format: date-time
     *                     description: Data de envio da remessa
     *                 required:
     *                   - herbario_id
     *                   - entidade_destino_id
     *               tombos:
     *                 type: array
     *                 items:
     *                   type: object
     *                   properties:
     *                     hcf:
     *                       type: string
     *                       description: Identificador HCF do tombo
     *                     tipo:
     *                       type: string
     *                       description: Tipo de movimentação do tombo
     *                     data_vencimento:
     *                       type: string
     *                       format: date
     *                       description: Data de vencimento para o item da remessa (opcional)
     *                   required:
     *                     - hcf
     *                     - tipo
     *             required:
     *               - remessa
     *               - tombos
     *           example:
     *             remessa:
     *               herbario_id: 1
     *               entidade_destino_id: 2
     *               observacao: "Observação atualizada da remessa."
     *               data_envio: "2023-11-01T10:00:00Z"
     *             tombos:
     *               - hcf: "HCF789"
     *                 tipo: "DOACAO"
     *     responses:
     *       204:
     *         description: Remessa alterada com sucesso
     *       400:
     *         description: Dados inválidos
     *       404:
     *         description: Remessa não encontrada
     *   delete:
     *     summary: Remove uma remessa
     *     tags: [Remessas]
     *     parameters:
     *       - in: path
     *         name: remessa_id
     *         required: true
     *         schema:
     *           type: integer
     *         description: ID da remessa
     *     responses:
     *       204:
     *         description: Remessa removida com sucesso
     *       404:
     *         description: Remessa não encontrada
     *   get:
     *     summary: Busca uma remessa pelo ID
     *     tags: [Remessas]
     *     parameters:
     *       - in: path
     *         name: remessa_id
     *         required: true
     *         schema:
     *           type: integer
     *         description: ID da remessa
     *     responses:
     *       200:
     *         description: Dados da remessa encontrados
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 remessa:
     *                   type: object
     *                   properties:
     *                     id:
     *                       type: integer
     *                     herbario_id:
     *                       type: integer
     *                     entidade_destino_id:
     *                       type: integer
     *                     observacao:
     *                       type: string
     *                     data_envio:
     *                       type: string
     *                       format: date-time
     *                     Tombos:
     *                       type: array
     *                       items:
     *                         type: object
     *                         properties:
     *                           hcf:
     *                             type: string
     *               example:
     *                 remessa:
     *                   id: 1
     *                   herbario_id: 1
     *                   entidade_destino_id: 2
     *                   observacao: "Remessa de amostras para estudo."
     *                   data_envio: "2023-10-26T10:00:00Z"
     *                   createdAt: "2023-10-26T10:00:00Z"
     *                   updatedAt: "2023-10-26T10:00:00Z"
     *                   Tombos:
     *                     - hcf: "HCF123"
     *                     - hcf: "HCF456"
     *       404:
     *         description: Remessa não encontrada      
     */
    app.route('/remessas/:remessa_id')
        .put([
            tokensMiddleware([
                TIPOS_USUARIOS.CURADOR, TIPOS_USUARIOS.OPERADOR,
            ]),
            controller.alteracao,
        ])
        .delete([
            tokensMiddleware([
                TIPOS_USUARIOS.CURADOR, TIPOS_USUARIOS.OPERADOR,
            ]),
            controller.exclusao,
        ])
        .get([
            controller.buscarRemessa,
        ]);

    /**
     * @swagger
     * /remessas-devolver:
     *   get:
     *     summary: Devolve tombos de remessas que estão vencidos
     *     tags: [Remessas]
     *     description: Esta rota verifica todos os tombos emprestados cuja data de vencimento já passou e os marca como devolvidos, atualizando seu status para disponível.
     *     responses:
     *       200:
     *         description: Tombos devolvidos com sucesso ou nenhuma ação necessária.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 sucesso:
     *                   type: boolean
     *                 mensagem:
     *                   type: string
     *                 tombosDevolvidos:
     *                   type: integer 
     *                   description: Número de tombos que foram efetivamente devolvidos nesta operação.
     *               example:
     *                 sucesso: true
     *                 mensagem: "Processo de devolução concluído."
     *                 tombosDevolvidos: 5
     *       500:
     *         description: Erro interno no servidor durante o processo de devolução.
     */
    app.route('/remessas-devolver')
        .get([
            tokensMiddleware([
                TIPOS_USUARIOS.CURADOR, TIPOS_USUARIOS.OPERADOR,
            ]),
            controller.devolverTombo,
        ]);
};
